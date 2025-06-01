from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.documents'

    def ready(self):
        # Import the signals module to ensure the signal handlers are registered
        import apps.documents.signals  # noqa