from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Q
from .models import Document, Location, Actor, Topic

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

def document_detail(request, document_id):
    """Document detail view"""
    document = get_object_or_404(Document, id=document_id)
    related_documents = Document.objects.filter(
        related_from__source_document=document
    ).order_by('-related_from__relationship_strength')[:5]
    
    context = {
        'document': document,
        'related_documents': related_documents,
    }
    return render(request, 'documents/detail.html', context)

