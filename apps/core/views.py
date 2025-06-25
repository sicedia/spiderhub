from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.db.models import Count, Q
from apps.documents.models import (
    Document, Actor, Theme, BeneficiaryGroup, SDG, CommitmentDetail, Country
)
import logging
from django.db import connection
import re
from django.db.models import Value
from django.db.models.functions import Coalesce
from collections import defaultdict

logger = logging.getLogger(__name__)

def health_check(request):
    """Comprehensive health check endpoint for production"""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected',
            'version': '1.0.0'
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)

def home_page(request):
    """Home page view with recent documents"""
    template_name = 'core/home.html'
    
    # Get recent documents with optimized queries
    recent_documents = (
        Document.objects
        .select_related('event_country', 'created_by')
        .order_by('-created_at')[:6]
    )
    
    # Count countries that have documents using Q objects to check all country relationships
    total_countries = Country.objects.filter(
        Q(document__isnull=False) |  # event_country relationship (default related_name)
        Q(lead_documents__isnull=False)   # lead_country relationship
    ).distinct().count()
    
    total_beneficiary_groups = BeneficiaryGroup.objects.filter(
        documents__isnull=False
    ).distinct().count()
    
    context = {
        'recent_documents': recent_documents,
        'total_documents': Document.objects.count(),
        'total_countries': total_countries,
        'total_actors': Actor.objects.count(),
        'total_themes': Theme.objects.count(),
        'total_beneficiary_groups': total_beneficiary_groups,
    }

    return render(request, template_name, context)

def about_page(request):
    """About page view"""
    return render(request, 'core/about.html')

def explore_page(request):
    """Explore page view with filters for search interface"""
    template_name = 'core/explore.html'

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
            entry['commitment_class'],  # slug
            entry['commitment_class'].replace('_', ' ').title(),  # label
            entry['count']) for entry in agreement_qs
    ]
    
    # 3) Countries - Use all available reverse relationships
    available_countries = (
        Country.objects
        .filter(document__isnull=False)  # Solo países que tienen documentos
        .annotate(
            doc_count=Count('document', distinct=True)  # Contar documentos únicos
        )
        .values_list('iso3', 'name', 'doc_count')
        .order_by('name')
    )

    # 4) Actors: M2M → Actor with document count
    actors_qs = (
        Actor.objects
             .annotate(count=Count('documents'))
             .order_by('-count')
    )
    available_actors = [
        (actor.id, actor.label, actor.count)
        for actor in actors_qs
    ]

    # 5) Themes: M2M → Theme with document count
    themes_qs = (
        Theme.objects
             .annotate(count=Count('documents'))
             .order_by('-count')
    )
    available_themes = [
        (theme.id, theme.label, theme.count)
        for theme in themes_qs
    ]

    # 6) Beneficiary Groups: M2M → BeneficiaryGroup with document count
    beneficiaries_qs = (
        BeneficiaryGroup.objects
                        .annotate(count=Count('documents'))
                        .order_by('-count')
    )
    available_beneficiaries = [
        (b.id, b.label, b.count)
        for b in beneficiaries_qs
    ]

    # 7) SDGs: M2M → SDG with document count
    sdgs_qs = (
        SDG.objects
           .annotate(count=Count('documents'))
           .order_by('number')
    )
    available_sdgs = [
        (s.number, s.label, s.count)
        for s in sdgs_qs
    ]

    context = {
        'available_doc_types':     available_doc_types,
        'available_legal_bindingness': available_legal_bindingness,
        'available_coverage_scope': available_coverage_scope,
        'available_agreement_types': available_agreement_types,
        'available_countries':     available_countries,
        'available_actors':        available_actors,
        'available_themes':        available_themes,
        'available_beneficiaries': available_beneficiaries,
        'available_sdgs':          available_sdgs,
    }
    return render(request, template_name, context)

def document_detail_page(request, pk):
    """Document detail view"""
    template_name = 'core/document_detail.html'
    
    document = get_object_or_404(
        Document.objects.select_related(
            'event_country', 'event_city', 'created_by'
        ).prefetch_related(
            'themes', 'actors', 'beneficiary_groups', 'sdgs',
            'practical_applications', 'commitments', 'kpis'
        ),
        pk=pk
    )
    
    context = {
        'document': document,
    }
    return render(request, template_name, context)

