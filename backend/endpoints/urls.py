from django.urls import path

from endpoints.views import create_endpoint, get_request, list_requests

urlpatterns = [
    path("", create_endpoint),
    path("<slug:slug>/requests/", list_requests),
    path("<slug:slug>/requests/<uuid:request_id>/", get_request),
]
