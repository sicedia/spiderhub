"""Seed EventSource rows for IDRC and IESALC."""

from django.db import migrations

SOURCES = [
    {
        "name": "IDRC",
        "slug": "idrc",
        "base_url": "https://idrc-crdi.ca",
        "events_url": "https://idrc-crdi.ca/es/eventos",
        "logo_url": "https://idrc-crdi.ca/themes/custom/idrc_theme/logo.svg",
        "is_active": True,
    },
    {
        "name": "UNESCO-IESALC",
        "slug": "iesalc",
        "base_url": "https://www.iesalc.unesco.org",
        "events_url": "https://www.iesalc.unesco.org/es/node/104",
        "logo_url": "https://www.iesalc.unesco.org/themes/custom/bunesco8/assets/images/logo/logo-blue.svg",
        "is_active": True,
    },
]


def seed(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    for src in SOURCES:
        EventSource.objects.update_or_create(slug=src["slug"], defaults=src)


def unseed(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    EventSource.objects.filter(slug__in=["idrc", "iesalc"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0006_populate_source_logos"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
