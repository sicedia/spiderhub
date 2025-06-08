from django_filters import FilterSet, CharFilter, DateFromToRangeFilter, ModelMultipleChoiceFilter
from django.contrib.postgres.search import SearchQuery, SearchRank
from apps.documents.models import Document, Actor, Theme, BeneficiaryGroup, SDG

class DocumentFilter(FilterSet):
    # Full-text search param “search”
    search = CharFilter(method='filter_search')

    # Date range params “event_date_after” y “event_date_before”
    event_date = DateFromToRangeFilter(field_name='event_date')

    # Taxonomy filters, usando los mismos param names que el JS
    document_type      = CharFilter(field_name='document_type', lookup_expr='exact')
    legal_bindingness  = CharFilter(field_name='legal_bindingness', lookup_expr='exact')
    coverage_scope     = CharFilter(field_name='coverage_scope', lookup_expr='exact')
    agreement_type     = CharFilter(field_name='agreement_type', lookup_expr='exact')

    # Relaciones ManyToMany
    actor               = ModelMultipleChoiceFilter(
        queryset=Actor.objects.all(),
        field_name='actors',
        to_field_name='id'
    )
    theme               = ModelMultipleChoiceFilter(
        queryset=Theme.objects.all(),
        field_name='themes',
        to_field_name='id'
    )
    beneficiary         = ModelMultipleChoiceFilter(
        queryset=BeneficiaryGroup.objects.all(),
        field_name='beneficiary_groups',
        to_field_name='id'
    )
    sdg                 = ModelMultipleChoiceFilter(
        queryset=SDG.objects.all(),
        field_name='sdgs',
        to_field_name='id'
    )

    # Campo simple
    country             = CharFilter(field_name='country', lookup_expr='icontains')

    class Meta:
        model = Document
        fields = [
            'search',
            'event_date',
            'document_type',
            'legal_bindingness',
            'coverage_scope',
            'agreement_type',
            'country',
            'actor',
            'theme',
            'beneficiary',
            'sdg',
        ]

    def filter_search(self, queryset, name, value):
        """
        Full-text search usando el campo `search_vector`
        """
        if value:
            sq = SearchQuery(value)
            return (
                queryset
                .filter(search_vector=sq)
                .annotate(rank=SearchRank('search_vector', sq))
                .order_by('-rank')
            )
        return queryset
