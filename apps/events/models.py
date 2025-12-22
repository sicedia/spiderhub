"""Django data-model for SPIDERHUB Events system.
Events are linked to Organizations through OrganizationMember (using Django Groups for roles).
Events reuse taxonomies from documents app (Theme, Actor, SDG, etc.) and can link to Documents.
"""
from django.db import models
from django.contrib.auth.models import User, Group
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex

from apps.core.models import BaseModel
from apps.documents.models import (
    Country, City, Theme, Actor, SDG, BeneficiaryGroup, EUPolicy, Document
)


class Organization(BaseModel):
    """Organization entity that can own events."""
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"

    def __str__(self):
        return self.name


class OrganizationMember(BaseModel):
    """
    Membership: links User with Organization and assigns a Group (Django) as role within that org.
    """
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name="memberships"
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="org_memberships"
    )
    group = models.ForeignKey(
        Group, 
        on_delete=models.PROTECT, 
        related_name="org_memberships"
    )

    class Meta:
        unique_together = ("organization", "user")
        indexes = [
            models.Index(fields=["organization", "user"], name="org_member_idx"),
        ]
        verbose_name = "Organization Member"
        verbose_name_plural = "Organization Members"

    def __str__(self):
        return f"{self.user} @ {self.organization} ({self.group.name})"


class Event(BaseModel):
    """Event entity linked to organizations and taxonomies."""
    title = models.CharField(max_length=500)
    description = models.TextField()

    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)

    event_format = models.CharField(
        max_length=20,
        choices=[
            ("presencial", _("Presencial")), 
            ("virtual", _("Virtual")), 
            ("hybrid", _("Hybrid"))
        ],
        null=True, 
        blank=True,
    )

    city = models.ForeignKey(City, null=True, blank=True, on_delete=models.SET_NULL)
    country = models.ForeignKey(Country, null=True, blank=True, on_delete=models.SET_NULL)

    organization = models.ForeignKey(
        Organization, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name="events"
    )
    created_by = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name="created_events"
    )

    # Publication / review status
    is_published = models.BooleanField(default=False)

    ai_check_status = models.BooleanField(default=True)
    human_check_status = models.BooleanField(default=False)
    human_check_date = models.DateTimeField(null=True, blank=True)
    human_reviewer = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name="reviewed_events"
    )
    human_notes = models.TextField(blank=True)

    # Extensibility (for future without migrating each time)
    extra = models.JSONField(default=dict, blank=True)

    # Taxonomies (same as Document)
    themes = models.ManyToManyField(
        Theme, 
        through="EventTheme", 
        related_name="events", 
        blank=True
    )
    actors = models.ManyToManyField(
        Actor, 
        through="EventActor", 
        related_name="events", 
        blank=True
    )
    beneficiary_groups = models.ManyToManyField(
        BeneficiaryGroup, 
        related_name="events", 
        blank=True
    )
    sdgs = models.ManyToManyField(
        SDG, 
        through="EventSDG", 
        related_name="events", 
        blank=True
    )
    eu_policy_alignments = models.ManyToManyField(
        EUPolicy, 
        related_name="events", 
        blank=True
    )

    # Related documents
    documents = models.ManyToManyField(
        Document, 
        through="DocumentEvent", 
        related_name="events", 
        blank=True
    )

    # Search fields
    title_normalized = models.TextField(editable=False, null=True, blank=True)
    description_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        ordering = ["-start_at", "title"]
        indexes = [
            models.Index(fields=["start_at"], name="event_start_idx"),
            models.Index(fields=["is_published"], name="event_pub_idx"),
            GinIndex(fields=["search_vector"], name="event_search_vector_gin"),
        ]
        # Custom permission for publishing (in addition to change_event)
        permissions = [
            ("publish_event", "Can publish event"),
        ]

    def __str__(self):
        return self.title


class EventLink(BaseModel):
    """Links associated with an event (website, registration, agenda, etc.)."""
    class LinkType(models.TextChoices):
        WEBSITE = "website", _("Website")
        REGISTRATION = "registration", _("Registration")
        AGENDA = "agenda", _("Agenda")
        STREAM = "stream", _("Streaming")
        OTHER = "other", _("Other")

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="links")
    label = models.CharField(max_length=200, blank=True)
    url = models.URLField()
    link_type = models.CharField(
        max_length=30, 
        choices=LinkType.choices, 
        default=LinkType.OTHER
    )

    class Meta:
        unique_together = ("event", "url")
        verbose_name = "Event Link"
        verbose_name_plural = "Event Links"

    def __str__(self):
        return f"{self.event_id}: {self.url}"


class EventTheme(BaseModel):
    """Through table for Event-Theme relationship with metadata."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE)
    is_top = models.BooleanField(default=False)
    relevance_score = models.FloatField(null=True, blank=True)
    justification = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ("event", "theme")
        verbose_name = "Event–Theme Link"
        verbose_name_plural = "Event–Theme Links"

    def __str__(self):
        return f"{self.event.title[:50]} – {self.theme.label}"


class EventActor(BaseModel):
    """Through table for Event-Actor relationship with metadata."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    actor = models.ForeignKey(Actor, on_delete=models.CASCADE)
    is_top = models.BooleanField(default=False)
    relevance_score = models.FloatField(null=True, blank=True)
    justification = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ("event", "actor")
        verbose_name = "Event–Actor Link"
        verbose_name_plural = "Event–Actor Links"

    def __str__(self):
        return f"{self.event.title[:50]} – {self.actor.label}"


class EventSDG(BaseModel):
    """Through table for Event-SDG relationship with metadata."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    sdg = models.ForeignKey(SDG, on_delete=models.CASCADE)
    relevance_score = models.FloatField(null=True, blank=True, default=1.0)
    justification = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ("event", "sdg")
        verbose_name = "Event–SDG Link"
        verbose_name_plural = "Event–SDG Links"

    def __str__(self):
        return f"{self.event.title[:50]} – {self.sdg.label} ({self.relevance_score or 0:.2f})"


class DocumentEvent(BaseModel):
    """
    M2M Document <-> Event with metadata.
    """
    class Role(models.TextChoices):
        MINUTES = "minutes", _("Minutes")
        AGENDA = "agenda", _("Agenda")
        REPORT = "report", _("Report")
        STATEMENT = "statement", _("Statement")
        OTHER = "other", _("Other")

    document = models.ForeignKey(
        Document, 
        on_delete=models.CASCADE, 
        related_name="event_links"
    )
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE, 
        related_name="document_links"
    )

    role = models.CharField(
        max_length=30, 
        choices=Role.choices, 
        default=Role.OTHER
    )
    confidence = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("document", "event")
        indexes = [
            models.Index(fields=["event", "role"], name="doc_event_role_idx"),
        ]
        verbose_name = "Document–Event Link"
        verbose_name_plural = "Document–Event Links"

    def __str__(self):
        return f"{self.document.title[:50]} – {self.event.title[:50]} ({self.role})"

