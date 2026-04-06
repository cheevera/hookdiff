import json
import secrets

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import generics, status
from rest_framework.response import Response

from endpoints.models import Endpoint, WebhookRequest
from endpoints.serializers import EndpointSerializer, WebhookRequestSerializer

MAX_SLUG_RETRIES = 10

STRIPPED_HEADERS = {
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-proto",
    "x-real-ip",
}

STRIPPED_PREFIXES = ("x-amzn-", "cf-")


def generate_slug():
    return secrets.token_urlsafe(6)


def filter_headers(headers):
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in STRIPPED_HEADERS
        and not key.lower().startswith(STRIPPED_PREFIXES)
    }


class EndpointCreate(generics.CreateAPIView):
    serializer_class = EndpointSerializer

    def create(self, request, *args, **kwargs):
        for _ in range(MAX_SLUG_RETRIES):
            slug = generate_slug()
            try:
                endpoint = Endpoint.objects.create(slug=slug)
            except IntegrityError:
                continue
            serializer = self.get_serializer(endpoint)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(
            {"error": "Failed to generate unique slug"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class RequestList(generics.ListAPIView):
    serializer_class = WebhookRequestSerializer

    def get_queryset(self):
        endpoint = get_object_or_404(Endpoint, slug=self.kwargs["slug"])
        return endpoint.requests.all()

    def delete(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        queryset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RequestDetail(generics.RetrieveDestroyAPIView):
    serializer_class = WebhookRequestSerializer
    lookup_url_kwarg = "request_id"

    def get_queryset(self):
        return WebhookRequest.objects.filter(endpoint__slug=self.kwargs["slug"])


@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
def receive_webhook(request, slug):
    endpoint = get_object_or_404(Endpoint, slug=slug)

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

    webhook_request = WebhookRequest.objects.create(
        endpoint=endpoint,
        method=request.method,
        headers=filtered_headers,
        body=body,
        query_params=dict(request.GET),
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
