from django.urls import include, path, re_path

from hookdiff.views import spa_catchall

urlpatterns = [
    path("api/endpoints/", include("endpoints.urls")),
    re_path(r"^(?!api/|hooks/).*$", spa_catchall),
]
