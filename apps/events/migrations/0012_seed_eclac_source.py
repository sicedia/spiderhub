"""Seed EventSource for ECLAC (CEPAL)."""

from django.db import migrations

SOURCE = {
    "name": "ECLAC",
    "slug": "eclac",
    "base_url": "https://www.cepal.org",
    "events_url": "https://www.cepal.org/en/events",
    "logo_url": "https://www.cepal.org/themes/contrib/eclacstrap_base/images/brand/eclac-logo-es.svg",
    "is_active": True,
}


def seed(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    EventSource.objects.update_or_create(slug=SOURCE["slug"], defaults=SOURCE)


def unseed(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    EventSource.objects.filter(slug="eclac").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0011_extend_url_fields"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
