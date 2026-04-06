import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from django.http import Http404

from hookdiff.views import spa_catchall


def test_spa_catchall_serves_index_html(rf):
    with tempfile.TemporaryDirectory() as tmpdir:
        index = Path(tmpdir) / "index.html"
        index.write_text("<html><body>hookdiff</body></html>")
        with patch("hookdiff.views.settings") as mock_settings:
            mock_settings.FRONTEND_DIR = Path(tmpdir)
            request = rf.get("/")
            response = spa_catchall(request)
            assert response.status_code == 200
            content = b"".join(response.streaming_content).decode()
            assert "hookdiff" in content


def test_spa_catchall_returns_404_when_not_built(rf):
    with patch("hookdiff.views.settings") as mock_settings:
        mock_settings.FRONTEND_DIR = Path("/nonexistent/path")
        request = rf.get("/")
        with pytest.raises(Http404):
            spa_catchall(request)
