from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import cache_page
from django.db.models import Q, Prefetch
from django.contrib.auth.decorators import login_required
from django.http import Http404
from .models import (
    Document, Country, City, Actor, EUPolicy, Theme, BeneficiaryGroup,
    KPI, Commitment, SDG, PracticalApplication
)
from .pdf_utils import export_document_to_pdf

# Create your views here.
def explore_documents(request):
    """Explore/search documents view"""
    documents = Document.objects.all()
    
    # Handle search query
    query = request.GET.get('q', '')
    if query:
        documents = documents.filter(
            Q(title__icontains=query) | 
            Q(metadata__location__name__icontains=query) |
            Q(actors__actor__name__icontains=query) |
            Q(themes__theme__name__icontains=query)
        ).distinct()
    
    # Handle filters
    location = request.GET.get('location', '')
    if location:
        documents = documents.filter(metadata__location__name=location)
    
    # More filters...
    
    context = {
        'documents': documents,
        'actors': Actor.objects.all(),
        'themes': Theme.objects.all(),
        'query': query,
    }
    return render(request, 'documents/explore.html', context)

@cache_page(60 * 3)  # cache durante 15 minutos
def document_detail(request, document_id):
    """Document detail view optimizada con eager loading, limitación de campos y caché."""
    qs = Document.objects.select_related(
        'created_by',
        'event_country',  # Updated from 'country'
        'event_city',     # Added if needed
    ).only(
        'id', 'title', 'body', 'created_by_id', 'event_country_id', 'event_city_id',
        'executive_summary', 'event_date', 'document_type', 'coverage_scope', 
        'lead_country_id', 'legal_bindingness', 'extra'
    ).prefetch_related(
        Prefetch('actors', queryset=Actor.objects.only('id', 'name')),
        Prefetch('themes', queryset=Theme.objects.only('id', 'name')),
        Prefetch('beneficiary_groups', queryset=BeneficiaryGroup.objects.only('id', 'name')),
        Prefetch('kpis__responsible_entity', queryset=KPI.objects.only('id', 'title', 'responsible_entity_id')),
        Prefetch('commitments', queryset=Commitment.objects.only('id', 'title')),
        Prefetch('sdgs', queryset=SDG.objects.only('id', 'title')),
        Prefetch('practical_applications', queryset=PracticalApplication.objects.only('id', 'name')),
        # Agregado: prefetch para EU policy alignments
        Prefetch('eu_policy_alignments', queryset=EUPolicy.objects.only('id', 'name')),
        # limitamos a 5 relacionados
        Prefetch('related_from', queryset=Document.objects.only('id', 'title')[:5]),
    )
    document = get_object_or_404(qs, id=document_id)
    related_documents = document.related_from.all()  # vienen ya prefetch
    return render(request, 'documents/detail.html', {
        'document': document,
        'related_documents': related_documents,
    })

def export_document_pdf(request, document_id):
    """Export a single document to PDF."""
    try:
        # Get document with all related data
        document = Document.objects.select_related(
            'created_by',
            'event_country',
            'event_city',
            'lead_country',
            'human_reviewer'
        ).prefetch_related(
            'themes',
            'actors', 
            'beneficiary_groups',
            'beneficiary_groups_raw',
            'sdgs',
            'eu_policy_alignments',
            'countries_involved',
            'commitments__details',
            'kpis',
            'practical_applications',
            'source_files',
            'documenttheme_set__theme',
            'documentactor_set__actor'
        ).get(id=document_id)
        
        return export_document_to_pdf(document)
        
    except Document.DoesNotExist:
        raise Http404("Document not found")
    except Exception as e:
        # Log the error in production
        # logger.error(f"Error exporting document {document_id} to PDF: {str(e)}")
        raise Http404("Error generating PDF")



