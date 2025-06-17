from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.db.models import Count
from apps.documents.models import (
    Document, Actor, Theme, BeneficiaryGroup, SDG, CommitmentDetail
)
import logging
from django.db import connection
# Create your views here.

logger = logging.getLogger(__name__)

def health_check(request):
    """Comprehensive health check endpoint for production"""
    try:
        # Database connectivity check
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
        return JsonResponse({
            'status': 'unhealthy',
            'database': db_status,
            'error': str(e)
        }, status=503)
    
    # Additional checks can be added here
    return JsonResponse({
        'status': 'healthy',
        'database': db_status,
        "service": "spiderhub"
    })

def home_page(request):
    template_name = 'core/home.html'
    """Home page view"""
    # Fetch the latest 5 documents from the database
    recent_documents = Document.objects.all().order_by('-created_at')[:5]
    document_count = Document.objects.count()
    # Count unique countries from the documents
    country_count = Document.objects.values('country').distinct().count()
    
    # Count unique actors from the documents (assuming there's an 'actors' field)
    actors_count = Document.objects.values('actors').distinct().count()
    
    themes = Document.objects.values('themes').distinct().count()

    beneficiary_group_count = Document.objects.values('beneficiary_groups').distinct().count() 
    
    context = {
        'recent_documents': recent_documents,
        'document_count': document_count,
        'country_count': country_count,
        'actors_count': actors_count,
        'themes_count': themes,
        'beneficiary_group_count': beneficiary_group_count,
    }

    return render(request, template_name, context)

def about_page(request):
    """About page view"""
    return render(request, 'core/about.html')

def explore_page(request):
    template_name = 'core/explore.html'
    """Explore page view"""

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
    # 3) Countries
    countries_qs = (
        Document.objects
                .exclude(country__isnull=True)
                .exclude(country__exact='')
                .values('country')
                .annotate(count=Count('id'))
                .order_by('-count')
    )
    available_countries = [
        (entry['country'], entry['country'], entry['count'])
        for entry in countries_qs
    ]

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
    template_name = 'core/document_detail.html'
    """Document Detail page view"""
    document = get_object_or_404(Document, pk=pk)
    context = {
        'document': document
    }
    return render(request, template_name, context)
def test_page(request):
    """Test page view"""
    return render(request, 'core/test.html')