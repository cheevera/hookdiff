import pytest
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator

from endpoints.consumers import RequestConsumer
from endpoints.models import Endpoint


@database_sync_to_async
def create_endpoint(slug):
    return Endpoint.objects.create(slug=slug)


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_consumer_connects():
    await create_endpoint("ws-test")
    communicator = WebsocketCommunicator(
        RequestConsumer.as_asgi(), "/ws/endpoints/ws-test/"
    )
    communicator.scope["url_route"] = {"kwargs": {"slug": "ws-test"}}
    connected, _ = await communicator.connect()
    assert connected
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_consumer_receives_group_message():
    await create_endpoint("ws-msg")
    communicator = WebsocketCommunicator(
        RequestConsumer.as_asgi(), "/ws/endpoints/ws-msg/"
    )
    communicator.scope["url_route"] = {"kwargs": {"slug": "ws-msg"}}
    await communicator.connect()

    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        "endpoint_ws-msg",
        {
            "type": "request.received",
            "message": {
                "type": "request.received",
                "request": {"id": "test-id", "method": "POST"},
            },
        },
    )

    response = await communicator.receive_json_from()
    assert response["type"] == "request.received"
    assert response["request"]["id"] == "test-id"
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_consumer_leaves_group_on_disconnect():
    await create_endpoint("ws-disc")
    communicator = WebsocketCommunicator(
        RequestConsumer.as_asgi(), "/ws/endpoints/ws-disc/"
    )
    communicator.scope["url_route"] = {"kwargs": {"slug": "ws-disc"}}
    await communicator.connect()
    await communicator.disconnect()

    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    # After disconnect, sending to the group should not raise
    # but there should be no one to receive it
    await channel_layer.group_send(
        "endpoint_ws-disc",
        {
            "type": "request.received",
            "message": {"type": "request.received", "request": {}},
        },
    )
    assert await communicator.receive_nothing() is True
