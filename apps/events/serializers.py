"""
Serializers for Event API endpoints
"""
from rest_framework import serializers
from .models import Event, EventLink, DocumentEvent


class EventLinkSerializer(serializers.ModelSerializer):
    """Serializer for EventLink model"""
    class Meta:
        model = EventLink
        fields = ["id", "label", "url", "link_type"]
        read_only_fields = ["id"]


class DocumentEventSerializer(serializers.ModelSerializer):
    """Serializer for DocumentEvent relationship"""
    document_title = serializers.CharField(source="document.title", read_only=True)
    document_id = serializers.IntegerField(source="document.id", read_only=True)

    class Meta:
        model = DocumentEvent
        fields = [
            "id", 
            "document", 
            "document_id",
            "document_title", 
            "role", 
            "confidence", 
            "notes"
        ]
        read_only_fields = ["id", "document_id", "document_title"]


class EventSerializer(serializers.ModelSerializer):
    """Main serializer for Event model"""
    links = EventLinkSerializer(many=True, required=False)
    document_links = DocumentEventSerializer(many=True, required=False)
    
    # Display fields for related objects
    organization_name = serializers.CharField(
        source="organization.name", 
        read_only=True
    )
    city_name = serializers.CharField(
        source="city.name", 
        read_only=True
    )
    country_name = serializers.CharField(
        source="country.name", 
        read_only=True
    )
    created_by_username = serializers.CharField(
        source="created_by.username", 
        read_only=True
    )

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "description",
            "start_at",
            "end_at",
            "event_format",
            "city",
            "city_name",
            "country",
            "country_name",
            "organization",
            "organization_name",
            "created_by",
            "created_by_username",
            "is_published",
            "ai_check_status",
            "human_check_status",
            "human_check_date",
            "human_reviewer",
            "human_notes",
            "extra",
            "beneficiary_groups",
            "eu_policy_alignments",
            "themes",
            "actors",
            "sdgs",
            "links",
            "document_links",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "ai_check_status",
            "human_check_status",
            "human_check_date",
            "human_reviewer",
            "created_at",
            "updated_at",
            "organization_name",
            "city_name",
            "country_name",
            "created_by_username",
        ]

    def create(self, validated_data):
        """Create event with nested links and document links"""
        links_data = validated_data.pop("links", [])
        doc_links_data = validated_data.pop("document_links", [])
        
        event = Event.objects.create(**validated_data)

        # Create nested links
        for link_data in links_data:
            EventLink.objects.create(event=event, **link_data)

        # Create nested document links
        for doc_link_data in doc_links_data:
            DocumentEvent.objects.create(event=event, **doc_link_data)

        return event

    def update(self, instance, validated_data):
        """
        Update event with nested links and document links.
        Handles updates more efficiently by only deleting/creating what changed.
        """
        links_data = validated_data.pop("links", None)
        doc_links_data = validated_data.pop("document_links", None)

        # Update main fields
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()

        # Update links if provided
        if links_data is not None:
            # Get existing link IDs from the update data
            link_ids_to_keep = {
                link_data.get('id') 
                for link_data in links_data 
                if link_data.get('id')
            }
            
            # Delete links that are not in the update
            instance.links.exclude(id__in=link_ids_to_keep).delete()
            
            # Update or create links
            for link_data in links_data:
                link_id = link_data.pop('id', None)
                if link_id and instance.links.filter(id=link_id).exists():
                    # Update existing link
                    link = instance.links.get(id=link_id)
                    for key, value in link_data.items():
                        setattr(link, key, value)
                    link.save()
                else:
                    # Create new link
                    EventLink.objects.create(event=instance, **link_data)

        # Update document links if provided
        if doc_links_data is not None:
            # Get existing document link IDs from the update data
            doc_link_ids_to_keep = {
                doc_link_data.get('id')
                for doc_link_data in doc_links_data
                if doc_link_data.get('id')
            }
            
            # Delete document links that are not in the update
            instance.document_links.exclude(id__in=doc_link_ids_to_keep).delete()
            
            # Update or create document links
            for doc_link_data in doc_links_data:
                doc_link_id = doc_link_data.pop('id', None)
                if doc_link_id and instance.document_links.filter(id=doc_link_id).exists():
                    # Update existing document link
                    doc_link = instance.document_links.get(id=doc_link_id)
                    for key, value in doc_link_data.items():
                        setattr(doc_link, key, value)
                    doc_link.save()
                else:
                    # Create new document link
                    DocumentEvent.objects.create(event=instance, **doc_link_data)

        return instance

