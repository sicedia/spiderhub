from django.contrib import admin

from ..models import EventSource, Event


@admin.register(EventSource)
class EventSourceAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "events_url"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "source",
        "start_at",
        "category",
        "modality",
        "networking_score",
        "is_published",
        "last_seen_at",
    ]
    list_filter = ["source", "category", "modality", "is_published", "country"]
    search_fields = [
        "title",
        "summary",
        "description",
        "location_text",
        "organizer",
        "source_url",
    ]
    readonly_fields = ["scraped_at", "last_seen_at", "raw_data"]
    autocomplete_fields = ["source", "country"]
    date_hierarchy = "start_at"
    list_per_page = 30
