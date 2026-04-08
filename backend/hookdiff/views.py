from django.conf import settings
from django.http import FileResponse, Http404, HttpRequest


def spa_catchall(request: HttpRequest) -> FileResponse:
    index = settings.FRONTEND_DIR / "index.html"
    if not index.is_file():
        raise Http404("Frontend not built")
    return FileResponse(index.open("rb"), content_type="text/html")
