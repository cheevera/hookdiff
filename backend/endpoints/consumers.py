from typing import Any

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class RequestConsumer(AsyncJsonWebsocketConsumer):  # type: ignore[misc]
    slug: str
    group_name: str

    async def connect(self) -> None:
        self.slug = self.scope["url_route"]["kwargs"]["slug"]
        self.group_name = f"endpoint_{self.slug}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code: int) -> None:
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def request_received(self, event: dict[str, Any]) -> None:
        await self.send_json(event["message"])
