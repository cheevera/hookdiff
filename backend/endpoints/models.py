import uuid

from django.db import models


class Endpoint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.CharField(max_length=32, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.slug


class WebhookRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    endpoint = models.ForeignKey(
        Endpoint, on_delete=models.CASCADE, related_name="requests"
    )
    method = models.CharField(max_length=10)
    headers = models.JSONField(default=dict)
    body = models.JSONField(default=dict)
    query_params = models.JSONField(default=dict)
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["endpoint", "received_at"]),
        ]
        ordering = ["-received_at"]

    def __str__(self):
        return f"{self.method} {self.endpoint.slug} @ {self.received_at}"
