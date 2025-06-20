from rest_framework import serializers
from apps.documents.models import Document

class DocumentListSerializer(serializers.ModelSerializer):
    """
    Serializer for search results that includes:
      - id, title, executive_summary, event_date
      - event_country (updated from country)
      - actors and themes (through relationships)
    """
    # Updated to use event_country instead of country
    event_country = serializers.StringRelatedField(read_only=True)

    actors = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='label'
    )

    themes = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='label'
    )

    class Meta:
        model = Document
        fields = [
            'id',
            'title',
            'executive_summary',
            'event_date',
            'event_country',  # Changed from 'country' to 'event_country'
            'actors',
            'themes',
        ]