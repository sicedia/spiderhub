"""
Complete refactor: drop old event models (Organization, OrganizationMember,
EventLink, EventTheme, EventActor, EventSDG, DocumentEvent, old Event) and
create EventSource + new Event.
"""
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0002_alter_event_description"),
        ("documents", "0001_initial"),
    ]

    operations = [
        # ── Drop through / related tables first ─────────────────────────
        migrations.DeleteModel(name="EventTheme"),
        migrations.DeleteModel(name="EventActor"),
        migrations.DeleteModel(name="EventSDG"),
        migrations.DeleteModel(name="DocumentEvent"),
        migrations.DeleteModel(name="EventLink"),
        migrations.DeleteModel(name="OrganizationMember"),

        # ── Drop old Event (has FK to Organization) ─────────────────────
        migrations.DeleteModel(name="Event"),

        # ── Drop Organization ───────────────────────────────────────────
        migrations.DeleteModel(name="Organization"),

        # ── Create EventSource ──────────────────────────────────────────
        migrations.CreateModel(
            name="EventSource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=200, unique=True)),
                ("slug", models.SlugField(unique=True)),
                ("base_url", models.URLField()),
                ("events_url", models.URLField()),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"abstract": False},
        ),

        # ── Create new Event ────────────────────────────────────────────
        migrations.CreateModel(
            name="Event",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("source", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="events", to="events.eventsource")),
                ("external_id", models.CharField(blank=True, db_index=True, max_length=255)),
                ("source_url", models.URLField(unique=True)),
                ("title", models.CharField(max_length=500)),
                ("summary", models.TextField(blank=True)),
                ("description", models.TextField(blank=True)),
                ("start_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("end_at", models.DateTimeField(blank=True, null=True)),
                ("timezone", models.CharField(blank=True, default="UTC", max_length=64)),
                ("location_text", models.CharField(blank=True, max_length=255)),
                ("country", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="documents.country")),
                ("modality", models.CharField(
                    blank=True,
                    choices=[("virtual", "Virtual"), ("presencial", "Presencial"), ("hybrid", "Hybrid")],
                    max_length=20,
                    null=True,
                )),
                ("organizer", models.CharField(blank=True, max_length=255)),
                ("status", models.CharField(
                    choices=[("draft", "Draft"), ("published", "Published"), ("cancelled", "Cancelled")],
                    default="published",
                    max_length=20,
                )),
                ("language", models.CharField(blank=True, max_length=10)),
                ("registration_url", models.URLField(blank=True)),
                ("tags_raw", models.JSONField(blank=True, default=list)),
                ("category", models.CharField(
                    choices=[
                        ("digital_transformation", "Digital Transformation"),
                        ("innovation", "Innovation"),
                        ("financing_development", "Financing & Development"),
                        ("environment_climate", "Environment & Climate"),
                        ("governance_public_policy", "Governance & Public Policy"),
                        ("other", "Other"),
                    ],
                    default="other",
                    max_length=40,
                )),
                ("networking_score", models.PositiveSmallIntegerField(default=0)),
                ("is_published", models.BooleanField(default=True)),
                ("scraped_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("last_seen_at", models.DateTimeField(auto_now=True)),
                ("raw_data", models.JSONField(blank=True, default=dict)),
            ],
            options={
                "ordering": ["start_at", "title"],
                "indexes": [
                    models.Index(fields=["source", "start_at"], name="evt_source_start_idx"),
                    models.Index(fields=["category"], name="evt_category_idx"),
                    models.Index(fields=["networking_score"], name="evt_netscore_idx"),
                ],
            },
        ),
    ]
