"""
App Info API Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from django.conf import settings


class AppVersionAPIView(APIView):
    """Get current application version from STATIC_VERSION"""
    
    @extend_schema(
        summary="Get application version",
        description="Returns the current application version (STATIC_VERSION) for cache busting and update detection",
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        version = getattr(settings, 'STATIC_VERSION', 'unknown')
        return Response({
            'version': version,
        })

