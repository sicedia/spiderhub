"""Seed EventSource for EU-CELAC Platform."""

from django.db import migrations

SOURCE = {
    "name": "EU-CELAC",
    "slug": "eucelac",
    "base_url": "https://www.eucelac-platform.eu",
    "events_url": "https://www.eucelac-platform.eu/events",
    "logo_url": "https://www.eucelac-platform.eu/sites/all/themes/bootstrap_eralac/logo-eulac.svg",
    "is_active": True,
}


def seed(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    EventSource.objects.update_or_create(slug=SOURCE["slug"], defaults=SOURCE)


def unseed(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    EventSource.objects.filter(slug="eucelac").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0007_seed_idrc_iesalc_sources"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
