"""
Explore Service
Business logic for explore page filters
Extracted from apps.core.views.explore_page()
"""
import logging
from collections import defaultdict
from django.db.models import Count, Q
from apps.documents.models import (
    Document, Country, Actor, Theme, BeneficiaryGroup, SDG, CommitmentDetail
)

logger = logging.getLogger(__name__)


class ExploreService:
    """Service for explore page filter data"""
    
    def get_available_filters(self):
        """Get all available filter options with counts"""
        # 1) Document Type
        raw_doc_type_choices = Document.document_type.field.choices
        doc_type_counts_qs = (
            Document.objects
            .values('document_type')
            .annotate(count=Count('id'))
        )
        doc_type_counts = {entry['document_type']: entry['count'] for entry in doc_type_counts_qs}
        available_doc_types = sorted([
            (slug, label, doc_type_counts.get(slug, 0))
            for slug, label in raw_doc_type_choices
        ], key=lambda x: x[2], reverse=True)
        
        # 2) Legal Characteristics
        # 2.1) Legal Bindingness
        raw_legal_bindingness_choices = Document.legal_bindingness.field.choices
        legal_bindingness_qs = (
            Document.objects
            .values('legal_bindingness')
            .annotate(count=Count('id'))
        )
        legal_bindingness_counts = {entry['legal_bindingness']: entry['count'] for entry in legal_bindingness_qs}
        available_legal_bindingness = sorted([
            (slug, label, legal_bindingness_counts.get(slug, 0))
            for slug, label in raw_legal_bindingness_choices
        ], key=lambda x: x[2], reverse=True)
        
        # 2.2) Coverage Scope
        raw_coverage_scope_choices = Document.coverage_scope.field.choices
        coverage_scope_qs = (
            Document.objects
            .values('coverage_scope')
            .annotate(count=Count('id'))
        )
        coverage_scope_counts = {entry['coverage_scope']: entry['count'] for entry in coverage_scope_qs}
        available_coverage_scope = sorted([
            (slug, label, coverage_scope_counts.get(slug, 0))
            for slug, label in raw_coverage_scope_choices
        ], key=lambda x: x[2], reverse=True)
        
        # 2.3) Agreement Types
        agreement_qs = (
            CommitmentDetail.objects
            .filter(commitment_class__isnull=False)
            .exclude(commitment_class='')
            .values('commitment_class')
            .annotate(
                count=Count('commitment__document__pk', distinct=True)
            )
            .order_by('-count')
        )
        available_agreement_types = [(
            entry['commitment_class'],
            entry['commitment_class'].replace('_', ' ').title(),
            entry['count']
        ) for entry in agreement_qs]
        
        # 3) Countries - Include ALL roles (event, lead, involved)
        country_doc_counts = defaultdict(set)
        
        # Query 1: Event countries
        for doc_id, country_iso3 in Document.objects.filter(
            event_country__isnull=False
        ).values_list('id', 'event_country__iso3'):
            country_doc_counts[country_iso3].add(doc_id)
        
        # Query 2: Lead countries
        for doc_id, country_iso3 in Document.objects.filter(
            lead_country__isnull=False
        ).values_list('id', 'lead_country__iso3'):
            country_doc_counts[country_iso3].add(doc_id)
        
        # Query 3: Involved countries (M2M relationship)
        for doc_id, country_iso3 in Document.objects.filter(
            countries_involved__isnull=False
        ).values_list('id', 'countries_involved__iso3'):
            country_doc_counts[country_iso3].add(doc_id)
        
        # Get country names in one query
        country_names = dict(
            Country.objects.filter(iso3__in=country_doc_counts.keys())
            .values_list('iso3', 'name')
        )
        
        # Build final list with counts
        available_countries = sorted([
            (iso3, country_names.get(iso3, iso3), len(doc_ids))
            for iso3, doc_ids in country_doc_counts.items()
            if len(doc_ids) > 0
        ], key=lambda x: x[1])
        
        # 4) Actors
        actors_qs = (
            Actor.objects
            .annotate(count=Count('documents'))
            .order_by('-count')
        )
        available_actors = [
            (actor.id, actor.label, actor.count)
            for actor in actors_qs
        ]
        
        # 5) Themes
        themes_qs = (
            Theme.objects
            .annotate(count=Count('documents'))
            .order_by('-count')
        )
        available_themes = [
            (theme.id, theme.label, theme.count)
            for theme in themes_qs
        ]
        
        # 6) Beneficiary Groups
        beneficiaries_qs = (
            BeneficiaryGroup.objects
            .annotate(count=Count('documents'))
            .order_by('-count')
        )
        available_beneficiaries = [
            (b.id, b.label, b.count)
            for b in beneficiaries_qs
        ]
        
        # 7) SDGs
        sdgs_qs = (
            SDG.objects
            .annotate(count=Count('documents'))
            .order_by('number')
        )
        available_sdgs = [
            (s.number, s.label, s.count)
            for s in sdgs_qs
        ]
        
        return {
            'available_doc_types': available_doc_types,
            'available_legal_bindingness': available_legal_bindingness,
            'available_coverage_scope': available_coverage_scope,
            'available_agreement_types': available_agreement_types,
            'available_countries': available_countries,
            'available_actors': available_actors,
            'available_themes': available_themes,
            'available_beneficiaries': available_beneficiaries,
            'available_sdgs': available_sdgs,
        }

