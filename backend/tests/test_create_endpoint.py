from unittest.mock import patch

import pytest

from endpoints.models import Endpoint


@pytest.mark.django_db
def test_create_endpoint_returns_201(client):
    response = client.post("/api/endpoints/")
    assert response.status_code == 201
    data = response.json()
    assert "slug" in data
    assert "url" in data
    assert "createdAt" in data
    assert data["slug"] in data["url"]
    assert "/hooks/" in data["url"]


@pytest.mark.django_db
def test_create_endpoint_persists_to_database(client):
    response = client.post("/api/endpoints/")
    slug = response.json()["slug"]
    assert Endpoint.objects.filter(slug=slug).exists()


@pytest.mark.django_db
def test_create_endpoint_generates_unique_slugs(client):
    response1 = client.post("/api/endpoints/")
    response2 = client.post("/api/endpoints/")
    assert response1.json()["slug"] != response2.json()["slug"]


@pytest.mark.django_db
def test_create_endpoint_retries_on_collision(client):
    existing = Endpoint.objects.create(slug="collide")
    with patch("endpoints.views.generate_slug", side_effect=["collide", "unique"]):
        response = client.post("/api/endpoints/")
    assert response.status_code == 201
    assert response.json()["slug"] == "unique"
    assert Endpoint.objects.count() == 2
    existing.refresh_from_db()


@pytest.mark.django_db
def test_create_endpoint_fails_after_max_retries(client):
    Endpoint.objects.create(slug="taken")
    with patch("endpoints.views.generate_slug", return_value="taken"):
        response = client.post("/api/endpoints/")
    assert response.status_code == 500


@pytest.mark.django_db
def test_create_endpoint_rejects_get(client):
    response = client.get("/api/endpoints/")
    assert response.status_code == 405
