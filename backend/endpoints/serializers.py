from typing import Any

from rest_framework import serializers

from endpoints.models import Endpoint, WebhookRequest


class EndpointSerializer(serializers.ModelSerializer[Endpoint]):
    url = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Endpoint
        fields = ["slug", "url", "created_at"]
        read_only_fields = ["slug", "created_at"]

    def get_url(self, obj: Endpoint) -> str:
        request = self.context.get("request")
        if request:
            return str(request.build_absolute_uri(f"/hooks/{obj.slug}/"))
        return f"/hooks/{obj.slug}/"

    def to_representation(self, instance: Endpoint) -> dict[str, Any]:
        data = super().to_representation(instance)
        data["createdAt"] = data.pop("created_at")
        return data


class WebhookRequestSerializer(serializers.ModelSerializer[WebhookRequest]):
    received_at = serializers.DateTimeField(read_only=True)
    query_params = serializers.JSONField()

    class Meta:
        model = WebhookRequest
        fields = ["id", "method", "headers", "body", "query_params", "received_at"]

    def to_representation(self, instance: WebhookRequest) -> dict[str, Any]:
        data = super().to_representation(instance)
        data["receivedAt"] = data.pop("received_at")
        data["queryParams"] = data.pop("query_params")
        return data