def analysis_page(request):
    template_name = 'core/analysis.html'
    """Analysis page view"""

    def hyphen_to_camel(s: str) -> str:
        """
        Transform 'kebab-case' (p. ej. 'non-binding') to 'camelCase' ('nonBinding').
        """
        parts = s.split('-')
        return parts[0] + ''.join(word.capitalize() for word in parts[1:])
    
    def get_lead_country_counts():
        """Get document counts by lead country"""
        return dict(
            Document.objects
            .filter(lead_country__isnull=False)  # Only documents with lead countries
            .values('lead_country__iso3')  # Get country ISO3 code instead of name
            .annotate(count=Count('id'))
            .values_list('lead_country__iso3', 'count')
        )
    
    # 1) Countries - Use available reverse relationships (for general country data)
    countries_qs = (
        Country.objects
        .filter(
            Q(lead_documents__isnull=False) |
            Q(mentioned_in_documents__isnull=False) |
            Q(document__isnull=False)  # Try the singular form
        )
        .annotate(
            count=Count('lead_documents', distinct=True) + 
                  Count('mentioned_in_documents', distinct=True) +
                  Count('document', distinct=True)
        )
        .order_by('-count')
    )
    countries = {
        country.iso3: country.count
        for country in countries_qs
    }
    
    country_names = {
        country.iso3: country.name
        for country in countries_qs
    }

    # 1.1) Lead countries specifically (for the lead country chart)
    lead_country_counts = get_lead_country_counts()

    # 2) SDGs: M2M → SDG with document count
    sdgs_qs = (
        SDG.objects
           .annotate(count=Count('documents'))
           .order_by('number')
    )
    sdgs = {
        f'sdg{s.number}': s.count
        for s in sdgs_qs
    }

    # 3) Bindingness
    raw_legal_bindingness_choices = Document.legal_bindingness.field.choices
    legal_bindingness_qs = (
        Document.objects
                .values('legal_bindingness')
                .annotate(count=Count('id'))
    )
    legal_bindingness_counts = {entry['legal_bindingness']: entry['count'] for entry in legal_bindingness_qs}
    legal_bindingness = {
        hyphen_to_camel(slug): legal_bindingness_counts.get(slug, 0)
        for slug, label in raw_legal_bindingness_choices
    }

    # 4) Coverage Scope
    raw_coverage_scope_choices = Document.coverage_scope.field.choices
    coverage_scope_qs = (
        Document.objects
                .values('coverage_scope')
                .annotate(count=Count('id'))
    )
    coverage_scope_counts = {entry['coverage_scope']: entry['count'] for entry in coverage_scope_qs}
    coverage_scope = {
        hyphen_to_camel(slug.lower()): coverage_scope_counts.get(slug, 0)
        for slug, label in raw_coverage_scope_choices
    }

    agreements_qs = Document.objects.filter(document_type__startswith="agreements")

    # 5) Agreements by Theme (categoría)
    cat_counts_qs = (
        Theme.objects
            .filter(documents__in=agreements_qs)
            .values('category')
            .annotate(count=Count('documents', distinct=True))
    )
    raw_cat_counts = {
        (entry['category'] or 'Uncategorised'): entry['count']
        for entry in cat_counts_qs
    }

    # b) respetar el orden definido en CATEGORY_CHOICES
    theme_counts = {
        label: raw_cat_counts.get(slug, 0)
        for slug, label in Theme.CATEGORY_CHOICES
    }
    # 6) Theme × Beneficiary-Group matrix (solo documentos "agreements_")

    raw_matrix_qs = (
        Document.objects
                .filter(pk__in=agreements_qs)
                .values(
                    theme_cat=Coalesce('themes__category', Value('Uncategorised')),
                    ben_cat=Coalesce('beneficiary_groups__category', Value('Uncategorised'))
                )
                .distinct()               
                .annotate(count=Count('id'))
    )

    # 1. Lista ordenada de categorías de cada eje
    THEME_CATS = [label for slug, label in Theme.CATEGORY_CHOICES]
    BEN_CATS   = [label for slug, label in BeneficiaryGroup.CATEGORY_CHOICES]

    # 2. Matriz inicial (todos a 0)
    matrix = {t: {b: 0 for b in BEN_CATS} for t in THEME_CATS}

    # 3. Rellena con los counts reales
    for row in raw_matrix_qs:
        theme_label = dict(Theme.CATEGORY_CHOICES).get(row['theme_cat'], 'Uncategorised')
        ben_label   = dict(BeneficiaryGroup.CATEGORY_CHOICES).get(row['ben_cat'], 'Uncategorised')
        matrix[theme_label][ben_label] = row['count']

    # 5. Agreements by actors
    actor_cat_qs = (
        Actor.objects
            .filter(documents__in=agreements_qs)
            .values('category')
            .annotate(count=Count('documents', distinct=True))
    )

    raw_actor_counts = {
        (row['category'] or 'Uncategorised'): row['count']
        for row in actor_cat_qs
    }

    actor_counts = {
        label: raw_actor_counts.get(slug, 0)
        for slug, label in Actor.CATEGORY_CHOICES
    }
    # 6) Agreements by Beneficiary-Group (categoría)
    ben_cat_qs = (
        BeneficiaryGroup.objects
            .filter(documents__in=agreements_qs)
            .values('category')
            .annotate(count=Count('documents', distinct=True))
    )

    raw_ben_counts = {
        (row['category'] or 'Uncategorised'): row['count']
        for row in ben_cat_qs
    }

    beneficiary_counts = {
        label: raw_ben_counts.get(slug, 0)
        for slug, label in BeneficiaryGroup.CATEGORY_CHOICES
    }
    
    context = {
        "summary": {
            'total_documents': Document.objects.count(),
            'active_countries': len(countries),
        },
        "analysis_data": {
        "sdg_counts":     sdgs,
        "binding_counts": legal_bindingness,
        "country_counts": countries,
        "lead_country_counts": lead_country_counts,  # Add this line
        "country_names": country_names,
        
        "scope_counts":   coverage_scope,
        "theme_counts":   theme_counts,  
        "theme_ben_matrix": matrix,
        "actor_counts":  actor_counts,  
        "beneficiary_counts": beneficiary_counts,
        },
    }

    return render(request, template_name, context)
