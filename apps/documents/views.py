from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import cache_page
from django.db.models import Q, Prefetch
from .models import (
    Document, Location, Actor, Topic, Theme, BeneficiaryGroup,
    KPI, Commitment, SDG, PracticalApplication
)

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
            Q(topics__topic__name__icontains=query)
        ).distinct()
    
    # Handle filters
    location = request.GET.get('location', '')
    if location:
        documents = documents.filter(metadata__location__name=location)
    
    # More filters...
    
    context = {
        'documents': documents,
        'locations': Location.objects.all(),
        'actors': Actor.objects.all(),
        'topics': Topic.objects.all(),
        'query': query,
    }
    return render(request, 'documents/explore.html', context)

@cache_page(60 * 3)  # cache durante 15 minutos
def document_detail(request, document_id):
    """Document detail view optimizada con eager loading, limitación de campos y caché."""
    qs = Document.objects.select_related(
        'created_by',
        'metadata__location',
    ).only(
        'id', 'title', 'body', 'created_by_id', 'metadata__location_id'
    ).prefetch_related(
        Prefetch('actors', queryset=Actor.objects.only('id', 'name')),
        Prefetch('topics', queryset=Topic.objects.only('id', 'name')),
        Prefetch('themes', queryset=Theme.objects.only('id', 'name')),
        Prefetch('beneficiary_groups', queryset=BeneficiaryGroup.objects.only('id', 'name')),
        Prefetch('kpis__responsible_entity', queryset=KPI.objects.only('id', 'title', 'responsible_entity_id')),
        Prefetch('commitments', queryset=Commitment.objects.only('id', 'title')),
        Prefetch('sdgs', queryset=SDG.objects.only('id', 'title')),
        Prefetch('practical_applications', queryset=PracticalApplication.objects.only('id', 'name')),
        # limitamos a 5 relacionados
        Prefetch('related_from', queryset=Document.objects.only('id', 'title')[:5]),
    )
    document = get_object_or_404(qs, id=document_id)
    related_documents = document.related_from.all()  # vienen ya prefetch
    return render(request, 'documents/detail.html', {
        'document': document,
        'related_documents': related_documents,
    })

