from django_filters import FilterSet, CharFilter, DateFromToRangeFilter, ModelMultipleChoiceFilter
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import Q, IntegerField
from django.db.models.functions import Cast
from apps.documents.models import Document, Actor, Theme, BeneficiaryGroup, SDG, Country

class DocumentFilter(FilterSet):
    """
    Provides:
      - Full-text search across title & executive_summary
      - Date range filtering on event_date
      - Multi-select filters for actors, themes, beneficiaries & SDGs
      - Exact-match "in" filtering for document_type, coverage_scope,
        legal_bindingness, agreement_type, country & city
    """

    search = CharFilter(method='noop')
    event_date = DateFromToRangeFilter(field_name='event_date')
    actor = ModelMultipleChoiceFilter(queryset=Actor.objects.all(), field_name='actors', to_field_name='id')
    theme = ModelMultipleChoiceFilter(queryset=Theme.objects.all(), field_name='themes', to_field_name='id')
    beneficiary = ModelMultipleChoiceFilter(queryset=BeneficiaryGroup.objects.all(), field_name='beneficiary_groups', to_field_name='id')
    sdg = ModelMultipleChoiceFilter(queryset=SDG.objects.all(), field_name='sdgs__number', to_field_name='number')
    document_type     = CharFilter(method='noop')
    coverage_scope    = CharFilter(method='noop')
    legal_bindingness = CharFilter(method='noop')
    agreement_type    = CharFilter(method='noop')
    # Updated country and city filters
    country = ModelMultipleChoiceFilter(queryset=Country.objects.all(), field_name='event_country__iso3', to_field_name='iso3')
    city = CharFilter(field_name='event_city__name', lookup_expr='icontains')

    class Meta:
        model = Document
        fields = [
            'search', 'event_date',
            'actor', 'theme', 'beneficiary', 'sdg',
            'document_type', 'coverage_scope', 'legal_bindingness',
            'agreement_type', 'country', 'city',
        ]

    def filter_queryset(self, queryset):
        """
        Sobreescribe la selección para aplicar OR across all provided filters.
        """
        qs = queryset
        params = self.request.GET
        q_or = Q()

        # 1) Full-text search
        terms = params.getlist('search')
        if terms:
            combined_sq = None
            for term in terms:
                sq = SearchQuery(term)
                combined_sq = sq if combined_sq is None else combined_sq | sq
            # Annotate the queryset with search rank
            qs = qs.annotate(rank=SearchRank('search_vector', combined_sq))
            q_or |= Q(search_vector=combined_sq)

        # 2) Date range on event_date
        start = params.get('event_date_after')
        end   = params.get('event_date_before')
        if start and end:
            q_or &= Q(event_date__range=(start, end))
        elif start:
            q_or &= Q(event_date__gte=start)
        elif end:
            q_or &= Q(event_date__lte=end)

        # 3) M2M Taxonomies
        actors = params.getlist('actor')
        if actors:
            q_or |= Q(actors__in=actors)
        themes = params.getlist('theme')
        if themes:
            q_or |= Q(themes__in=themes)
        bens = params.getlist('beneficiary')
        if bens:
            q_or |= Q(beneficiary_groups__in=bens)
        sdgs = params.getlist('sdg')
        if sdgs:
            q_or |= Q(sdgs__number__in=sdgs)

        # 4) Text filters by exact match
        for field in ['document_type','coverage_scope','legal_bindingness','agreement_type']:
            vals = params.getlist(field)
            if vals:
                if field == 'agreement_type':
                    q_or |= Q(commitments__details__commitment_class__in=vals)
                else:
                    q_or |= Q(**{f"{field}__in": vals})

        # Updated country filtering with role support
        countries = params.getlist('country')
        country_role = params.get('country_role', 'any')  # Default to 'any'
        
        if countries:
            if country_role == 'lead':
                # Filter by lead_country only
                q_or |= Q(lead_country__iso3__in=countries)
            elif country_role == 'involved':
                # Filter by countries_involved only
                q_or |= Q(countries_involved__iso3__in=countries)
            elif country_role == 'event':
                # Filter by event_country only
                q_or |= Q(event_country__iso3__in=countries)
            else:  # 'any' or default
                # Filter by any role (lead ∪ involved ∪ event)
                q_or |= (
                    Q(lead_country__iso3__in=countries) |
                    Q(countries_involved__iso3__in=countries) |
                    Q(event_country__iso3__in=countries)
                )
        
        cities = params.getlist('city')  
        if cities:
            q_or |= Q(event_city__name__icontains=cities[0])  # Simple contains for now

        if q_or:
            qs = qs.filter(q_or).distinct()

        # 5) Order by search rank if applicable, otherwise by score
        if terms:
            qs = qs.order_by('-rank')
        elif not terms and 'event_date_after' not in params and 'event_date_before' not in params:
            qs = qs.annotate(
                score_value=Cast('extra__score', IntegerField())
            )
            qs = qs.order_by('-score_value', '-event_date')
        else:
            qs = qs.order_by('-event_date')
        return qs
