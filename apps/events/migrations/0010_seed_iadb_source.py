"""Seed EventSource for IDB (Inter-American Development Bank)."""

from django.db import migrations

SOURCE = {
    "name": "IDB",
    "slug": "iadb",
    "base_url": "https://events.iadb.org",
    "events_url": "https://events.iadb.org/calendar/?lang=en",
    "logo_url": "https://events.iadb.org/calendar/assets/images/bid-logo.jpg",
    "is_active": True,
}


def seed(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    EventSource.objects.update_or_create(slug=SOURCE["slug"], defaults=SOURCE)


def unseed(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    EventSource.objects.filter(slug="iadb").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0009_add_event_is_relevant"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
