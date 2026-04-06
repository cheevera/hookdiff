from django.urls import include, path, re_path

from endpoints.views import receive_webhook
from hookdiff.views import spa_catchall

urlpatterns = [
    path("api/endpoints/", include("endpoints.urls")),
    path("hooks/<slug:slug>/", receive_webhook),
    re_path(r"^(?!api/|hooks/).*$", spa_catchall),
]
