from django_filters import FilterSet, CharFilter, DateFromToRangeFilter, ModelMultipleChoiceFilter
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import Q
from apps.documents.models import Document, Actor, Theme, BeneficiaryGroup, SDG

class DocumentFilter(FilterSet):
    """
    Provides:
      - Full-text search across title & executive_summary
      - Date range filtering on event_date
      - Multi-select filters for actors, themes, beneficiaries & SDGs
      - Exact-match “in” filtering for document_type, coverage_scope,
        legal_bindingness, agreement_type, country & city
    """

    # 1) Full-text search
    search = CharFilter(method='filter_search')

    # 2) Date range on event_date
    event_date = DateFromToRangeFilter(field_name='event_date')

    # 3) M2M taxonomies
    actor = ModelMultipleChoiceFilter(
        queryset=Actor.objects.all(),
        field_name='actors',
        to_field_name='id'
    )
    theme = ModelMultipleChoiceFilter(
        queryset=Theme.objects.all(),
        field_name='themes',
        to_field_name='id'
    )
    # beneficiary_groups   = ModelMultipleChoiceFilter(queryset=BeneficiaryGroup.objects.all())
    # sdgs                 = ModelMultipleChoiceFilter(queryset=SDG.objects.all())
    beneficiary = ModelMultipleChoiceFilter(
        queryset=BeneficiaryGroup.objects.all(),
        field_name='beneficiary_groups',
        to_field_name='id'
    )
    sdg = ModelMultipleChoiceFilter(
        queryset=SDG.objects.all(),
        field_name='sdgs',
        to_field_name='id'
    )

    # 4) Exact-match “in” filters on CharFields
    document_type        = CharFilter(field_name='document_type', lookup_expr='in')
    coverage_scope       = CharFilter(field_name='coverage_scope',  lookup_expr='in')
    legal_bindingness    = CharFilter(field_name='legal_bindingness', lookup_expr='in')
    agreement_type       = CharFilter(field_name='agreement_type', lookup_expr='in')
    country              = CharFilter(method='filter_country')
    city                 = CharFilter(field_name='city', lookup_expr='in')

    class Meta:
        model = Document
        fields = [
            'search', 'event_date',
            'actor', 'theme', 'beneficiary', 'sdg',
            'document_type', 'coverage_scope', 'legal_bindingness',
            'agreement_type', 'country', 'city',
        ]

    def filter_search(self, queryset, name, value):
        """
        Full-text search using PostgreSQL search_vector,
        ordering by relevance.
        """
        if not value:
            return queryset
        q = SearchQuery(value)
        return (
            queryset
            .filter(search_vector=q)
            .annotate(rank=SearchRank('search_vector', q))
            .order_by('-rank')
        )

    def filter_country(self, queryset, name, value):
        """
        Exact “in” filter on country.
        Supports multiple params: ?country=Belgium&country=France
        """
        values = self.request.GET.getlist(name)
        if not values:
            return queryset
        return queryset.filter(country__in=values)
