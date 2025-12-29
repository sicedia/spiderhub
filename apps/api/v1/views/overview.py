"""
Overview API Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from ..services.overview_service import OverviewService


class OverviewSummaryAPIView(APIView):
    """Get Overview summary metrics (KPIs)"""
    
    @extend_schema(
        summary="Get Overview summary",
        description="Returns KPI metrics for a specific country",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
        ],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        service = OverviewService()
        data = service.get_summary(country_iso3, date_from, date_to)
        return Response(data)


class OverviewTrendsAPIView(APIView):
    """Get Overview trends data"""
    
    @extend_schema(
        summary="Get Overview trends",
        description="Returns trends by year and legal bindingness/coverage scope",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
        ],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        service = OverviewService()
        data = service.get_trends(country_iso3, date_from, date_to)
        return Response(data)


class OverviewMapAPIView(APIView):
    """Get Overview cooperation map data"""
    
    @extend_schema(
        summary="Get Overview cooperation map",
        description="Returns cooperation network data for map visualization",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
        ],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        service = OverviewService()
        data = service.get_cooperation_map(country_iso3, date_from, date_to)
        return Response(data)


class OverviewMixAPIView(APIView):
    """Get Overview document mix data"""
    
    @extend_schema(
        summary="Get Overview document mix",
        description="Returns document composition by bindingness, type, and scope",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
        ],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        service = OverviewService()
        data = service.get_document_mix(country_iso3, date_from, date_to)
        return Response(data)


class OverviewTopAPIView(APIView):
    """Get Overview top themes, actors, and SDGs"""
    
    @extend_schema(
        summary="Get Overview top items",
        description="Returns top themes, actors, and SDGs for a country",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
            OpenApiParameter('limit', OpenApiTypes.INT, description='Number of items to return', default=10),
        ],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        limit = int(request.GET.get('limit', 10))
        
        service = OverviewService()
        data = service.get_top_items(country_iso3, date_from, date_to, limit)
        return Response(data)

