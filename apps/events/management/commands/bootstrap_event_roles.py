"""
Management command to create default groups and assign permissions for Event workflow.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.events.models import Event

GROUPS = {
    "spiderhub_org_admin": [
        "add_event", 
        "change_event", 
        "delete_event", 
        "view_event"
    ],
    "spiderhub_org_editor": [
        "add_event", 
        "change_event", 
        "view_event"
    ],
    "spiderhub_org_viewer": [
        "view_event"
    ],
    "spiderhub_event_reviewer": [
        "view_event", 
        "change_event"
    ],
    "spiderhub_event_publisher": [
        "view_event", 
        "change_event", 
        "publish_event"
    ],
}


class Command(BaseCommand):
    help = "Create default groups and assign permissions for Event workflow."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting bootstrap of event roles..."))
        
        # Get ContentType for Event model
        try:
            ct = ContentType.objects.get_for_model(Event)
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error getting ContentType for Event: {e}")
            )
            return

        created_count = 0
        updated_count = 0

        for group_name, perm_codenames in GROUPS.items():
            # Get or create group
            group, created = Group.objects.get_or_create(name=group_name)
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Created group: {group_name}")
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f"Group already exists: {group_name}")
                )

            # Get permissions
            perms = Permission.objects.filter(
                content_type=ct, 
                codename__in=perm_codenames
            )
            
            # Assign permissions to group
            group.permissions.set(perms)
            
            # Display assigned permissions
            perm_names = [p.codename for p in perms]
            self.stdout.write(
                self.style.SUCCESS(
                    f"  Configured {group_name}: {', '.join(perm_names)}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nBootstrap complete! Created {created_count} groups, "
                f"updated {updated_count} existing groups."
            )
        )

