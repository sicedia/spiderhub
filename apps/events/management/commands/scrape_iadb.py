from django.core.management.base import BaseCommand

from apps.events.services.scrapers import IadbScraper


class Command(BaseCommand):
    help = "Scrape events from IDB (Inter-American Development Bank)."

    def handle(self, *args, **options):
        stats = IadbScraper().run()
        self.stdout.write(self.style.SUCCESS(
            f"Source: IDB | Found: {stats['found']} | "
            f"Created: {stats['created']} | Updated: {stats['updated']} | "
            f"Skipped: {stats.get('skipped', 0)} | Existing: {stats.get('existing', 0)}"
        ))
