import json
import secrets
from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import IntegrityError, models, transaction
from django.http import HttpRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.response import Response

from endpoints.models import Endpoint, WebhookRequest
from endpoints.serializers import EndpointSerializer, WebhookRequestSerializer

MAX_SLUG_RETRIES = 10
MAX_BODY_BYTES = 1_048_576  # 1 MB

STRIPPED_HEADERS = {
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-proto",
    "x-real-ip",
}

STRIPPED_PREFIXES = ("x-amzn-", "cf-")


def generate_slug() -> str:
    return secrets.token_urlsafe(6)


def filter_headers(headers: dict[str, str]) -> dict[str, str]:
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in STRIPPED_HEADERS
        and not key.lower().startswith(STRIPPED_PREFIXES)
    }


class EndpointCreate(generics.CreateAPIView[Endpoint]):
    serializer_class = EndpointSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        for _ in range(MAX_SLUG_RETRIES):
            slug = generate_slug()
            try:
                with transaction.atomic():
                    endpoint = Endpoint.objects.create(slug=slug)
            except IntegrityError:
                continue
            serializer = self.get_serializer(endpoint)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(
            {"error": "Failed to generate unique slug"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class RequestList(generics.ListAPIView[WebhookRequest]):
    serializer_class = WebhookRequestSerializer

    def get_queryset(self) -> models.QuerySet[WebhookRequest]:
        endpoint = get_object_or_404(Endpoint, slug=self.kwargs["slug"])
        return endpoint.requests.all()

    def delete(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        queryset = self.get_queryset()
        queryset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RequestDetail(generics.RetrieveDestroyAPIView[WebhookRequest]):
    serializer_class = WebhookRequestSerializer
    lookup_url_kwarg = "request_id"

    def get_queryset(self) -> models.QuerySet[WebhookRequest]:
        return WebhookRequest.objects.filter(endpoint__slug=self.kwargs["slug"])


# Explicit: CsrfViewMiddleware is not enabled, but this documents that
# the endpoint is intentionally unprotected.
@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "PATCH", "DELETE"])
def receive_webhook(request: HttpRequest, slug: str) -> JsonResponse:
    endpoint = get_object_or_404(Endpoint, slug=slug)

    if len(request.body) > MAX_BODY_BYTES:
        return JsonResponse(
            {"error": f"Request body exceeds {MAX_BODY_BYTES} byte limit"},
            status=413,
        )

    content_type = request.content_type or ""
    if "application/json" not in content_type:
        return JsonResponse(
            {"error": "Content-Type must be application/json"},
            status=400,
        )

    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    raw_headers = {key: value for key, value in request.headers.items()}
    filtered_headers = filter_headers(raw_headers)

    # request.method is guaranteed non-None by @require_http_methods
    assert request.method is not None
    webhook_request = WebhookRequest.objects.create(
        endpoint=endpoint,
        method=request.method,
        headers=filtered_headers,
        body=body,
        query_params=request.GET.dict(),
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"endpoint_{slug}",
        {
            "type": "request.received",
            "message": {
                "type": "request.received",
                "request": WebhookRequestSerializer(webhook_request).data,
            },
        },
    )

    return JsonResponse({"success": True})
