import secrets

from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from endpoints.models import Endpoint, WebhookRequest
from endpoints.serializers import EndpointSerializer, WebhookRequestSerializer

MAX_SLUG_RETRIES = 10


def generate_slug():
    return secrets.token_urlsafe(6)


@api_view(["POST"])
def create_endpoint(request):
    for _ in range(MAX_SLUG_RETRIES):
        slug = generate_slug()
        try:
            endpoint = Endpoint.objects.create(slug=slug)
        except IntegrityError:
            continue
        serializer = EndpointSerializer(endpoint, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(
        {"error": "Failed to generate unique slug"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


@api_view(["GET"])
def list_requests(request, slug):
    endpoint = get_object_or_404(Endpoint, slug=slug)
    requests = endpoint.requests.all()
    serializer = WebhookRequestSerializer(requests, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_request(request, slug, request_id):
    endpoint = get_object_or_404(Endpoint, slug=slug)
    webhook_request = get_object_or_404(
        WebhookRequest, pk=request_id, endpoint=endpoint
    )
    serializer = WebhookRequestSerializer(webhook_request)
    return Response(serializer.data)
