"""
Events Admin Package
Admin configuration for the events app.
"""
from django.contrib import admin

# Import and register all admin classes
from .events import (
    OrganizationAdmin,
    OrganizationMemberAdmin,
    EventAdmin,
    EventThemeAdmin,
    EventActorAdmin,
    EventSDGAdmin,
    DocumentEventAdmin,
)

# All admin classes are automatically registered via @admin.register decorator
# No need to explicitly register them here

__all__ = [
    'OrganizationAdmin',
    'OrganizationMemberAdmin',
    'EventAdmin',
    'EventThemeAdmin',
    'EventActorAdmin',
    'EventSDGAdmin',
    'DocumentEventAdmin',
]

