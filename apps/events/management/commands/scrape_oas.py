from django.core.management.base import BaseCommand

from apps.events.services.scrapers import OasScraper


class Command(BaseCommand):
    help = "Scrape events from OAS (Organization of American States)."

    def handle(self, *args, **options):
        stats = OasScraper().run()
        self.stdout.write(self.style.SUCCESS(
            f"Source: OAS | Found: {stats['found']} | "
            f"Created: {stats['created']} | Updated: {stats['updated']} | "
            f"Skipped: {stats.get('skipped', 0)}"
        ))
