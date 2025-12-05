"""
Custom Admin Filters
Custom filter classes for improved UX in Django admin
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _


class CountryFilter(admin.SimpleListFilter):
    """
    Custom filter for countries that only shows countries with associated documents.
    This prevents showing hundreds of countries when only a few are actually used.
    """
    title = _('Country')
    parameter_name = 'country'

    def lookups(self, request, model_admin):
        """
        Return a list of tuples. The first element in each tuple is the coded value
        for the option that will appear in the URL query. The second element is the
        human-readable name for the option that will appear in the right sidebar.
        """
        # Get distinct countries that have documents
        from ..models import Country, Document
        
        # Get countries used as lead_country (related_name="lead_documents")
        lead_countries = Country.objects.filter(
            lead_documents__isnull=False
        ).distinct().order_by('name')
        
        # Get countries used as event_country
        # Since event_country doesn't have explicit related_name, we query Document directly
        event_country_ids = Document.objects.filter(
            event_country__isnull=False
        ).values_list('event_country_id', flat=True).distinct()
        event_countries = Country.objects.filter(id__in=event_country_ids).order_by('name')
        
        # Combine and deduplicate
        all_countries = (lead_countries | event_countries).distinct().order_by('name')
        
        return [(country.id, f"{country.name} ({country.iso3})") for country in all_countries]

    def queryset(self, request, queryset):
        """
        Filter the queryset based on the value provided in the query string.
        """
        if self.value():
            return queryset.filter(lead_country_id=self.value()) | queryset.filter(event_country_id=self.value())
        return queryset


class LeadCountryFilter(admin.SimpleListFilter):
    """
    Custom filter for lead countries that only shows countries with documents as lead.
    """
    title = _('Lead Country')
    parameter_name = 'lead_country'

    def lookups(self, request, model_admin):
        from ..models import Country
        
        # Get countries that have documents as lead_country (related_name="lead_documents")
        countries = Country.objects.filter(
            lead_documents__isnull=False
        ).distinct().order_by('name')
        
        return [(country.id, f"{country.name} ({country.iso3})") for country in countries]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(lead_country_id=self.value())
        return queryset


class EventCountryFilter(admin.SimpleListFilter):
    """
    Custom filter for event countries that only shows countries with documents as event location.
    """
    title = _('Event Country')
    parameter_name = 'event_country'

    def lookups(self, request, model_admin):
        from ..models import Country
        
        # Get countries that have documents as event_country
        # Query Document directly since no explicit related_name
        from ..models import Document
        event_country_ids = Document.objects.filter(
            event_country__isnull=False
        ).values_list('event_country_id', flat=True).distinct()
        countries = Country.objects.filter(id__in=event_country_ids).order_by('name')
        
        return [(country.id, f"{country.name} ({country.iso3})") for country in countries]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(event_country_id=self.value())
        return queryset


class YearFilter(admin.SimpleListFilter):
    """
    Custom filter for years extracted from event_date.
    Only shows years that actually have documents.
    """
    title = _('Year')
    parameter_name = 'year'

    def lookups(self, request, model_admin):
        from django.db.models.functions import ExtractYear
        from ..models import Document
        
        # Get distinct years from documents that have event_date
        years = Document.objects.filter(
            event_date__isnull=False
        ).annotate(
            year=ExtractYear('event_date')
        ).values_list('year', flat=True).distinct().order_by('-year')
        
        return [(str(year), str(year)) for year in years]

    def queryset(self, request, queryset):
        if self.value():
            from django.db.models import Q
            return queryset.filter(event_date__year=self.value())
        return queryset


class ScoreRangeFilter(admin.SimpleListFilter):
    """
    Custom filter for document scores grouped in ranges.
    """
    title = _('Score Range')
    parameter_name = 'score_range'

    def lookups(self, request, model_admin):
        return (
            ('high', _('High (80-100)')),
            ('medium', _('Medium (60-79)')),
            ('low', _('Low (0-59)')),
            ('none', _('No Score')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'high':
            return queryset.filter(score__gte=80)
        elif self.value() == 'medium':
            return queryset.filter(score__gte=60, score__lt=80)
        elif self.value() == 'low':
            return queryset.filter(score__lt=60, score__isnull=False)
        elif self.value() == 'none':
            return queryset.filter(score__isnull=True)
        return queryset

