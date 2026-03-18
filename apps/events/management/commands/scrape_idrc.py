from django.core.management.base import BaseCommand

from apps.events.services.scrapers import IdrcScraper


class Command(BaseCommand):
    help = "Scrape events from IDRC (International Development Research Centre)."

    def handle(self, *args, **options):
        stats = IdrcScraper().run()
        self.stdout.write(self.style.SUCCESS(
            f"Source: IDRC | Found: {stats['found']} | "
            f"Created: {stats['created']} | Updated: {stats['updated']} | "
            f"Skipped: {stats.get('skipped', 0)} | Existing: {stats.get('existing', 0)}"
        ))
