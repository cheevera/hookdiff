import pytest

from endpoints.models import Endpoint, WebhookRequest


@pytest.mark.django_db
def test_list_requests_returns_200(client):
    endpoint = Endpoint.objects.create(slug="list-test")
    WebhookRequest.objects.create(
        endpoint=endpoint,
        method="POST",
        headers={"content-type": "application/json"},
        body={"key": "value"},
        query_params={"page": "1"},
    )
    response = client.get("/api/endpoints/list-test/requests/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    req = data[0]
    assert req["method"] == "POST"
    assert req["headers"] == {"content-type": "application/json"}
    assert req["body"] == {"key": "value"}
    assert req["queryParams"] == {"page": "1"}
    assert "receivedAt" in req
    assert "id" in req


@pytest.mark.django_db
def test_list_requests_returns_reverse_chronological(client):
    endpoint = Endpoint.objects.create(slug="order-test")
    r1 = WebhookRequest.objects.create(endpoint=endpoint, method="GET")
    r2 = WebhookRequest.objects.create(endpoint=endpoint, method="POST")
    response = client.get("/api/endpoints/order-test/requests/")
    data = response.json()
    assert data[0]["id"] == str(r2.pk)
    assert data[1]["id"] == str(r1.pk)


@pytest.mark.django_db
def test_list_requests_empty(client):
    Endpoint.objects.create(slug="empty-ep")
    response = client.get("/api/endpoints/empty-ep/requests/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db
def test_list_requests_404_unknown_slug(client):
    response = client.get("/api/endpoints/nonexistent/requests/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_get_single_request(client):
    endpoint = Endpoint.objects.create(slug="single-test")
    req = WebhookRequest.objects.create(
        endpoint=endpoint,
        method="PUT",
        body={"updated": True},
    )
    response = client.get(f"/api/endpoints/single-test/requests/{req.pk}/")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(req.pk)
    assert data["method"] == "PUT"
    assert data["body"] == {"updated": True}


@pytest.mark.django_db
def test_get_single_request_404_wrong_endpoint(client):
    ep1 = Endpoint.objects.create(slug="ep-one")
    ep2 = Endpoint.objects.create(slug="ep-two")
    req = WebhookRequest.objects.create(endpoint=ep1, method="GET")
    response = client.get(f"/api/endpoints/{ep2.slug}/requests/{req.pk}/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_get_single_request_404_unknown_id(client):
    Endpoint.objects.create(slug="missing-req")
    response = client.get(
        "/api/endpoints/missing-req/requests/00000000-0000-0000-0000-000000000000/"
    )
    assert response.status_code == 404
