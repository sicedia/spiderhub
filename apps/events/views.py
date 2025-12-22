"""
Event API Views
"""
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiTypes
from .models import Event
from .serializers import EventSerializer
from .permissions import IsOrgMemberOrSuperuser, CanPublishEvent


class EventViewSet(ModelViewSet):
    """
    ViewSet for Event model.
    
    Provides CRUD operations for events with:
    - Filtering by user's organizations
    - Permission checks for publishing
    - Auto-assignment of created_by
    - Optimized queryset with select_related and prefetch_related
    """
    serializer_class = EventSerializer
    permission_classes = [
        IsAuthenticated, 
        CanPublishEvent, 
        IsOrgMemberOrSuperuser
    ]

    @extend_schema(
        summary="List events",
        description="Returns a list of events. Users see only events from their organizations.",
        responses={200: EventSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Retrieve event",
        description="Returns details of a specific event.",
        responses={200: EventSerializer}
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Create event",
        description="Creates a new event. created_by is automatically set to current user.",
        request=EventSerializer,
        responses={201: EventSerializer}
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Update event",
        description="Updates an event. Requires publish_event permission to set is_published=True.",
        request=EventSerializer,
        responses={200: EventSerializer}
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Partial update event",
        description="Partially updates an event. Requires publish_event permission to set is_published=True.",
        request=EventSerializer,
        responses={200: EventSerializer}
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Delete event",
        description="Deletes an event.",
        responses={204: OpenApiTypes.OBJECT}
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        """
        Filter events by user's organizations with optimized queries.
        Uses select_related and prefetch_related to minimize database hits.
        """
        user = self.request.user
        qs = Event.objects.select_related(
            'organization',
            'city',
            'country',
            'created_by',
            'human_reviewer'
        ).prefetch_related(
            'links',
            'document_links__document',
            'themes',
            'actors',
            'sdgs',
            'beneficiary_groups',
            'eu_policy_alignments'
        )

        if user.is_superuser:
            return qs

        # Filter by organizations where user is a member
        org_ids = user.org_memberships.values_list("organization_id", flat=True)
        return qs.filter(organization_id__in=org_ids)

    def perform_create(self, serializer):
        """Auto-assign created_by to current user"""
        serializer.save(created_by=self.request.user)

