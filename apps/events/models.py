from django.db import models
from django.utils import timezone as tz

from apps.core.models import BaseModel


class EventSource(BaseModel):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(unique=True)
    base_url = models.URLField()
    events_url = models.URLField()
    logo_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Event(BaseModel):
    source = models.ForeignKey(
        EventSource, on_delete=models.CASCADE, related_name="events"
    )
    external_id = models.CharField(max_length=255, blank=True, db_index=True)
    source_url = models.URLField(unique=True)
    title = models.CharField(max_length=500)
    summary = models.TextField(blank=True)
    description = models.TextField(blank=True)
    start_at = models.DateTimeField(null=True, blank=True, db_index=True)
    end_at = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=64, default="UTC", blank=True)
    location_text = models.CharField(max_length=255, blank=True)
    country = models.ForeignKey(
        "documents.Country", null=True, blank=True, on_delete=models.SET_NULL
    )
    modality = models.CharField(
        max_length=20,
        choices=[
            ("virtual", "Virtual"),
            ("presencial", "Presencial"),
            ("hybrid", "Hybrid"),
        ],
        null=True,
        blank=True,
    )
    organizer = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("draft", "Draft"),
            ("published", "Published"),
            ("cancelled", "Cancelled"),
        ],
        default="published",
    )
    language = models.CharField(max_length=10, blank=True)
    registration_url = models.URLField(blank=True)
    image_url = models.URLField(blank=True)
    tags_raw = models.JSONField(default=list, blank=True)
    category = models.CharField(
        max_length=40,
        choices=[
            ("digital_transformation", "Digital Transformation"),
            ("innovation", "Innovation"),
            ("financing_development", "Financing & Development"),
            ("environment_climate", "Environment & Climate"),
            ("governance_public_policy", "Governance & Public Policy"),
            ("other", "Other"),
        ],
        default="other",
    )
    networking_score = models.PositiveSmallIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    scraped_at = models.DateTimeField(default=tz.now)
    last_seen_at = models.DateTimeField(auto_now=True)
    raw_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["start_at", "title"]
        indexes = [
            models.Index(fields=["source", "start_at"], name="evt_source_start_idx"),
            models.Index(fields=["category"], name="evt_category_idx"),
            models.Index(fields=["networking_score"], name="evt_netscore_idx"),
        ]

    def __str__(self):
        return self.title

    def is_past(self) -> bool:
        return self.start_at is not None and self.start_at < tz.now()
