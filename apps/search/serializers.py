from rest_framework import serializers
from apps.documents.models import Document

class DocumentListSerializer(serializers.ModelSerializer):
    """
    Serializer for search results that includes:
      - id, title, executive_summary, event_date
      - country (direct field instead of location.name)
      - actors and themes (through relationships)
    """
    # Remove location_name as it doesn't exist, use country instead
    country = serializers.CharField(read_only=True)

    actors = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='label'  # Changed from 'name' to 'label'
    )

    themes = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='label'  # Changed from 'name' to 'label'
    )

    class Meta:
        model = Document
        fields = [
            'id',
            'title',
            'executive_summary',
            'event_date',  # Changed from 'date' to 'event_date'
            'country',     # Changed from 'location_name' to 'country'
            'actors',
            'themes',
        ]