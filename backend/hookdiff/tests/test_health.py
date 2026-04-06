import pytest
from channels.layers import get_channel_layer
from django.conf import settings
from django.db import connection
from django.test import override_settings


@override_settings(DEBUG=True)
def test_django_starts():
    assert settings.DEBUG is True


@pytest.mark.django_db
def test_database_connection():
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
    assert result == (1,)


@pytest.mark.asyncio
async def test_redis_connection():
    channel_layer = get_channel_layer()
    channel_name = await channel_layer.new_channel()
    await channel_layer.send(channel_name, {"type": "test.message", "text": "hello"})
    message = await channel_layer.receive(channel_name)
    assert message["text"] == "hello"
