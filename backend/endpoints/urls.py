from django.urls import path

from endpoints.views import create_endpoint

urlpatterns = [
    path("", create_endpoint),
]
