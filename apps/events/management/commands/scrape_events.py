from django.core.management.base import BaseCommand

from apps.events.models import EventSource
from apps.events.services.scrapers import SCRAPER_REGISTRY


class Command(BaseCommand):
    help = "Run event scrapers. Use --all or --source=<slug>."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            type=str,
            help="Slug of the EventSource to scrape (e.g. oas, itu, caf).",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Scrape all active EventSources.",
        )

    def handle(self, *args, **options):
        slugs: list[str] = []

        if options["all"]:
            slugs = list(
                EventSource.objects.filter(is_active=True)
                .values_list("slug", flat=True)
            )
        elif options["source"]:
            slugs = [options["source"]]
        else:
            self.stderr.write(self.style.ERROR(
                "Specify --source=<slug> or --all."
            ))
            return

        for slug in slugs:
            scraper_cls = SCRAPER_REGISTRY.get(slug)
            if not scraper_cls:
                self.stderr.write(self.style.WARNING(
                    f"No scraper registered for slug '{slug}', skipping."
                ))
                continue

            self.stdout.write(f"Running scraper for '{slug}'...")
            try:
                stats = scraper_cls().run()
                self.stdout.write(self.style.SUCCESS(
                    f"Source: {slug.upper()} | Found: {stats['found']} | "
                    f"Created: {stats['created']} | Updated: {stats['updated']} | "
                    f"Skipped: {stats.get('skipped', 0)} | Existing: {stats.get('existing', 0)}"
                ))
            except Exception as exc:
                self.stderr.write(self.style.ERROR(
                    f"Scraper '{slug}' failed: {exc}"
                ))
