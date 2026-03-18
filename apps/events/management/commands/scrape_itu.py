from django.core.management.base import BaseCommand

from apps.events.services.scrapers import ItuScraper


class Command(BaseCommand):
    help = "Scrape events from ITU (International Telecommunication Union)."

    def handle(self, *args, **options):
        stats = ItuScraper().run()
        self.stdout.write(self.style.SUCCESS(
            f"Source: ITU | Found: {stats['found']} | "
            f"Created: {stats['created']} | Updated: {stats['updated']} | "
            f"Skipped: {stats.get('skipped', 0)} | Existing: {stats.get('existing', 0)}"
        ))
