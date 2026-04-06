import pytest

from endpoints.models import Endpoint, WebhookRequest


@pytest.fixture
def endpoint_with_requests():
    endpoint = Endpoint.objects.create(slug="del-test")
    r1 = WebhookRequest.objects.create(endpoint=endpoint, method="GET")
    r2 = WebhookRequest.objects.create(endpoint=endpoint, method="POST")
    return endpoint, r1, r2


@pytest.mark.django_db
def test_delete_single_request(client, endpoint_with_requests):
    endpoint, r1, r2 = endpoint_with_requests
    response = client.delete(f"/api/endpoints/{endpoint.slug}/requests/{r1.pk}/")
    assert response.status_code == 204
    assert WebhookRequest.objects.count() == 1
    assert WebhookRequest.objects.first().pk == r2.pk


@pytest.mark.django_db
def test_delete_single_request_404_unknown(client):
    Endpoint.objects.create(slug="del-404")
    response = client.delete(
        "/api/endpoints/del-404/requests/00000000-0000-0000-0000-000000000000/"
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_delete_all_requests(client, endpoint_with_requests):
    endpoint, _, _ = endpoint_with_requests
    response = client.delete(f"/api/endpoints/{endpoint.slug}/requests/")
    assert response.status_code == 204
    assert WebhookRequest.objects.count() == 0


@pytest.mark.django_db
def test_delete_all_on_empty_endpoint(client):
    Endpoint.objects.create(slug="empty-del")
    response = client.delete("/api/endpoints/empty-del/requests/")
    assert response.status_code == 204


@pytest.mark.django_db
def test_delete_all_404_unknown_slug(client):
    response = client.delete("/api/endpoints/nonexistent/requests/")
    assert response.status_code == 404
