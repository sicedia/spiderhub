from django.core.management.base import BaseCommand

from apps.events.services.scrapers import EucelacScraper


class Command(BaseCommand):
    help = "Scrape events from EU-CELAC Platform."

    def handle(self, *args, **options):
        stats = EucelacScraper().run()
        self.stdout.write(self.style.SUCCESS(
            f"Source: EU-CELAC | Found: {stats['found']} | "
            f"Created: {stats['created']} | Updated: {stats['updated']} | "
            f"Skipped: {stats.get('skipped', 0)} | Existing: {stats.get('existing', 0)}"
        ))
