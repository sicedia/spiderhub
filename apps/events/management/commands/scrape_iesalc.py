from django.core.management.base import BaseCommand

from apps.events.services.scrapers import IesalcScraper


class Command(BaseCommand):
    help = "Scrape events from UNESCO-IESALC."

    def handle(self, *args, **options):
        stats = IesalcScraper().run()
        self.stdout.write(self.style.SUCCESS(
            f"Source: IESALC | Found: {stats['found']} | "
            f"Created: {stats['created']} | Updated: {stats['updated']} | "
            f"Skipped: {stats.get('skipped', 0)} | Existing: {stats.get('existing', 0)}"
        ))
