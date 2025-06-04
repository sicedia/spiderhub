from django_filters import FilterSet, CharFilter, DateFromToRangeFilter, ModelMultipleChoiceFilter
from django.contrib.postgres.search import SearchQuery, SearchRank
from apps.documents.models import (
    Document, Actor, Theme, BeneficiaryGroup, SDG
)

class DocumentFilter(FilterSet):
    # Full-text search across title and executive_summary
    search = CharFilter(method='filter_search')
    
    # Date range filter
    event_date = DateFromToRangeFilter(field_name='event_date')
    
    # Multi-select filters for taxonomies
    actors = ModelMultipleChoiceFilter(
        queryset=Actor.objects.all(),
        field_name='actors',
        to_field_name='id'
    )
    
    themes = ModelMultipleChoiceFilter(
        queryset=Theme.objects.all(),
        field_name='themes',
        to_field_name='id'
    )
    
    beneficiary_groups = ModelMultipleChoiceFilter(
        queryset=BeneficiaryGroup.objects.all(),
        field_name='beneficiary_groups',
        to_field_name='id'
    )
    
    sdgs = ModelMultipleChoiceFilter(
        queryset=SDG.objects.all(),
        field_name='sdgs',
        to_field_name='id'
    )
    
    # Simple text filters
    country = CharFilter(field_name='country', lookup_expr='icontains')
    city = CharFilter(field_name='city', lookup_expr='icontains')

    class Meta:
        model = Document
        fields = ['search', 'event_date', 'actors', 'themes', 'beneficiary_groups', 'sdgs', 'country', 'city']

    def filter_search(self, queryset, name, value):
        """
        Full-text search using PostgreSQL search_vector field
        """
        if value:
            search_query = SearchQuery(value)
            return queryset.filter(search_vector=search_query).annotate(
                rank=SearchRank('search_vector', search_query)
            ).order_by('-rank')
        return queryset
