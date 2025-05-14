from django.shortcuts import render
from apps.documents.models import Document, Location
# Create your views here.

def home_page(request):
    template_name = 'core/home.html'
    """Home page view"""
    # Fetch the latest 8 documents from the database
    recent_documents = Document.objects.all().order_by('-created_at')[:8]
    document_count = Document.objects.count()
    country_count = Location.objects.count()

    context = {
        'recent_documents': recent_documents,
        'document_count': document_count,
        'country_count': country_count,
    }

    return render(request, template_name, context)

def about_page(request):
    """About page view"""
    return render(request, 'core/about.html')

def test_page(request):
    """Test page view"""
    return render(request, 'core/test.html')