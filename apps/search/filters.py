from django_filters import FilterSet, CharFilter, DateFromToRangeFilter, ModelMultipleChoiceFilter
from django.contrib.postgres.search import SearchQuery, SearchRank
from apps.documents.models import (
    Document, Actor, Theme, Tag, AgreementType,
    BeneficiaryGroup, Country, SdgGoal
)

class DocumentFilter(FilterSet):
    # Full-text search filter
    q = CharFilter(method='filter_fulltext')

    # Date range filter
    date = DateFromToRangeFilter(field_name='date')

    # M2M filters for related models
    actors             = ModelMultipleChoiceFilter(queryset=Actor.objects.all())
    themes             = ModelMultipleChoiceFilter(queryset=Theme.objects.all())
    tags               = ModelMultipleChoiceFilter(queryset=Tag.objects.all())
    agreement_types    = ModelMultipleChoiceFilter(queryset=AgreementType.objects.all())
    beneficiary_groups = ModelMultipleChoiceFilter(queryset=BeneficiaryGroup.objects.all())
    countries          = ModelMultipleChoiceFilter(queryset=Country.objects.all())
    sdg_alignments     = ModelMultipleChoiceFilter(queryset=SdgGoal.objects.all())

    # Exact match filters for CharFields (if applicable)
    legal_bindingness = CharFilter(field_name='legal_bindingness', lookup_expr='iexact')
    coverage_scope    = CharFilter(field_name='coverage_scope', lookup_expr='iexact')
    review_schedule   = CharFilter(field_name='review_schedule', lookup_expr='iexact')

    class Meta:
        model = Document
        fields = [
            'q', 'date', 'actors', 'themes', 'tags',
            'agreement_types', 'beneficiary_groups', 'countries', 'sdg_alignments',
            'legal_bindingness', 'coverage_scope', 'review_schedule',
        ]

    def filter_fulltext(self, queryset, name, value):
        """
        Search for the term `value` in the `search_vector`, ordering by relevance.
        """
        query = SearchQuery(value, search_type='websearch')
        return (
            queryset
            .annotate(rank=SearchRank('search_vector', query))
            .filter(search_vector=query)
            .order_by('-rank')
        )
