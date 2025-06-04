from django.shortcuts import render
from apps.documents.models import Document
# Create your views here.

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
    """Explore page view"""
    return render(request, 'core/explore.html')

def document_detail_page(request):
    """Document Detail page view"""
    return render(request, 'core/document_detail.html')

def test_page(request):
    """Test page view"""
    return render(request, 'core/test.html')