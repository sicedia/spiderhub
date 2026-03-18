"""
Management command to create test events for the new EventSource / Event models.

Usage:
    python manage.py create_test_events              # 10 events
    python manage.py create_test_events --count 30
    python manage.py create_test_events --clear       # wipe first
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
import random

from apps.events.models import Event, EventSource
from apps.documents.models import Country


SOURCES = [
    ("oecd", "OECD Events", "https://www.oecd.org", "https://www.oecd.org/events/"),
    ("un", "United Nations", "https://www.un.org", "https://www.un.org/en/events/"),
    ("wb", "World Bank", "https://www.worldbank.org", "https://www.worldbank.org/en/events/"),
]

TITLES = [
    "EU-LAC Digital Transformation Summit 2025",
    "Regional Conference on Digital Innovation",
    "Bilateral Dialogue on Cybersecurity",
    "Multilateral Workshop on Data Governance",
    "EU-LAC Tech Forum: AI and Digital Economy",
    "Digital Inclusion Summit",
    "Cross-Border Digital Cooperation Meeting",
    "Innovation Hub Launch Event",
    "Digital Policy Roundtable",
    "EU-LAC Startup Ecosystem Forum",
    "Cybersecurity Best Practices Workshop",
    "Data Privacy and Protection Conference",
    "Digital Skills Development Summit",
    "E-Government Transformation Forum",
    "Smart Cities Initiative Launch",
]

CATEGORIES = [c[0] for c in Event.category.field.choices]
MODALITIES = ["virtual", "presencial", "hybrid"]


class Command(BaseCommand):
    help = "Create test events."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=10)
        parser.add_argument("--clear", action="store_true")

    def handle(self, *args, **options):
        if options["clear"]:
            n, _ = Event.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {n} events"))

        sources = self._ensure_sources()
        countries = list(Country.objects.all()[:10])

        with transaction.atomic():
            for i in range(options["count"]):
                days = random.randint(-60, 90)
                start = timezone.now() + timedelta(days=days)
                Event.objects.create(
                    source=random.choice(sources),
                    source_url=f"https://example.com/events/{timezone.now().timestamp()}-{i}",
                    title=random.choice(TITLES),
                    summary="Auto-generated test event.",
                    start_at=start,
                    end_at=start + timedelta(days=random.randint(1, 3)),
                    location_text=random.choice(["Brussels", "Quito", "Virtual", "Berlin"]),
                    country=random.choice(countries) if countries else None,
                    modality=random.choice(MODALITIES),
                    category=random.choice(CATEGORIES),
                    networking_score=random.randint(0, 100),
                    is_published=random.choice([True, True, False]),
                    organizer="Test Organizer",
                )

        self.stdout.write(self.style.SUCCESS(f"Created {options['count']} test events."))

    def _ensure_sources(self):
        result = []
        for slug, name, base, events_url in SOURCES:
            src, _ = EventSource.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "base_url": base, "events_url": events_url},
            )
            result.append(src)
        return result
