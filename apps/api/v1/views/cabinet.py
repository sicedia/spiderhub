"""
Strategic Cabinet API Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from ..services.cabinet_service import CabinetService


class CabinetSummaryAPIView(APIView):
    """Get Strategic Cabinet summary metrics (KPIs)"""
    
    @extend_schema(
        summary="Get Strategic Cabinet summary",
        description="Returns KPI metrics for a specific country",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
        ]
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        service = CabinetService()
        data = service.get_summary(country_iso3, date_from, date_to)
        return Response(data)


class CabinetTrendsAPIView(APIView):
    """Get Strategic Cabinet trends data"""
    
    @extend_schema(
        summary="Get Strategic Cabinet trends",
        description="Returns trends by year and legal bindingness/coverage scope",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
        ]
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        service = CabinetService()
        data = service.get_trends(country_iso3, date_from, date_to)
        return Response(data)


class CabinetMapAPIView(APIView):
    """Get Strategic Cabinet cooperation map data"""
    
    @extend_schema(
        summary="Get Strategic Cabinet cooperation map",
        description="Returns cooperation network data for map visualization",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
        ]
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        service = CabinetService()
        data = service.get_cooperation_map(country_iso3, date_from, date_to)
        return Response(data)


class CabinetMixAPIView(APIView):
    """Get Strategic Cabinet document mix data"""
    
    @extend_schema(
        summary="Get Strategic Cabinet document mix",
        description="Returns document composition by bindingness, type, and scope",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
        ]
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        service = CabinetService()
        data = service.get_document_mix(country_iso3, date_from, date_to)
        return Response(data)


class CabinetTopAPIView(APIView):
    """Get Strategic Cabinet top themes, actors, and SDGs"""
    
    @extend_schema(
        summary="Get Strategic Cabinet top items",
        description="Returns top themes, actors, and SDGs for a country",
        parameters=[
            OpenApiParameter('country', OpenApiTypes.STR, description='Country ISO3 code', default='ECU'),
            OpenApiParameter('date_from', OpenApiTypes.DATE, description='Start date filter'),
            OpenApiParameter('date_to', OpenApiTypes.DATE, description='End date filter'),
            OpenApiParameter('limit', OpenApiTypes.INT, description='Number of items to return', default=10),
        ]
    )
    def get(self, request):
        country_iso3 = request.GET.get('country', 'ECU')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        limit = int(request.GET.get('limit', 10))
        
        service = CabinetService()
        data = service.get_top_items(country_iso3, date_from, date_to, limit)
        return Response(data)

