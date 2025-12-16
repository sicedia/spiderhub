from apps.core.pagination import StandardResultsSetPagination
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.postgres.search import TrigramSimilarity
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from apps.documents.models import Document
from .filters import DocumentFilter
from .serializers import DocumentListSerializer
from unidecode import unidecode


class DocumentSearchAPIView(ListAPIView):
    """
    GET /api/search/documents/?<filters>

    Returns a paginated, filtered list of Document instances.
    Optimizes database access by selecting the FK and prefetching
    all M2M and reverse FK relations used in serialization or filtering.
    """
    queryset = (
        Document.objects.all()
        # ForeignKey to the user who created the document
        .select_related('created_by')
        # Many-to-many and reverse FK relations
        .prefetch_related(
            'actors',               # DocumentActor through-table
            'themes',               # DocumentTheme through-table
            'beneficiary_groups',   # BeneficiaryGroup M2M
            'sdgs',                 # SDG M2M
            'commitments',          # Commitment reverse FK
            'practical_applications',  # PracticalApplication reverse FK
            'kpis',                 # KPI reverse FK
        )
    )
    serializer_class   = DocumentListSerializer
    filterset_class    = DocumentFilter
    pagination_class   = StandardResultsSetPagination

class SuggestAPIView(APIView):
    """
    Endpoint: GET /api/search/suggest/?q=<término>
    Return up to 10 titles of Documents similar to the term (typo-tolerance).
    """
    @extend_schema(
        summary="Get document suggestions",
        description="Returns up to 10 document titles similar to the search term (typo-tolerance)",
        parameters=[],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        term = request.GET.get('q', '')
        if len(term) < 2:
            return Response([])

        term_norm = unidecode(term).lower()  # Normalize term to ASCII and lowercase

        prefix_qs = Document.objects.filter(
            title_normalized__startswith=term_norm.lower()
        ).values_list('title', flat=True)[:10]

        suggestions = list(prefix_qs)

        # If not 10 suggestions, complete with fuzzy (trigram)
        if len(suggestions) < 10:
            threshold = 0.05
            fuzzy_qs = (
                Document.objects
                        .annotate(sim=TrigramSimilarity('title_normalized', term_norm.lower()))
                        .filter(sim__gt=threshold)
                        .exclude(title__in=suggestions)  # no repetir
                        .order_by('-sim')[: 10 - len(suggestions)]
                        .values_list('title', flat=True)
            )
            suggestions += list(fuzzy_qs)

        return Response(suggestions)

