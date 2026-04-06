from django.urls import re_path

from endpoints.consumers import RequestConsumer

websocket_urlpatterns = [
    re_path(r"ws/endpoints/(?P<slug>[^/]+)/$", RequestConsumer.as_asgi()),
]
