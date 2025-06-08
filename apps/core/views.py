from django.shortcuts import render
from django.db.models import Count
from apps.documents.models import (
    Document, Actor, Theme, BeneficiaryGroup, SDG
)
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
    template_name = 'core/explore.html'
    """Explore page view"""
    top_N = 7  # Number of top entries to display

    # 1) Document Type
    raw_doc_type_choices = Document.document_type.field.choices
    doc_type_counts_qs = (
        Document.objects
                .values('document_type')
                .annotate(count=Count('id'))
    )
    doc_type_counts = {entry['document_type']: entry['count'] for entry in doc_type_counts_qs}
    available_doc_types = [
        (slug, label, doc_type_counts.get(slug, 0))
        for slug, label in raw_doc_type_choices[0: top_N]
    ]

    # 2) Countries
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
        for entry in countries_qs[0: top_N]
    ]

    # 3) Actors: M2M → Actor with document count
    actors_qs = (
        Actor.objects
             .annotate(count=Count('documents'))
             .order_by('-count')
    )
    available_actors = [
        (actor.id, actor.label, actor.count)
        for actor in actors_qs[0: top_N]
    ]

    # 4) Themes: M2M → Theme with document count
    themes_qs = (
        Theme.objects
             .annotate(count=Count('documents'))
             .order_by('-count')
    )
    available_themes = [
        (theme.id, theme.label, theme.count)
        for theme in themes_qs[0: top_N]
    ]

    # 5) Beneficiary Groups: M2M → BeneficiaryGroup with document count
    beneficiaries_qs = (
        BeneficiaryGroup.objects
                        .annotate(count=Count('documents'))
                        .order_by('-count')
    )
    available_beneficiaries = [
        (b.id, b.label, b.count)
        for b in beneficiaries_qs[0: top_N]
    ]

    # 6) SDGs: M2M → SDG with document count
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
        'available_countries':     available_countries,
        'available_actors':        available_actors,
        'available_themes':        available_themes,
        'available_beneficiaries': available_beneficiaries,
        'available_sdgs':          available_sdgs,
    }
    return render(request, template_name, context)

def document_detail_page(request):
    """Document Detail page view"""
    return render(request, 'core/document_detail.html')

def test_page(request):
    """Test page view"""
    return render(request, 'core/test.html')