from rest_framework import serializers
from apps.documents.models import Document

class DocumentListSerializer(serializers.ModelSerializer):
    """
    Serializer for search results that includes:
      - id, title, executive_summary, date
      - location_name (the name of the related Location)
      - tags (a flat list of tag names)
    """
    location_name = serializers.CharField(
        source='location.name',
        read_only=True
    )

    actors = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )

    themes = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )

    class Meta:
        model = Document
        fields = [
            'id',
            'title',
            'executive_summary',
            'date',
            'location_name',
            'actors',
            'themes',
        ]