"""Recalculate is_relevant for all events using current exclusion rules (courses, MOOCs, etc.)."""

from django.core.management.base import BaseCommand

from apps.events.models import Event
from apps.events.services.classification import is_relevant_for_spider


class Command(BaseCommand):
    help = "Set is_relevant on all events from classification rules (exclude courses, MOOCs, etc.)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only print what would be updated, do not save.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        updated = 0
        for event in Event.objects.iterator(chunk_size=500):
            data = {
                "title": event.title,
                "summary": event.summary or "",
                "description": event.description or "",
                "tags_raw": event.tags_raw or [],
            }
            new_relevant = is_relevant_for_spider(data)
            if event.is_relevant != new_relevant:
                old_val = event.is_relevant
                if not dry_run:
                    event.is_relevant = new_relevant
                    event.save(update_fields=["is_relevant"])
                updated += 1
                self.stdout.write(
                    f"  {'[DRY-RUN] ' if dry_run else ''}id={event.pk} "
                    f"is_relevant {old_val} -> {new_relevant} | {event.title[:60]!r}"
                )
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {'Would update' if dry_run else 'Updated'} {updated} event(s)."
            )
        )
