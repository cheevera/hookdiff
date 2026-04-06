from rest_framework import serializers

from endpoints.models import Endpoint


class EndpointSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Endpoint
        fields = ["slug", "url", "created_at"]
        read_only_fields = ["slug", "created_at"]

    def get_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/hooks/{obj.slug}/")
        return f"/hooks/{obj.slug}/"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["createdAt"] = data.pop("created_at")
        return data
