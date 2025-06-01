from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.postgres.search import TrigramSimilarity
from apps.documents.models import Document
from .filters import DocumentFilter
from .serializers import DocumentListSerializer
from unidecode import unidecode

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class DocumentSearchAPIView(ListAPIView):
    """
    Endpoint: GET /api/search/documents/?<filters>
    Returns paginated list of Document based on DocumentFilter.
    """
    queryset = (
        Document.objects.all()
        .select_related('location', 'created_by')
        .prefetch_related(
            'actors', 'themes', 'tags',
            'agreement_types', 'beneficiary_groups',
            'countries', 'sdg_alignments'
        )
    )
    serializer_class = DocumentListSerializer
    filterset_class = DocumentFilter
    pagination_class = StandardResultsSetPagination

class SuggestAPIView(APIView):
    """
    Endpoint: GET /api/search/suggest/?q=<término>
    Return up to 10 titles of Documents similar to the term (typo-tolerance).
    """
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

