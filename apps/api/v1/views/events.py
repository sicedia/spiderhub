"""
Public Events API Views
Public read-only endpoints for events (only published events)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.contrib.postgres.search import TrigramSimilarity
from datetime import datetime
from unidecode import unidecode

from apps.events.models import Event
from apps.events.serializers import PublicEventSerializer, PublicEventDetailSerializer
from apps.api.pagination import StandardResultsSetPagination


class PublicEventsListAPIView(APIView):
    """
    GET /api/v1/events/
    
    Public endpoint to list published events with filtering and pagination.
    Only returns events where is_published=True.
    """
    pagination_class = StandardResultsSetPagination
    
    @extend_schema(
        summary="List published events",
        description="Returns a paginated list of published events with optional filtering",
        parameters=[
            OpenApiParameter('q', OpenApiTypes.STR, description='Search query string (searches in title and description)'),
            OpenApiParameter('published', OpenApiTypes.BOOL, description='Filter by published status (default: true)'),
            OpenApiParameter('start_at_after', OpenApiTypes.DATE, description='Filter events starting after this date (YYYY-MM-DD)'),
            OpenApiParameter('start_at_before', OpenApiTypes.DATE, description='Filter events starting before this date (YYYY-MM-DD)'),
            OpenApiParameter('country', OpenApiTypes.INT, description='Filter by country ID'),
            OpenApiParameter('event_format', OpenApiTypes.STR, description='Filter by format: presencial, virtual, hybrid'),
            OpenApiParameter('theme', OpenApiTypes.INT, description='Filter by theme ID (can be repeated)'),
            OpenApiParameter('actor', OpenApiTypes.INT, description='Filter by actor ID (can be repeated)'),
            OpenApiParameter('organization', OpenApiTypes.INT, description='Filter by organization ID'),
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='Items per page'),
        ],
        responses={200: PublicEventSerializer(many=True)}
    )
    def get(self, request):
        """
        GET /api/v1/events/
        
        Query parameters:
        - q: string (search query - searches in title and description)
        - published: boolean (default: true, only published events)
        - start_at_after: date (YYYY-MM-DD)
        - start_at_before: date (YYYY-MM-DD)
        - country: integer (country ID)
        - event_format: string (presencial, virtual, hybrid)
        - theme: integer (can be repeated)
        - actor: integer (can be repeated)
        - organization: integer (organization ID)
        - page: integer (page number)
        - page_size: integer (items per page)
        """
        # Base queryset: only published events
        queryset = Event.objects.filter(is_published=True).select_related(
            'organization',
            'city',
            'country'
        ).prefetch_related(
            'themes',
            'actors',
            'sdgs',
            'beneficiary_groups'
        ).order_by('-start_at', 'title')
        
        # Apply filters
        params = request.query_params
        
        # Text search (query string)
        search_query = params.get('q', '').strip()
        if search_query:
            term_norm = unidecode(search_query).lower()
            queryset = queryset.filter(
                Q(title_normalized__icontains=term_norm) |
                Q(description_normalized__icontains=term_norm)
            )
        
        # Date range filters
        start_at_after = params.get('start_at_after')
        if start_at_after:
            try:
                start_date = datetime.fromisoformat(start_at_after.replace('Z', '+00:00'))
                queryset = queryset.filter(start_at__gte=start_date)
            except (ValueError, AttributeError):
                pass
        
        start_at_before = params.get('start_at_before')
        if start_at_before:
            try:
                end_date = datetime.fromisoformat(start_at_before.replace('Z', '+00:00'))
                queryset = queryset.filter(start_at__lte=end_date)
            except (ValueError, AttributeError):
                pass
        
        # Country filter
        country_id = params.get('country')
        if country_id:
            try:
                queryset = queryset.filter(country_id=int(country_id))
            except (ValueError, TypeError):
                pass
        
        # Event format filter
        event_format = params.get('event_format')
        if event_format in ['presencial', 'virtual', 'hybrid']:
            queryset = queryset.filter(event_format=event_format)
        
        # Theme filter (can be multiple)
        theme_ids = params.getlist('theme')
        if theme_ids:
            try:
                theme_ids = [int(tid) for tid in theme_ids]
                queryset = queryset.filter(themes__id__in=theme_ids).distinct()
            except (ValueError, TypeError):
                pass
        
        # Actor filter (can be multiple)
        actor_ids = params.getlist('actor')
        if actor_ids:
            try:
                actor_ids = [int(aid) for aid in actor_ids]
                queryset = queryset.filter(actors__id__in=actor_ids).distinct()
            except (ValueError, TypeError):
                pass
        
        # Organization filter
        org_id = params.get('organization')
        if org_id:
            try:
                queryset = queryset.filter(organization_id=int(org_id))
            except (ValueError, TypeError):
                pass
        
        # Paginate
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = PublicEventSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = PublicEventSerializer(queryset, many=True)
        return Response(serializer.data)


class PublicEventDetailAPIView(APIView):
    """
    GET /api/v1/events/{id}/
    
    Public endpoint to get a single published event with all relationships.
    Returns 404 if event is not published.
    """
    
    @extend_schema(
        summary="Get event details",
        description="Returns complete event information including links, documents, and taxonomies",
        responses={200: PublicEventDetailSerializer, 404: OpenApiTypes.OBJECT}
    )
    def get(self, request, pk):
        """
        GET /api/v1/events/{pk}/
        
        Returns complete event data for detail page rendering.
        Only returns published events.
        """
        event = get_object_or_404(
            Event.objects.filter(is_published=True).select_related(
                'organization',
                'city',
                'country'
            ).prefetch_related(
                'links',
                'document_links__document',
                'themes',
                'actors',
                'sdgs',
                'beneficiary_groups',
                'eu_policy_alignments'
            ),
            pk=pk
        )
        
        serializer = PublicEventDetailSerializer(event)
        return Response(serializer.data)


class UpcomingEventsAPIView(APIView):
    """
    GET /api/v1/events/upcoming/
    
    Returns 3-5 upcoming published events (start_at >= now).
    Ordered by start_at ascending.
    """
    
    @extend_schema(
        summary="Get upcoming events",
        description="Returns 3-5 upcoming published events for home page",
        responses={200: PublicEventSerializer(many=True)}
    )
    def get(self, request):
        """
        GET /api/v1/events/upcoming/
        
        Returns upcoming events (start_at >= now), ordered by start_at ascending.
        Limited to 5 events.
        """
        now = timezone.now()
        
        upcoming_events = Event.objects.filter(
            is_published=True,
            start_at__gte=now
        ).select_related(
            'organization',
            'city',
            'country'
        ).prefetch_related(
            'themes',
            'actors'
        ).order_by('start_at')[:5]
        
        serializer = PublicEventSerializer(upcoming_events, many=True)
        return Response({
            'events': serializer.data
        })


class DocumentEventsAPIView(APIView):
    """
    GET /api/v1/documents/{id}/events/
    
    Returns published events linked to a document.
    """
    
    @extend_schema(
        summary="Get events for a document",
        description="Returns published events linked to a specific document",
        responses={200: PublicEventSerializer(many=True), 404: OpenApiTypes.OBJECT}
    )
    def get(self, request, pk):
        """
        GET /api/v1/documents/{pk}/events/
        
        Returns published events linked to the document via DocumentEvent.
        """
        from apps.documents.models import Document
        
        document = get_object_or_404(Document, pk=pk)
        
        # Get published events linked to this document
        events = Event.objects.filter(
            is_published=True,
            document_links__document=document
        ).select_related(
            'organization',
            'city',
            'country'
        ).prefetch_related(
            'themes',
            'actors'
        ).distinct().order_by('-start_at')
        
        serializer = PublicEventSerializer(events, many=True)
        return Response({
            'events': serializer.data
        })


class EventSuggestAPIView(APIView):
    """
    GET /api/v1/events/suggest/?q=<término>
    Return up to 10 titles of Events similar to the term (typo-tolerance).
    Only returns suggestions for published events.
    """
    
    @extend_schema(
        summary="Get event suggestions",
        description="Returns up to 10 event titles similar to the search term (typo-tolerance)",
        parameters=[
            OpenApiParameter('q', OpenApiTypes.STR, description='Search term'),
        ],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        """
        GET /api/v1/events/suggest/?q=<term>
        
        Returns up to 10 event titles similar to the search term.
        Only includes published events.
        """
        term = request.GET.get('q', '')
        if len(term) < 2:
            return Response([])

        term_norm = unidecode(term).lower()  # Normalize term to ASCII and lowercase

        # Base queryset: only published events
        base_qs = Event.objects.filter(is_published=True)

        # Prefix search (exact match at start)
        prefix_qs = base_qs.filter(
            title_normalized__startswith=term_norm
        ).values_list('title', flat=True)[:10]

        suggestions = list(prefix_qs)

        # If not 10 suggestions, complete with fuzzy (trigram)
        if len(suggestions) < 10:
            threshold = 0.05
            fuzzy_qs = (
                base_qs
                .annotate(sim=TrigramSimilarity('title_normalized', term_norm))
                .filter(sim__gt=threshold)
                .exclude(title__in=suggestions)  # no repetir
                .order_by('-sim')[: 10 - len(suggestions)]
                .values_list('title', flat=True)
            )
            suggestions += list(fuzzy_qs)

        return Response(suggestions)

