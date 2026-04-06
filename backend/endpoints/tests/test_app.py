from django.apps import apps


def test_endpoints_app_config():
    app_config = apps.get_app_config("endpoints")
    assert app_config.name == "endpoints"
