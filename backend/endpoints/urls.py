from django.urls import path

from endpoints.views import EndpointCreate, RequestDetail, RequestList

urlpatterns = [
    path("", EndpointCreate.as_view()),
    path("<slug:slug>/requests/", RequestList.as_view()),
    path(
        "<slug:slug>/requests/<uuid:request_id>/",
        RequestDetail.as_view(),
    ),
]
