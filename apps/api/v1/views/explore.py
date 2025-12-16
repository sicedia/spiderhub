"""
Explore API Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from ..services.explore_service import ExploreService


class ExploreFiltersAPIView(APIView):
    """Get available filters for explore page"""
    
    @extend_schema(
        summary="Get explore filters",
        description="Returns all available filter options with counts for the explore page",
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        service = ExploreService()
        data = service.get_available_filters()
        return Response(data)

