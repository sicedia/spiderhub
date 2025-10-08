"""
Serializers for Document API endpoints
"""
from rest_framework import serializers
from .models import Document, Country


class RelatedDocumentSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for related documents
    Returns minimal information for display in the sidebar
    """
    event_country = serializers.SerializerMethodField()
    document_type = serializers.CharField(source='get_document_type_display', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id',
            'title',
            'document_type',
            'event_country',
            'event_date',
        ]
    
    def get_event_country(self, obj):
        """Return country name and ISO code"""
        if obj.event_country:
            return {
                'name': obj.event_country.name,
                'iso3': obj.event_country.iso3
            }
        return None

