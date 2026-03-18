"""Public Events API Views."""

from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from apps.events.models import Event
from apps.events.serializers import PublicEventSerializer, PublicEventDetailSerializer
from apps.api.pagination import StandardResultsSetPagination


class PublicEventsListAPIView(APIView):
    """GET /api/v1/events/ — published events with filtering & pagination (20/page)."""

    pagination_class = StandardResultsSetPagination

    @extend_schema(
        summary="List published events",
        parameters=[
            OpenApiParameter("q", OpenApiTypes.STR, description="Search in title/summary"),
            OpenApiParameter("source", OpenApiTypes.STR, description="EventSource slug"),
            OpenApiParameter("category", OpenApiTypes.STR),
            OpenApiParameter("modality", OpenApiTypes.STR),
            OpenApiParameter("upcoming", OpenApiTypes.BOOL, description="Only future events"),
            OpenApiParameter("start_at_after", OpenApiTypes.DATE),
            OpenApiParameter("start_at_before", OpenApiTypes.DATE),
            OpenApiParameter("country", OpenApiTypes.INT),
            OpenApiParameter("page", OpenApiTypes.INT),
            OpenApiParameter("page_size", OpenApiTypes.INT),
        ],
        responses={200: PublicEventSerializer(many=True)},
    )
    def get(self, request):
        qs = (
            Event.objects.filter(is_published=True)
            .select_related("source", "country")
            .order_by("start_at", "title")
        )

        params = request.query_params

        if q := params.get("q", "").strip():
            qs = qs.filter(Q(title__icontains=q) | Q(summary__icontains=q))

        if val := params.get("source"):
            qs = qs.filter(source__slug=val)

        if val := params.get("category"):
            qs = qs.filter(category=val)

        if val := params.get("modality"):
            if val in ("virtual", "presencial", "hybrid"):
                qs = qs.filter(modality=val)

        if params.get("upcoming", "").lower() in ("true", "1", "yes"):
            qs = qs.filter(start_at__gte=timezone.now())

        if val := params.get("start_at_after"):
            qs = qs.filter(start_at__gte=val)

        if val := params.get("start_at_before"):
            qs = qs.filter(start_at__lte=val)

        if val := params.get("country"):
            qs = qs.filter(country_id=val)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            return paginator.get_paginated_response(
                PublicEventSerializer(page, many=True).data
            )
        return Response(PublicEventSerializer(qs, many=True).data)


class PublicEventDetailAPIView(APIView):
    """GET /api/v1/events/{id}/"""

    @extend_schema(
        summary="Get event details",
        responses={200: PublicEventDetailSerializer},
    )
    def get(self, request, pk):
        event = get_object_or_404(
            Event.objects.filter(is_published=True).select_related("source", "country"),
            pk=pk,
        )
        return Response(PublicEventDetailSerializer(event).data)


class UpcomingEventsAPIView(APIView):
    """GET /api/v1/events/upcoming/ — next 5 published events."""

    @extend_schema(
        summary="Get upcoming events",
        responses={200: PublicEventSerializer(many=True)},
    )
    def get(self, request):
        upcoming = (
            Event.objects.filter(is_published=True, start_at__gte=timezone.now())
            .select_related("source", "country")
            .order_by("start_at")[:5]
        )
        return Response({"events": PublicEventSerializer(upcoming, many=True).data})


class EventSuggestAPIView(APIView):
    """GET /api/v1/events/suggest/?q=<term>"""

    @extend_schema(
        summary="Autocomplete event titles",
        parameters=[OpenApiParameter("q", OpenApiTypes.STR)],
        responses={200: OpenApiTypes.OBJECT},
    )
    def get(self, request):
        term = request.GET.get("q", "")
        if len(term) < 2:
            return Response([])

        suggestions = list(
            Event.objects.filter(is_published=True, title__icontains=term)
            .values_list("title", flat=True)[:10]
        )
        return Response(suggestions)
