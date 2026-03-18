"""
Management command to create default groups and assign permissions for Event workflow.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from apps.events.models import Event

GROUPS = {
    "spiderhub_event_editor": ["add_event", "change_event", "view_event"],
    "spiderhub_event_viewer": ["view_event"],
}


class Command(BaseCommand):
    help = "Create default groups and assign permissions for Event workflow."

    def handle(self, *args, **options):
        ct = ContentType.objects.get_for_model(Event)

        for group_name, codenames in GROUPS.items():
            group, created = Group.objects.get_or_create(name=group_name)
            perms = Permission.objects.filter(content_type=ct, codename__in=codenames)
            group.permissions.set(perms)
            label = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(
                f"{label} group {group_name}: {', '.join(p.codename for p in perms)}"
            ))
