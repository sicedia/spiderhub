"""Seed the three initial EventSource rows (OAS, ITU, CAF)."""

from django.db import migrations


def seed_sources(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    sources = [
        {
            "name": "OAS",
            "slug": "oas",
            "base_url": "https://www.oas.org",
            "events_url": "https://www.oas.org/ext/en/main/oas/events",
            "is_active": True,
        },
        {
            "name": "ITU",
            "slug": "itu",
            "base_url": "https://www.itu.int",
            "events_url": "https://www.itu.int/en/events/Pages/default.aspx",
            "is_active": True,
        },
        {
            "name": "CAF",
            "slug": "caf",
            "base_url": "https://www.caf.com",
            "events_url": "https://www.caf.com/es/actualidad/eventos/",
            "is_active": True,
        },
    ]
    for data in sources:
        EventSource.objects.get_or_create(slug=data["slug"], defaults=data)


def remove_sources(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    EventSource.objects.filter(slug__in=["oas", "itu", "caf"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0003_refactor_event_models"),
    ]

    operations = [
        migrations.RunPython(seed_sources, remove_sources),
    ]
