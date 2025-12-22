"""
Admin Inlines
InlineModelAdmin classes for Event relationships
"""
from django.contrib import admin
from ..models import EventLink, DocumentEvent


class EventLinkInline(admin.TabularInline):
    """Inline admin for EventLink model"""
    model = EventLink
    extra = 1
    fields = ('label', 'url', 'link_type')
    verbose_name = "Event Link"
    verbose_name_plural = "Event Links"


class DocumentEventInline(admin.TabularInline):
    """Inline admin for DocumentEvent model"""
    model = DocumentEvent
    extra = 0
    fields = ('document', 'role', 'confidence', 'notes')
    autocomplete_fields = ['document']
    verbose_name = "Related Document"
    verbose_name_plural = "Related Documents"

