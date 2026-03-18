from rest_framework import serializers

from .models import Event, EventSource


class EventSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventSource
        fields = ["id", "name", "slug", "base_url", "events_url", "logo_url", "is_active"]
        read_only_fields = ["id"]


class EventSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source="source.name", read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True, default="")
    modality_display = serializers.CharField(source="get_modality_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_past = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "source",
            "source_name",
            "external_id",
            "source_url",
            "title",
            "summary",
            "description",
            "start_at",
            "end_at",
            "timezone",
            "location_text",
            "country",
            "country_name",
            "modality",
            "modality_display",
            "organizer",
            "status",
            "status_display",
            "language",
            "registration_url",
            "image_url",
            "tags_raw",
            "category",
            "category_display",
            "networking_score",
            "is_published",
            "is_past",
            "scraped_at",
            "last_seen_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "scraped_at",
            "last_seen_at",
            "created_at",
            "updated_at",
        ]


class PublicEventSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source="source.name", read_only=True)
    source_slug = serializers.CharField(source="source.slug", read_only=True)
    source_base_url = serializers.URLField(source="source.base_url", read_only=True)
    source_logo_url = serializers.URLField(source="source.logo_url", read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True, default="")
    modality_display = serializers.CharField(source="get_modality_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    is_past = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "summary",
            "start_at",
            "end_at",
            "timezone",
            "location_text",
            "country_name",
            "modality",
            "modality_display",
            "organizer",
            "category",
            "category_display",
            "tags_raw",
            "networking_score",
            "registration_url",
            "image_url",
            "source_url",
            "source_name",
            "source_slug",
            "source_base_url",
            "source_logo_url",
            "language",
            "is_past",
            "created_at",
        ]


class PublicEventDetailSerializer(PublicEventSerializer):
    class Meta(PublicEventSerializer.Meta):
        fields = PublicEventSerializer.Meta.fields + [
            "description",
            "external_id",
        ]
