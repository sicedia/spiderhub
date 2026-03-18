from django.core.management.base import BaseCommand

from apps.events.services.scrapers import EclacScraper


class Command(BaseCommand):
    help = "Scrape events from ECLAC (CEPAL)."

    def handle(self, *args, **options):
        stats = EclacScraper().run()
        self.stdout.write(self.style.SUCCESS(
            f"Source: ECLAC | Found: {stats['found']} | "
            f"Created: {stats['created']} | Updated: {stats['updated']} | "
            f"Skipped: {stats.get('skipped', 0)} | Existing: {stats.get('existing', 0)}"
        ))
