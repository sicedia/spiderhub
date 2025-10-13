from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.db.models import Count, Q
from apps.documents.models import (
    Document, Actor, Theme, BeneficiaryGroup, SDG, CommitmentDetail, Country, Commitment
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
    
    # Enhanced summary statistics
    total_documents = Document.objects.count()
    
    # Count agreements vs dialogues
    total_agreements = Document.objects.filter(document_type__startswith="agreements").count()
    total_dialogues = Document.objects.filter(document_type__startswith="dialogues").count()
    
    # Count active themes (themes that have at least one document)
    active_themes = Theme.objects.filter(documents__isnull=False).distinct().count()
    
    # Count active actors (actors that have at least one document)
    total_actors = Actor.objects.filter(documents__isnull=False).distinct().count()
    
    # Count active beneficiary groups
    total_beneficiaries = BeneficiaryGroup.objects.filter(documents__isnull=False).distinct().count()
    
    # Count total commitments
    total_commitments = Commitment.objects.count()

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
    
    active_countries = len(countries)
    
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
    
    # SDG descriptive information for enhanced tooltips
    SDG_INFO = {
        'sdg1': {'number': 1, 'name': 'No Poverty', 'description': 'End poverty in all its forms everywhere'},
        'sdg2': {'number': 2, 'name': 'Zero Hunger', 'description': 'End hunger, achieve food security and improved nutrition'},
        'sdg3': {'number': 3, 'name': 'Good Health', 'description': 'Ensure healthy lives and promote well-being for all'},
        'sdg4': {'number': 4, 'name': 'Quality Education', 'description': 'Ensure inclusive and equitable quality education'},
        'sdg5': {'number': 5, 'name': 'Gender Equality', 'description': 'Achieve gender equality and empower all women and girls'},
        'sdg6': {'number': 6, 'name': 'Clean Water', 'description': 'Ensure availability and sustainable management of water'},
        'sdg7': {'number': 7, 'name': 'Affordable Energy', 'description': 'Ensure access to affordable, reliable, sustainable energy'},
        'sdg8': {'number': 8, 'name': 'Decent Work', 'description': 'Promote sustained, inclusive economic growth and decent work'},
        'sdg9': {'number': 9, 'name': 'Innovation', 'description': 'Build resilient infrastructure, promote innovation'},
        'sdg10': {'number': 10, 'name': 'Reduced Inequalities', 'description': 'Reduce inequality within and among countries'},
        'sdg11': {'number': 11, 'name': 'Sustainable Cities', 'description': 'Make cities and settlements inclusive, safe, resilient'},
        'sdg12': {'number': 12, 'name': 'Responsible Consumption', 'description': 'Ensure sustainable consumption and production patterns'},
        'sdg13': {'number': 13, 'name': 'Climate Action', 'description': 'Take urgent action to combat climate change'},
        'sdg14': {'number': 14, 'name': 'Life Below Water', 'description': 'Conserve and sustainably use oceans and marine resources'},
        'sdg15': {'number': 15, 'name': 'Life on Land', 'description': 'Protect, restore and promote sustainable use of ecosystems'},
        'sdg16': {'number': 16, 'name': 'Peace & Justice', 'description': 'Promote peaceful and inclusive societies for sustainable development'},
        'sdg17': {'number': 17, 'name': 'Partnerships', 'description': 'Strengthen global partnership for sustainable development'},
    }
    
    # Enrich SDG data with labels (format: "SDG 1", "SDG 2", etc.)
    sdg_labels = {
        sdg_key: f"SDG {SDG_INFO.get(sdg_key, {}).get('number', sdg_key.replace('sdg', ''))}"
        for sdg_key in sdgs.keys()
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
    
    # Legal bindingness descriptive information for enhanced tooltips
    BINDING_INFO = {
        'legallyBinding': {
            'name': 'Legally Binding',
            'description': 'Agreements with enforceable legal obligations under international law',
            'icon': '⚖️',
            'strength': 'Strong'
        },
        'politicallyBinding': {
            'name': 'Politically Binding',
            'description': 'Commitments based on political will without legal enforcement mechanisms',
            'icon': '🤝',
            'strength': 'Medium'
        },
        'nonBinding': {
            'name': 'Non-Binding',
            'description': 'Voluntary cooperation frameworks without formal obligations',
            'icon': '📋',
            'strength': 'Soft'
        },
        'uncategorised': {
            'name': 'Uncategorised',
            'description': 'Documents without specified binding level',
            'icon': '❓',
            'strength': 'Undefined'
        }
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
    
    # Theme descriptive information for enhanced tooltips
    THEME_INFO = {
        "Digital Transformation & Strategy": {
            "description": "Strategic frameworks and policies for digital transformation initiatives",
            "icon": "🚀",
            "focus": "Strategy & Planning"
        },
        "Technology & Innovation": {
            "description": "Emerging technologies, R&D, and innovation ecosystems",
            "icon": "💡",
            "focus": "Tech Development"
        },
        "Data & Governance": {
            "description": "Data management, privacy, security, and digital governance frameworks",
            "icon": "🔒",
            "focus": "Governance & Security"
        },
        "Inclusion & Social Development": {
            "description": "Digital inclusion, accessibility, and social impact initiatives",
            "icon": "🤝",
            "focus": "Social Impact"
        },
        "Regional & International Cooperation": {
            "description": "Cross-border collaboration and international digital partnerships",
            "icon": "🌍",
            "focus": "Global Cooperation"
        },
        "Uncategorised": {
            "description": "Themes without specified category",
            "icon": "📋",
            "focus": "Other"
        }
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
    
    # Actor descriptive information for enhanced tooltips
    ACTOR_INFO = {
        "Political Actors": {
            "description": "Governments, ministries, public institutions, and policy-making bodies",
            "icon": "🏛️",
            "role": "Policy & Governance"
        },
        "Research and Innovation Actors": {
            "description": "Universities, research centers, R&D institutions, and innovation hubs",
            "icon": "🔬",
            "role": "Knowledge & Development"
        },
        "Economic Actors": {
            "description": "Private companies, business associations, SMEs, and economic organizations",
            "icon": "💼",
            "role": "Business & Economy"
        },
        "Civil Society Actors": {
            "description": "NGOs, foundations, community organizations, and advocacy groups",
            "icon": "🤝",
            "role": "Social & Community"
        },
        "Uncategorised": {
            "description": "Actors without specified category",
            "icon": "📋",
            "role": "Other"
        }
    }
    
    # Actor × Theme co-occurrence matrix for network graph
    actor_theme_matrix_qs = (
        Document.objects
                .filter(pk__in=agreements_qs)
                .values(
                    actor_cat=Coalesce('actors__category', Value('Uncategorised')),
                    theme_cat=Coalesce('themes__category', Value('Uncategorised'))
                )
                .distinct()               
                .annotate(count=Count('id'))
    )
    
    # Build actor-theme matrix
    ACTOR_CATS = [label for slug, label in Actor.CATEGORY_CHOICES]
    actor_theme_matrix = {a: {t: 0 for t in THEME_CATS} for a in ACTOR_CATS}
    
    for row in actor_theme_matrix_qs:
        actor_label = dict(Actor.CATEGORY_CHOICES).get(row['actor_cat'], 'Uncategorised')
        theme_label = dict(Theme.CATEGORY_CHOICES).get(row['theme_cat'], 'Uncategorised')
        actor_theme_matrix[actor_label][theme_label] = row['count']
    
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
    
    # Beneficiary descriptive information for enhanced tooltips
    BENEFICIARY_INFO = {
        "SMEs / Businesses": {
            "description": "Small and medium enterprises driving digital transformation",
            "icon": "🏪",
            "category": "Economic"
        },
        "Start-ups / Innovators": {
            "description": "Innovative startups and entrepreneurial ventures",
            "icon": "🚀",
            "category": "Economic"
        },
        "Large Corporations": {
            "description": "Major companies and multinational enterprises",
            "icon": "🏢",
            "category": "Economic"
        },
        "Researchers & Academia": {
            "description": "University researchers, scientists, and academic institutions",
            "icon": "🎓",
            "category": "Knowledge"
        },
        "Students & Youth": {
            "description": "Young people and students benefiting from digital education",
            "icon": "👨‍🎓",
            "category": "Education"
        },
        "Migrants & Refugees": {
            "description": "Displaced populations accessing digital services",
            "icon": "🌍",
            "category": "Vulnerable"
        },
        "Women & Girls": {
            "description": "Female population empowered through digital inclusion",
            "icon": "👩",
            "category": "Inclusion"
        },
        "Rural & Remote Communities": {
            "description": "Communities in rural and remote areas gaining digital access",
            "icon": "🏘️",
            "category": "Geographic"
        },
        "Indigenous Peoples & Ethnic Groups": {
            "description": "Indigenous communities preserving culture through digital tools",
            "icon": "🪶",
            "category": "Cultural"
        },
        "Persons with Disabilities": {
            "description": "People with disabilities accessing assistive technologies",
            "icon": "♿",
            "category": "Accessibility"
        },
        "General Citizens / Consumers": {
            "description": "General public benefiting from digital services",
            "icon": "👥",
            "category": "General"
        },
        "Public Sector / Governments": {
            "description": "Government entities improving digital public services",
            "icon": "🏛️",
            "category": "Public"
        },
        "Civil Society / NGOs": {
            "description": "Non-governmental organizations leveraging digital tools",
            "icon": "🤝",
            "category": "Social"
        },
        "Farmers & Primary Producers": {
            "description": "Agricultural workers using digital technologies",
            "icon": "🌾",
            "category": "Agriculture"
        },
        "Health Sector": {
            "description": "Healthcare providers and patients using digital health",
            "icon": "🏥",
            "category": "Health"
        },
        "Investors & Financial Actors": {
            "description": "Financial institutions and investors in digital economy",
            "icon": "💰",
            "category": "Finance"
        },
        "Uncategorised": {
            "description": "Beneficiaries without specified category",
            "icon": "📋",
            "category": "Other"
        }
    }
    
    # 7) Initiative Treemap Data - Real data from documents
    def get_initiative_treemap_data():
        """Generate treemap data based on document types, themes, and coverage scope"""
        try:
            # Build hierarchical structure
            initiative_data = {
                "name": "Digital Cooperation Initiatives",
                "children": []
            }
            
            # Get main categories based on themes
            theme_categories = Theme.objects.filter(
                documents__isnull=False
            ).values('category').annotate(
                doc_count=Count('documents', distinct=True)
            ).order_by('-doc_count')
            
            for theme_cat in theme_categories:
                category_name = theme_cat['category'] or 'Other'
                doc_count = theme_cat['doc_count']
                
                if doc_count > 0:
                    # Get specific themes in this category
                    themes_in_category = Theme.objects.filter(
                        category=theme_cat['category'],
                        documents__isnull=False
                    ).values('label').annotate(
                        count=Count('documents', distinct=True)
                    ).order_by('-count')[:4]  # Top 4 themes per category
                    
                    children = []
                    for theme in themes_in_category:
                        theme_name = theme['label'][:25] + ("..." if len(theme['label']) > 25 else "")
                        children.append({
                            "name": theme_name,
                            "value": theme['count'],
                            "count": theme['count']
                        })
                    
                    # If no specific themes found, create a default entry
                    if not children:
                        children.append({
                            "name": f"{category_name} Documents",
                            "value": doc_count,
                            "count": doc_count
                        })
                    
                    initiative_data["children"].append({
                        "name": category_name,
                        "children": children
                    })
            
            # If no theme categories found, fall back to coverage scope
            if not initiative_data["children"]:
                coverage_scopes = Document.objects.values('coverage_scope').annotate(
                    count=Count('id')
                ).exclude(coverage_scope__isnull=True).exclude(coverage_scope='').order_by('-count')
                
                for scope in coverage_scopes:
                    scope_name = scope['coverage_scope'].replace('_', ' ').title()
                    doc_count = scope['count']
                    
                    initiative_data["children"].append({
                        "name": scope_name,
                        "children": [{
                            "name": f"{scope_name} Documents",
                            "value": doc_count,
                            "count": doc_count
                        }]
                    })
            
            # If still no data, create a minimal structure
            if not initiative_data["children"]:
                total_docs = Document.objects.count()
                if total_docs > 0:
                    initiative_data["children"].append({
                        "name": "All Documents", 
                        "children": [{
                            "name": "Digital Cooperation",
                            "value": total_docs,
                            "count": total_docs
                        }]
                    })
            
            return initiative_data
            
        except Exception as e:
            logger.error(f"Error generating treemap data: {e}")
            # Return minimal fallback structure
            return {
                "name": "Digital Cooperation Initiatives",
                "children": [{
                    "name": "Documents",
                    "children": [{
                        "name": "No data available",
                        "value": 1,
                        "count": 0
                    }]
                }]
            }
    
    initiative_treemap_data = get_initiative_treemap_data()
    
    # 8) Diversity Radar Data - Real data from documents
    def get_diversity_radar_data():
        """Generate diversity metrics based on actual database content"""
        import math
        from collections import Counter
        
        try:
            # Helper function to calculate Shannon diversity index
            def calculate_shannon_index(data_dict):
                values = list(data_dict.values())
                total = sum(values)
                if total == 0:
                    return 0
                return -sum((v/total) * math.log(v/total) for v in values if v > 0)
            
            # Helper function to calculate diversity score (0-100)
            def calculate_diversity_score(data_dict, max_expected=20):
                if not data_dict:
                    return 0
                    
                shannon_index = calculate_shannon_index(data_dict)
                category_count = len([v for v in data_dict.values() if v > 0])
                
                if category_count == 0:
                    return 0
                
                # Normalize Shannon index (max theoretical value for even distribution)
                max_shannon = math.log(category_count) if category_count > 1 else 1
                normalized_shannon = shannon_index / max_shannon if max_shannon > 0 else 0
                
                # Combine Shannon index (70%) and category count factor (30%)
                category_factor = min(category_count / max_expected, 1)
                diversity_score = (normalized_shannon * 0.7 + category_factor * 0.3) * 100
                
                return min(100, max(0, math.floor(diversity_score)))
            
            # 1. Thematic Diversity - based on Theme categories and labels
            theme_categories = {}
            theme_labels = {}
            
            for theme in Theme.objects.annotate(doc_count=Count('documents')):
                if theme.doc_count > 0:
                    category = theme.category or 'Uncategorised'
                    theme_categories[category] = theme_categories.get(category, 0) + theme.doc_count
                    theme_labels[theme.label] = theme.doc_count
            
            thematic_diversity = {
                'value': calculate_diversity_score(theme_categories, 6),  # 6 theme categories
                'description': 'Distribution across digital transformation themes',
                'categories': len(theme_categories),
                'shannonIndex': round(calculate_shannon_index(theme_categories), 2)
            }
            
            # 2. Actor Diversity - based on Actor categories
            actor_categories = {}
            for actor in Actor.objects.annotate(doc_count=Count('documents')):
                if actor.doc_count > 0:
                    category = actor.category or 'Uncategorised'
                    actor_categories[category] = actor_categories.get(category, 0) + actor.doc_count
            
            actor_diversity = {
                'value': calculate_diversity_score(actor_categories, 5),  # 5 actor categories
                'description': 'Variety of participating stakeholders',
                'categories': len(actor_categories),
                'shannonIndex': round(calculate_shannon_index(actor_categories), 2)
            }
            
            # 3. Geographic Spread - based on Countries
            country_involvement = {}
            # Count countries from all relationships
            for country in Country.objects.annotate(
                total_docs=Count('document', distinct=True) + 
                          Count('lead_documents', distinct=True) +
                          Count('mentioned_in_documents', distinct=True)
            ):
                if country.total_docs > 0:
                    country_involvement[country.iso3] = country.total_docs
            
            geographic_diversity = {
                'value': calculate_diversity_score(country_involvement, 30),  # Up to 30 countries
                'description': 'Regional and country coverage',
                'categories': len(country_involvement),
                'shannonIndex': round(calculate_shannon_index(country_involvement), 2)
            }
            
            # 4. Sector Coverage - based on Actor categories (proxy for sectors)
            sector_diversity = {
                'value': calculate_diversity_score(actor_categories, 5),
                'description': 'Economic sector representation',
                'categories': len(actor_categories),
                'shannonIndex': round(calculate_shannon_index(actor_categories), 2)
            }
            
            # 5. Initiative Types - based on document types and coverage scope
            initiative_types = {}
            
            # Count by document type
            for doc in Document.objects.values('document_type').annotate(count=Count('id')):
                if doc['document_type'] and doc['count'] > 0:
                    initiative_types[doc['document_type']] = doc['count']
            
            # Count by coverage scope
            for doc in Document.objects.values('coverage_scope').annotate(count=Count('id')):
                if doc['coverage_scope'] and doc['count'] > 0:
                    scope_key = f"scope_{doc['coverage_scope']}"
                    initiative_types[scope_key] = doc['count']
            
            initiative_diversity = {
                'value': calculate_diversity_score(initiative_types, 10),  # Various initiative types
                'description': 'Variety of cooperation formats',
                'categories': len(initiative_types),
                'shannonIndex': round(calculate_shannon_index(initiative_types), 2)
            }
            
            # 6. Beneficiary Inclusion - based on BeneficiaryGroup categories
            beneficiary_categories = {}
            for ben in BeneficiaryGroup.objects.annotate(doc_count=Count('documents')):
                if ben.doc_count > 0:
                    category = ben.category or 'Uncategorised'
                    beneficiary_categories[category] = beneficiary_categories.get(category, 0) + ben.doc_count
            
            beneficiary_diversity = {
                'value': calculate_diversity_score(beneficiary_categories, 17),  # 17 beneficiary categories
                'description': 'Diversity of target groups',
                'categories': len(beneficiary_categories),
                'shannonIndex': round(calculate_shannon_index(beneficiary_categories), 2)
            }
            
            # 7. Funding Sources - combination of actor categories and coverage scope
            funding_sources = {}
            funding_sources.update(actor_categories)  # Actors represent funding sources
            
            # Add coverage scope as funding mechanism indicator
            for doc in Document.objects.values('coverage_scope').annotate(count=Count('id')):
                if doc['coverage_scope'] and doc['count'] > 0:
                    funding_key = f"funding_{doc['coverage_scope']}"
                    funding_sources[funding_key] = doc['count']
            
            funding_diversity = {
                'value': calculate_diversity_score(funding_sources, 10),
                'description': 'Financial mechanism diversity',
                'categories': len(funding_sources),
                'shannonIndex': round(calculate_shannon_index(funding_sources), 2)
            }
            
            # 8. Temporal Distribution - based on event dates
            temporal_distribution = {}
            current_year = 2025
            
            for doc in Document.objects.filter(event_date__isnull=False):
                if doc.event_date:
                    year = doc.event_date.year
                    # Group into periods
                    if year < 2020:
                        period = "Before 2020"
                    elif year < 2022:
                        period = "2020-2021"
                    elif year < 2024:
                        period = "2022-2023"
                    else:
                        period = "2024-2025"
                    
                    temporal_distribution[period] = temporal_distribution.get(period, 0) + 1
            
            # If no temporal data, use document creation dates as fallback
            if not temporal_distribution:
                for doc in Document.objects.all()[:100]:  # Limit for performance
                    year = doc.created_at.year
                    period = f"{year}"
                    temporal_distribution[period] = temporal_distribution.get(period, 0) + 1
            
            temporal_diversity = {
                'value': calculate_diversity_score(temporal_distribution, 5) if temporal_distribution else 50,
                'description': 'Timeline and duration variety',
                'categories': len(temporal_distribution) if temporal_distribution else 3,
                'shannonIndex': round(calculate_shannon_index(temporal_distribution), 2) if temporal_distribution else 1.0
            }
            
            return {
                'dimensions': {
                    'Thematic Diversity': thematic_diversity,
                    'Actor Diversity': actor_diversity,
                    'Geographic Spread': geographic_diversity,
                    'Sector Coverage': sector_diversity,
                    'Initiative Types': initiative_diversity,
                    'Beneficiary Inclusion': beneficiary_diversity,
                    'Funding Sources': funding_diversity,
                    'Temporal Distribution': temporal_diversity
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating diversity data: {e}")
            # Return minimal fallback structure
            return {
                'dimensions': {
                    'Thematic Diversity': {'value': 0, 'description': 'No data available', 'categories': 0, 'shannonIndex': 0},
                    'Actor Diversity': {'value': 0, 'description': 'No data available', 'categories': 0, 'shannonIndex': 0},
                    'Geographic Spread': {'value': 0, 'description': 'No data available', 'categories': 0, 'shannonIndex': 0},
                    'Sector Coverage': {'value': 0, 'description': 'No data available', 'categories': 0, 'shannonIndex': 0},
                    'Initiative Types': {'value': 0, 'description': 'No data available', 'categories': 0, 'shannonIndex': 0},
                    'Beneficiary Inclusion': {'value': 0, 'description': 'No data available', 'categories': 0, 'shannonIndex': 0},
                    'Funding Sources': {'value': 0, 'description': 'No data available', 'categories': 0, 'shannonIndex': 0},
                    'Temporal Distribution': {'value': 0, 'description': 'No data available', 'categories': 0, 'shannonIndex': 0}
                }
            }
    
    diversity_radar_data = get_diversity_radar_data()
    
    # Simple debug output to verify data
    if not any(treemapData.get('children', []) for treemapData in [initiative_treemap_data]):
        # Add some mock data if no real data exists
        initiative_treemap_data = {
            "name": "Digital Cooperation Initiatives",
            "children": [
                {
                    "name": "Strategic Frameworks",
                    "children": [
                        {"name": "Digital Strategies", "value": 5, "count": 5},
                        {"name": "Policy Documents", "value": 3, "count": 3}
                    ]
                },
                {
                    "name": "Cooperation Agreements", 
                    "children": [
                        {"name": "Bilateral MOUs", "value": 4, "count": 4},
                        {"name": "Multilateral Programs", "value": 6, "count": 6}
                    ]
                },
                {
                    "name": "Innovation Initiatives",
                    "children": [
                        {"name": "Technology Transfer", "value": 2, "count": 2},
                        {"name": "Research Collaboration", "value": 3, "count": 3}
                    ]
                }
            ]
        }
    
    total_countries = Country.objects.filter(
        Q(document__isnull=False) |  # event_country relationship (default related_name)
        Q(lead_documents__isnull=False)   # lead_country relationship
    ).distinct().count()
    
    context = {
        "summary": {
            'total_documents': total_documents,
            'active_countries': total_countries,
            'total_agreements': total_agreements,
            'total_dialogues': total_dialogues,
            'active_themes': active_themes,
            'total_actors': total_actors,
            'total_beneficiaries': total_beneficiaries,
            'total_commitments': total_commitments,
        },
        "analysis_data": {
            "sdg_counts":     sdgs,
            "sdg_info": SDG_INFO,
            "sdg_labels": sdg_labels,
            "binding_counts": legal_bindingness,
            "binding_info": BINDING_INFO,
            "country_counts": countries,
            "lead_country_counts": lead_country_counts,
            "country_names": country_names,
            
            "scope_counts":   coverage_scope,
            "theme_counts":   theme_counts,
            "theme_info": THEME_INFO,  
            "theme_ben_matrix": matrix,
            "actor_counts":  actor_counts,
            "actor_info": ACTOR_INFO,
            "actor_theme_matrix": actor_theme_matrix,  
            "beneficiary_counts": beneficiary_counts,
            "beneficiary_info": BENEFICIARY_INFO,
            "initiative_treemap_data": initiative_treemap_data,
            "diversity_radar_data": diversity_radar_data,
        },
    }

    return render(request, template_name, context)

def api_countries(request):
    """API endpoint to get all countries from database"""
    countries = Country.objects.all().values('iso3', 'iso2', 'name')
    return JsonResponse({
        'countries': list(countries)
    })

def api_lead_countries(request):
    """API endpoint to get document counts by lead country for choropleth map"""
    from django.db.models import Count
    
    # Get lead country counts
    lead_country_counts = (
        Document.objects
        .filter(lead_country__isnull=False)  # Only documents with lead countries
        .values('lead_country__iso3', 'lead_country__name')
        .annotate(document_count=Count('id'))
        .order_by('-document_count')
    )
    
    # Convert to the format expected by the choropleth chart: {ISO3: count}
    counts_data = {}
    countries_info = []
    
    for item in lead_country_counts:
        iso3 = item['lead_country__iso3']
        count = item['document_count']
        name = item['lead_country__name']
        
        counts_data[iso3] = count
        countries_info.append({
            'iso3': iso3,
            'name': name,
            'count': count
        })
    
    return JsonResponse({
        'counts': counts_data,  # For the choropleth chart
        'countries': countries_info,  # For additional details
        'total_documents': sum(counts_data.values()),
        'total_lead_countries': len(counts_data)
    })
