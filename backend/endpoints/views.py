import secrets

from django.db import IntegrityError
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from endpoints.models import Endpoint
from endpoints.serializers import EndpointSerializer

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
