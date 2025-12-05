"""
Cabinet Service
Business logic for Strategic Cabinet endpoints
Extracted from apps.core.views.api_cabinet_* functions
"""
import logging
from django.db.models import Count, Q
from apps.documents.models import Document, Theme, Actor, SDG

logger = logging.getLogger(__name__)


class CabinetService:
    """Service for Strategic Cabinet data calculations"""
    
    def _get_base_queryset(self, country_iso3, date_from=None, date_to=None):
        """Get base queryset for country participation (lead ∪ involved ∪ event)"""
        queryset = Document.objects.filter(
            Q(event_country__iso3=country_iso3) |
            Q(lead_country__iso3=country_iso3) |
            Q(countries_involved__iso3=country_iso3)
        ).distinct()
        
        if date_from:
            queryset = queryset.filter(event_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(event_date__lte=date_to)
        
        return queryset
    
    def get_summary(self, country_iso3='ECU', date_from=None, date_to=None):
        """Get summary metrics (KPIs) for Strategic Cabinet"""
        queryset = self._get_base_queryset(country_iso3, date_from, date_to)
        
        total_documents = queryset.count()
        
        # Active Partnerships (distinct countries)
        partner_countries = set()
        
        involved = queryset.values_list('countries_involved__iso3', flat=True)
        partner_countries.update([c for c in involved if c and c != country_iso3])
        
        leads = queryset.values_list('lead_country__iso3', flat=True)
        partner_countries.update([c for c in leads if c and c != country_iso3])
        
        events = queryset.values_list('event_country__iso3', flat=True)
        partner_countries.update([c for c in events if c and c != country_iso3])
        
        active_partnerships = len(partner_countries)
        
        # Thematic Areas
        thematic_areas = Theme.objects.filter(documents__in=queryset).distinct().count()
        
        # Leadership Initiatives
        leadership_initiatives = queryset.filter(lead_country__iso3=country_iso3).count()
        
        return {
            'total_documents': total_documents,
            'active_partnerships': active_partnerships,
            'thematic_areas': thematic_areas,
            'leadership_initiatives': leadership_initiatives,
            'country': country_iso3
        }
    
    def get_trends(self, country_iso3='ECU', date_from=None, date_to=None):
        """Get trends data by year and legal bindingness/coverage scope"""
        queryset = self._get_base_queryset(country_iso3, date_from, date_to)
        
        trends_data = []
        scope_trends = []
        years = queryset.dates('event_date', 'year', order='ASC')
        
        for year in years:
            year_docs = queryset.filter(event_date__year=year.year)
            
            # Group by legal bindingness
            for choice_slug, choice_label in Document._meta.get_field('legal_bindingness').choices:
                count = year_docs.filter(legal_bindingness=choice_slug).count()
                if count > 0:
                    trends_data.append({
                        'year': year.year,
                        'category': choice_label,
                        'count': count
                    })
            
            # Group by coverage scope
            for choice_slug, choice_label in Document._meta.get_field('coverage_scope').choices:
                count = year_docs.filter(coverage_scope=choice_slug).count()
                if count > 0:
                    scope_trends.append({
                        'year': year.year,
                        'category': choice_label,
                        'count': count
                    })
        
        return {
            'trends_by_bindingness': trends_data,
            'trends_by_scope': scope_trends,
            'country': country_iso3,
            'total_documents': queryset.count()
        }
    
    def get_cooperation_map(self, country_iso3='ECU', date_from=None, date_to=None):
        """Get cooperation network map data"""
        queryset = self._get_base_queryset(country_iso3, date_from, date_to)
        
        country_map = {}
        
        # Countries involved
        country_counts = (
            queryset
            .values('countries_involved__iso3', 'countries_involved__name')
            .annotate(count=Count('id', distinct=True))
            .filter(countries_involved__isnull=False)
        )
        
        for item in country_counts:
            iso3 = item['countries_involved__iso3']
            if iso3 and iso3 != country_iso3:
                if iso3 not in country_map:
                    country_map[iso3] = {
                        'iso3': iso3,
                        'name': item['countries_involved__name'],
                        'count': 0
                    }
                country_map[iso3]['count'] += item['count']
        
        # Lead countries
        lead_counts = (
            queryset
            .values('lead_country__iso3', 'lead_country__name')
            .annotate(count=Count('id', distinct=True))
            .filter(lead_country__isnull=False)
        )
        
        for item in lead_counts:
            iso3 = item['lead_country__iso3']
            if iso3 and iso3 != country_iso3:
                if iso3 not in country_map:
                    country_map[iso3] = {
                        'iso3': iso3,
                        'name': item['lead_country__name'],
                        'count': 0
                    }
                country_map[iso3]['count'] += item['count']
        
        # Event countries
        event_counts = (
            queryset
            .values('event_country__iso3', 'event_country__name')
            .annotate(count=Count('id', distinct=True))
            .filter(event_country__isnull=False)
        )
        
        for item in event_counts:
            iso3 = item['event_country__iso3']
            if iso3 and iso3 != country_iso3:
                if iso3 not in country_map:
                    country_map[iso3] = {
                        'iso3': iso3,
                        'name': item['event_country__name'],
                        'count': 0
                    }
                country_map[iso3]['count'] += item['count']
        
        cooperation_data = sorted(country_map.values(), key=lambda x: x['count'], reverse=True)
        
        return {
            'cooperation': cooperation_data,
            'focus_country': country_iso3
        }
    
    def get_document_mix(self, country_iso3='ECU', date_from=None, date_to=None):
        """Get document composition (bindingness, types, scope)"""
        queryset = self._get_base_queryset(country_iso3, date_from, date_to)
        
        # Legal bindingness distribution
        bindingness_data = []
        for choice_slug, choice_label in Document._meta.get_field('legal_bindingness').choices:
            count = queryset.filter(legal_bindingness=choice_slug).count()
            if count > 0:
                bindingness_data.append({
                    'label': choice_label,
                    'value': count
                })
        
        # Document type distribution
        type_data = []
        for choice_slug, choice_label in Document._meta.get_field('document_type').choices:
            count = queryset.filter(document_type=choice_slug).count()
            if count > 0:
                type_data.append({
                    'label': choice_label,
                    'value': count
                })
        
        # Coverage scope distribution
        scope_data = []
        for choice_slug, choice_label in Document._meta.get_field('coverage_scope').choices:
            count = queryset.filter(coverage_scope=choice_slug).count()
            if count > 0:
                scope_data.append({
                    'label': choice_label,
                    'value': count
                })
        
        return {
            'bindingness': bindingness_data,
            'document_types': type_data,
            'coverage_scope': scope_data
        }
    
    def get_top_items(self, country_iso3='ECU', date_from=None, date_to=None, limit=10):
        """Get top themes, actors, and SDGs"""
        queryset = self._get_base_queryset(country_iso3, date_from, date_to)
        
        # Top themes
        top_themes = (
            Theme.objects
            .filter(documents__in=queryset)
            .annotate(count=Count('documents', distinct=True))
            .order_by('-count')[:limit]
            .values('label', 'count', 'category')
        )
        
        # Top actors
        top_actors = (
            Actor.objects
            .filter(documents__in=queryset)
            .annotate(count=Count('documents', distinct=True))
            .order_by('-count')[:limit]
            .values('label', 'count', 'category')
        )
        
        # Top SDGs
        top_sdgs = (
            SDG.objects
            .filter(documents__in=queryset)
            .annotate(count=Count('documents', distinct=True))
            .order_by('-count')[:limit]
            .values('label', 'number', 'count')
        )
        
        return {
            'themes': list(top_themes),
            'actors': list(top_actors),
            'sdgs': list(top_sdgs)
        }

