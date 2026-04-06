import json
from unittest.mock import patch

import pytest

from endpoints.models import Endpoint, WebhookRequest


@pytest.fixture
def endpoint():
    return Endpoint.objects.create(slug="hook-test")


@pytest.mark.django_db
def test_valid_json_post(client, endpoint):
    response = client.post(
        f"/hooks/{endpoint.slug}/",
        data=json.dumps({"key": "value"}),
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert WebhookRequest.objects.count() == 1
    req = WebhookRequest.objects.first()
    assert req.method == "POST"
    assert req.body == {"key": "value"}


@pytest.mark.django_db
def test_valid_json_put(client, endpoint):
    response = client.put(
        f"/hooks/{endpoint.slug}/",
        data=json.dumps({"updated": True}),
        content_type="application/json",
    )
    assert response.status_code == 200
    req = WebhookRequest.objects.first()
    assert req.method == "PUT"


@pytest.mark.django_db
def test_valid_json_patch(client, endpoint):
    response = client.patch(
        f"/hooks/{endpoint.slug}/",
        data=json.dumps({"partial": True}),
        content_type="application/json",
    )
    assert response.status_code == 200
    req = WebhookRequest.objects.first()
    assert req.method == "PATCH"


@pytest.mark.django_db
def test_valid_json_delete(client, endpoint):
    response = client.delete(
        f"/hooks/{endpoint.slug}/",
        data=json.dumps({"id": 1}),
        content_type="application/json",
    )
    assert response.status_code == 200
    req = WebhookRequest.objects.first()
    assert req.method == "DELETE"


@pytest.mark.django_db
def test_valid_json_get(client, endpoint):
    response = client.get(
        f"/hooks/{endpoint.slug}/",
        content_type="application/json",
        data=json.dumps({}),
    )
    assert response.status_code == 200
    req = WebhookRequest.objects.first()
    assert req.method == "GET"


@pytest.mark.django_db
def test_rejects_non_json_content_type(client, endpoint):
    response = client.post(
        f"/hooks/{endpoint.slug}/",
        data="not json",
        content_type="text/plain",
    )
    assert response.status_code == 400
    assert WebhookRequest.objects.count() == 0


@pytest.mark.django_db
def test_rejects_missing_content_type(client, endpoint):
    response = client.post(
        f"/hooks/{endpoint.slug}/",
        data="not json",
    )
    assert response.status_code == 400
    assert WebhookRequest.objects.count() == 0


@pytest.mark.django_db
def test_rejects_invalid_json_body(client, endpoint):
    response = client.post(
        f"/hooks/{endpoint.slug}/",
        data="{invalid",
        content_type="application/json",
    )
    assert response.status_code == 400
    assert WebhookRequest.objects.count() == 0


@pytest.mark.django_db
def test_404_for_unknown_slug(client):
    response = client.post(
        "/hooks/nonexistent/",
        data=json.dumps({}),
        content_type="application/json",
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_strips_proxy_headers(client, endpoint):
    response = client.post(
        f"/hooks/{endpoint.slug}/",
        data=json.dumps({"test": True}),
        content_type="application/json",
        HTTP_X_FORWARDED_FOR="1.2.3.4",
        HTTP_X_FORWARDED_HOST="proxy.example.com",
        HTTP_X_FORWARDED_PROTO="https",
        HTTP_X_REAL_IP="1.2.3.4",
        HTTP_X_AMZN_TRACE_ID="Root=1-abc",
        HTTP_CF_CONNECTING_IP="1.2.3.4",
    )
    assert response.status_code == 200
    req = WebhookRequest.objects.first()
    headers_lower = {k.lower(): v for k, v in req.headers.items()}
    assert "x-forwarded-for" not in headers_lower
    assert "x-forwarded-host" not in headers_lower
    assert "x-forwarded-proto" not in headers_lower
    assert "x-real-ip" not in headers_lower
    assert not any(k.startswith("x-amzn-") for k in headers_lower)
    assert not any(k.startswith("cf-") for k in headers_lower)


@pytest.mark.django_db
def test_preserves_custom_headers(client, endpoint):
    response = client.post(
        f"/hooks/{endpoint.slug}/",
        data=json.dumps({"test": True}),
        content_type="application/json",
        HTTP_X_CUSTOM_HEADER="keep-me",
    )
    assert response.status_code == 200
    req = WebhookRequest.objects.first()
    headers_lower = {k.lower(): v for k, v in req.headers.items()}
    assert "x-custom-header" in headers_lower
    assert headers_lower["x-custom-header"] == "keep-me"


@pytest.mark.django_db
def test_stores_query_params(client, endpoint):
    response = client.post(
        f"/hooks/{endpoint.slug}/?source=test&debug=1",
        data=json.dumps({}),
        content_type="application/json",
    )
    assert response.status_code == 200
    req = WebhookRequest.objects.first()
    assert req.query_params["source"] == "test"
    assert req.query_params["debug"] == "1"


@pytest.mark.django_db
def test_publishes_to_channel_layer(client, endpoint):
    with patch("endpoints.views.get_channel_layer") as mock_layer:
        mock_send = mock_layer.return_value.group_send
        mock_send.return_value = None
        response = client.post(
            f"/hooks/{endpoint.slug}/",
            data=json.dumps({"notify": True}),
            content_type="application/json",
        )
    assert response.status_code == 200
    mock_send.assert_called_once()
    call_args = mock_send.call_args
    assert call_args[0][0] == f"endpoint_{endpoint.slug}"
    message = call_args[0][1]
    assert message["type"] == "request.received"
    assert message["message"]["type"] == "request.received"
    assert "request" in message["message"]
