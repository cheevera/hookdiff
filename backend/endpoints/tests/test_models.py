import pytest
from django.apps import apps

from endpoints.models import Endpoint, WebhookRequest
from endpoints.serializers import EndpointSerializer


@pytest.mark.django_db
def test_endpoint_save_and_retrieve():
    endpoint = Endpoint.objects.create(slug="abc123")
    retrieved = Endpoint.objects.get(pk=endpoint.pk)
    assert retrieved.slug == "abc123"
    assert retrieved.created_at is not None
    assert str(retrieved) == "abc123"


@pytest.mark.django_db
def test_webhook_request_save_and_retrieve():
    endpoint = Endpoint.objects.create(slug="test-ep")
    request = WebhookRequest.objects.create(
        endpoint=endpoint,
        method="POST",
        headers={"content-type": "application/json"},
        body={"key": "value"},
        query_params={"page": "1"},
    )
    retrieved = WebhookRequest.objects.get(pk=request.pk)
    assert retrieved.method == "POST"
    assert retrieved.headers == {"content-type": "application/json"}
    assert retrieved.body == {"key": "value"}
    assert retrieved.query_params == {"page": "1"}
    assert retrieved.received_at is not None
    assert str(retrieved).startswith("POST test-ep @")


@pytest.mark.django_db
def test_cascade_delete():
    endpoint = Endpoint.objects.create(slug="delete-me")
    WebhookRequest.objects.create(endpoint=endpoint, method="GET")
    endpoint.delete()
    assert WebhookRequest.objects.count() == 0


@pytest.mark.django_db
def test_ordering_is_reverse_chronological():
    endpoint = Endpoint.objects.create(slug="order-test")
    r1 = WebhookRequest.objects.create(endpoint=endpoint, method="GET")
    r2 = WebhookRequest.objects.create(endpoint=endpoint, method="POST")
    requests = list(WebhookRequest.objects.all())
    assert requests[0].pk == r2.pk
    assert requests[1].pk == r1.pk


@pytest.mark.django_db
def test_endpoint_serializer_url_without_request_context():
    endpoint = Endpoint.objects.create(slug="noreq123")
    data = EndpointSerializer(endpoint).data
    assert data["url"] == "/hooks/noreq123/"


def test_compound_index_in_migration():
    migration = apps.get_app_config("endpoints")
    model = migration.get_model("WebhookRequest")
    index_field_names = [idx.fields for idx in model._meta.indexes]
    assert ["endpoint", "received_at"] in index_field_names
