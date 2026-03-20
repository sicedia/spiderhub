"""
App Info API Views
"""
import os

from django.conf import settings
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView


class AppVersionAPIView(APIView):
    """
    Exposes deploy identity for clients (VersionCheckService).

    - build_id: changes when staticfiles.json / collected assets change (preferred).
    - version: STATIC_VERSION (typically git short hash) for display / legacy.
    """

    @extend_schema(
        summary="Get application version",
        description=(
            "Returns build_id (static bundle digest) and version label for "
            "cache busting and cross-tab reload coordination."
        ),
        responses={200: OpenApiTypes.OBJECT},
    )
    def get(self, request):
        build_id = getattr(settings, "BUILD_ID", None) or getattr(
            settings, "STATIC_VERSION", "unknown"
        )
        version = getattr(settings, "STATIC_VERSION", "unknown")
        return Response(
            {
                "build_id": build_id,
                "version": version,
                "git_commit": os.environ.get("GIT_COMMIT_HASH", ""),
            }
        )
