from django.core.management.base import BaseCommand

from apps.events.services.scrapers import CafScraper


class Command(BaseCommand):
    help = "Scrape events from CAF (Development Bank of Latin America)."

    def handle(self, *args, **options):
        stats = CafScraper().run()
        self.stdout.write(self.style.SUCCESS(
            f"Source: CAF | Found: {stats['found']} | "
            f"Created: {stats['created']} | Updated: {stats['updated']} | "
            f"Skipped: {stats.get('skipped', 0)}"
        ))
