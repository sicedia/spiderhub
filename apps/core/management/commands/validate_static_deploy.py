"""
Post-deploy / CI check: static manifest exists and core logical paths resolve.

Run: python manage.py validate_static_deploy
"""
from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles.storage import staticfiles_storage
from django.core.management.base import BaseCommand, CommandError


# Entry points referenced from templates (logical paths before hashing)
REQUIRED_LOGICAL_PATHS = (
    "core/css/main.css",
    "core/js/theme-init.js",
    "core/js/MainEntry.js",
    "core/js/AnalysisEntry.js",
    "core/js/ExploreEntry.js",
    "favicon.ico",
)


class Command(BaseCommand):
    help = "Verify staticfiles.json exists and template-critical assets resolve."

    def handle(self, *args, **options):
        root = Path(settings.STATIC_ROOT)
        manifest = root / "staticfiles.json"
        if not manifest.is_file():
            if getattr(settings, "DEBUG", False):
                self.stdout.write(
                    self.style.WARNING(
                        "Skipping: staticfiles.json not found. "
                        "Use production settings + collectstatic to validate the manifest."
                    )
                )
                return
            raise CommandError(
                f"Missing {manifest}. Run collectstatic before this check."
            )

        self.stdout.write(self.style.SUCCESS(f"Found manifest: {manifest}"))

        missing = []
        for logical in REQUIRED_LOGICAL_PATHS:
            try:
                if not staticfiles_storage.exists(logical):
                    missing.append((logical, "not found in staticfiles storage"))
                    continue
                url = staticfiles_storage.url(logical)
            except Exception as exc:
                missing.append((logical, str(exc)))
                continue
            if not url:
                missing.append((logical, "empty url"))

        if missing:
            for path, err in missing:
                self.stderr.write(self.style.ERROR(f"  FAIL {path}: {err}"))
            raise CommandError(
                "Static deploy validation failed: unresolved or missing files."
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"OK: {len(REQUIRED_LOGICAL_PATHS)} critical static paths resolve."
            )
        )
