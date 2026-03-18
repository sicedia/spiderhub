"""Populate logo_url for the three EventSource rows."""

from django.db import migrations


LOGOS = {
    "oas": "https://www.oas.org/imgs/en/OEA-ENG-Main-Updated-AUG2025.svg",
    "itu": "https://www.itu.int/PublishingImages/masterpage/logos/ITU-logo.svg",
    "caf": "https://www.caf.com/media/4662836/caforiginalcaribeh-esp.svg",
}


def set_logos(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    for slug, url in LOGOS.items():
        EventSource.objects.filter(slug=slug).update(logo_url=url)


def clear_logos(apps, schema_editor):
    EventSource = apps.get_model("events", "EventSource")
    EventSource.objects.filter(slug__in=LOGOS.keys()).update(logo_url="")


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0005_add_logo_and_image_urls"),
    ]

    operations = [
        migrations.RunPython(set_logos, clear_logos),
    ]
