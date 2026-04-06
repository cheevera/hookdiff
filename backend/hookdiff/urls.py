from django.urls import re_path

from hookdiff.views import spa_catchall

urlpatterns = [
    re_path(r"^(?!api/|hooks/).*$", spa_catchall),
]
