"""
Analysis Service
Business logic for analysis/statistics calculations
Extracted from apps.core.views.analysis_page()
"""
import math
import logging
from django.db.models import Count, Sum, Avg, Q, Value
from django.db.models.functions import Coalesce, ExtractYear
from apps.documents.models import (
    Document, Theme, Actor, SDG, Country, BeneficiaryGroup, Commitment,
    DocumentSDG, CommitmentDetail, QualitativeIndicator, DocumentQualitativeIndicator,
)
from apps.core.constants import (
    SDG_INFO, BINDING_INFO, THEME_INFO, ACTOR_INFO, BENEFICIARY_INFO,
    hyphen_to_camel
)

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for analysis/statistics calculations"""
    
    def get_summary_stats(self):
        """Get main summary statistics"""
        total_documents = Document.objects.count()
        total_agreements = Document.objects.filter(document_type__startswith="agreements").count()
        total_dialogues = Document.objects.filter(document_type__startswith="dialogues").count()
        active_themes = Theme.objects.filter(documents__isnull=False).distinct().count()
        total_actors = Actor.objects.filter(documents__isnull=False).distinct().count()
        total_beneficiaries = BeneficiaryGroup.objects.filter(documents__isnull=False).distinct().count()
        total_commitments = Commitment.objects.count()
        
        total_countries = Country.objects.filter(
            Q(document__isnull=False) |
            Q(lead_documents__isnull=False)
        ).distinct().count()
        
        return {
            'total_documents': total_documents,
            'active_countries': total_countries,
            'total_agreements': total_agreements,
            'total_dialogues': total_dialogues,
            'active_themes': active_themes,
            'total_actors': total_actors,
            'total_beneficiaries': total_beneficiaries,
            'total_commitments': total_commitments,
        }
    
    def get_lead_country_counts(self):
        """Get document counts by lead country"""
        return dict(
            Document.objects
            .filter(lead_country__isnull=False)
            .values('lead_country__iso3')
            .annotate(count=Count('id'))
            .values_list('lead_country__iso3', 'count')
        )
    
    def get_countries_data(self):
        """Get country counts and names"""
        countries_qs = (
            Country.objects
            .filter(
                Q(lead_documents__isnull=False) |
                Q(mentioned_in_documents__isnull=False) |
                Q(document__isnull=False)
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
        
        return {
            'countries': countries,
            'country_names': country_names,
        }
    
    def get_sdg_analysis(self):
        """Get SDG counts and relevance metrics"""
        sdgs_qs = (
            SDG.objects
            .annotate(count=Count('documents'))
            .order_by('number')
        )
        sdgs = {
            f'sdg{s.number}': s.count
            for s in sdgs_qs
        }
        
        sdg_avg_relevance = {}
        
        for sdg in SDG.objects.all():
            doc_sdg_qs = DocumentSDG.objects.filter(sdg=sdg)
            count_with_sdg = doc_sdg_qs.count()
            
            total_relevance = doc_sdg_qs.aggregate(
                total=Sum('relevance_score')
            )['total'] or 0
            
            if count_with_sdg > 0:
                avg_relevance = total_relevance / count_with_sdg
            else:
                avg_relevance = 0
            sdg_avg_relevance[f'sdg{sdg.number}'] = round(avg_relevance, 3)
        
        sdg_labels = {
            sdg_key: f"SDG {SDG_INFO.get(sdg_key, {}).get('number', sdg_key.replace('sdg', ''))}"
            for sdg_key in sdgs.keys()
        }
        
        return {
            'sdg_counts': sdgs,
            'sdg_avg_relevance': sdg_avg_relevance,
            'sdg_info': SDG_INFO,
            'sdg_labels': sdg_labels,
        }
    
    def get_legal_bindingness_data(self):
        """Get legal bindingness distribution"""
        raw_legal_bindingness_choices = Document._meta.get_field('legal_bindingness').choices
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
        
        return {
            'binding_counts': legal_bindingness,
            'binding_info': BINDING_INFO,
        }
    
    def get_coverage_scope_data(self):
        """Get coverage scope distribution"""
        raw_coverage_scope_choices = Document._meta.get_field('coverage_scope').choices
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
        
        return {
            'scope_counts': coverage_scope,
        }
    
    def get_theme_analysis(self):
        """Get theme distribution by category"""
        agreements_qs = Document.objects.filter(document_type__startswith="agreements")
        
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
        
        theme_counts = {
            slug: raw_cat_counts.get(slug, 0)
            for slug, label in Theme.CATEGORY_CHOICES
        }
        
        return {
            'theme_counts': theme_counts,
            'theme_info': THEME_INFO,
        }
    
    def get_theme_beneficiary_matrix(self):
        """Get theme × beneficiary group matrix"""
        agreements_qs = Document.objects.filter(document_type__startswith="agreements")
        
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
        
        THEME_CATS = [slug for slug, label in Theme.CATEGORY_CHOICES]
        BEN_CATS = [slug for slug, label in BeneficiaryGroup.CATEGORY_CHOICES]
        
        matrix = {t: {b: 0 for b in BEN_CATS} for t in THEME_CATS}
        
        for row in raw_matrix_qs:
            theme_slug = row['theme_cat'] or 'Uncategorised'
            ben_slug = row['ben_cat'] or 'Uncategorised'
            matrix[theme_slug][ben_slug] = row['count']
        
        return matrix
    
    def get_actor_analysis(self):
        """Get actor distribution by category"""
        agreements_qs = Document.objects.filter(document_type__startswith="agreements")
        
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
            slug: raw_actor_counts.get(slug, 0)
            for slug, label in Actor.CATEGORY_CHOICES
        }
        
        return {
            'actor_counts': actor_counts,
            'actor_info': ACTOR_INFO,
        }
    
    def get_actor_theme_matrix(self):
        """Get actor × theme co-occurrence matrix"""
        agreements_qs = Document.objects.filter(document_type__startswith="agreements")
        
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
        
        ACTOR_CATS = [slug for slug, label in Actor.CATEGORY_CHOICES]
        THEME_CATS = [slug for slug, label in Theme.CATEGORY_CHOICES]
        actor_theme_matrix = {a: {t: 0 for t in THEME_CATS} for a in ACTOR_CATS}
        
        for row in actor_theme_matrix_qs:
            actor_slug = row['actor_cat'] or 'Uncategorised'
            theme_slug = row['theme_cat'] or 'Uncategorised'
            actor_theme_matrix[actor_slug][theme_slug] = row['count']
        
        return actor_theme_matrix
    
    def get_beneficiary_analysis(self):
        """Get beneficiary group distribution by category"""
        agreements_qs = Document.objects.filter(document_type__startswith="agreements")
        
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
            slug: raw_ben_counts.get(slug, 0)
            for slug, label in BeneficiaryGroup.CATEGORY_CHOICES
        }
        
        return {
            'beneficiary_counts': beneficiary_counts,
            'beneficiary_info': BENEFICIARY_INFO,
        }
    
    def get_initiative_treemap_data(self):
        """Generate treemap data based on document types, themes, and coverage scope"""
        try:
            initiative_data = {
                "name": "Digital Cooperation Initiatives",
                "children": []
            }
            
            theme_categories = Theme.objects.filter(
                documents__isnull=False
            ).values('category').annotate(
                doc_count=Count('documents', distinct=True)
            ).order_by('-doc_count')
            
            for theme_cat in theme_categories:
                category_name = theme_cat['category'] or 'Other'
                doc_count = theme_cat['doc_count']
                
                if doc_count > 0:
                    themes_in_category = Theme.objects.filter(
                        category=theme_cat['category'],
                        documents__isnull=False
                    ).values('label').annotate(
                        count=Count('documents', distinct=True)
                    ).order_by('-count')[:4]
                    
                    children = []
                    for theme in themes_in_category:
                        theme_name = theme['label'][:25] + ("..." if len(theme['label']) > 25 else "")
                        children.append({
                            "name": theme_name,
                            "value": theme['count'],
                            "count": theme['count']
                        })
                    
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
    
    def get_diversity_radar_data(self):
        """Generate diversity metrics based on actual database content"""
        try:
            def calculate_shannon_index(data_dict):
                values = list(data_dict.values())
                total = sum(values)
                if total == 0:
                    return 0
                return -sum((v/total) * math.log(v/total) for v in values if v > 0)
            
            def calculate_diversity_score(data_dict, max_expected=20):
                if not data_dict:
                    return 0
                
                shannon_index = calculate_shannon_index(data_dict)
                category_count = len([v for v in data_dict.values() if v > 0])
                
                if category_count == 0:
                    return 0
                
                max_shannon = math.log(category_count) if category_count > 1 else 1
                normalized_shannon = shannon_index / max_shannon if max_shannon > 0 else 0
                
                category_factor = min(category_count / max_expected, 1)
                diversity_score = (normalized_shannon * 0.7 + category_factor * 0.3) * 100
                
                return min(100, max(0, math.floor(diversity_score)))
            
            # Thematic Diversity
            theme_categories = {}
            for theme in Theme.objects.annotate(doc_count=Count('documents')):
                if theme.doc_count > 0:
                    category = theme.category or 'Uncategorised'
                    theme_categories[category] = theme_categories.get(category, 0) + theme.doc_count
            
            thematic_diversity = {
                'value': calculate_diversity_score(theme_categories, 6),
                'description': 'Distribution across digital transformation themes',
                'categories': len(theme_categories),
                'shannonIndex': round(calculate_shannon_index(theme_categories), 2)
            }
            
            # Actor Diversity
            actor_categories = {}
            for actor in Actor.objects.annotate(doc_count=Count('documents')):
                if actor.doc_count > 0:
                    category = actor.category or 'Uncategorised'
                    actor_categories[category] = actor_categories.get(category, 0) + actor.doc_count
            
            actor_diversity = {
                'value': calculate_diversity_score(actor_categories, 5),
                'description': 'Variety of participating stakeholders',
                'categories': len(actor_categories),
                'shannonIndex': round(calculate_shannon_index(actor_categories), 2)
            }
            
            # Geographic Spread
            country_involvement = {}
            for country in Country.objects.annotate(
                total_docs=Count('document', distinct=True) +
                          Count('lead_documents', distinct=True) +
                          Count('mentioned_in_documents', distinct=True)
            ):
                if country.total_docs > 0:
                    country_involvement[country.iso3] = country.total_docs
            
            geographic_diversity = {
                'value': calculate_diversity_score(country_involvement, 30),
                'description': 'Regional and country coverage',
                'categories': len(country_involvement),
                'shannonIndex': round(calculate_shannon_index(country_involvement), 2)
            }
            
            # Sector Coverage
            sector_diversity = {
                'value': calculate_diversity_score(actor_categories, 5),
                'description': 'Economic sector representation',
                'categories': len(actor_categories),
                'shannonIndex': round(calculate_shannon_index(actor_categories), 2)
            }
            
            # Initiative Types
            initiative_types = {}
            for doc in Document.objects.values('document_type').annotate(count=Count('id')):
                if doc['document_type'] and doc['count'] > 0:
                    initiative_types[doc['document_type']] = doc['count']
            
            for doc in Document.objects.values('coverage_scope').annotate(count=Count('id')):
                if doc['coverage_scope'] and doc['count'] > 0:
                    scope_key = f"scope_{doc['coverage_scope']}"
                    initiative_types[scope_key] = doc['count']
            
            initiative_diversity = {
                'value': calculate_diversity_score(initiative_types, 10),
                'description': 'Variety of cooperation formats',
                'categories': len(initiative_types),
                'shannonIndex': round(calculate_shannon_index(initiative_types), 2)
            }
            
            # Beneficiary Inclusion
            beneficiary_categories = {}
            for ben in BeneficiaryGroup.objects.annotate(doc_count=Count('documents')):
                if ben.doc_count > 0:
                    category = ben.category or 'Uncategorised'
                    beneficiary_categories[category] = beneficiary_categories.get(category, 0) + ben.doc_count
            
            beneficiary_diversity = {
                'value': calculate_diversity_score(beneficiary_categories, 17),
                'description': 'Diversity of target groups',
                'categories': len(beneficiary_categories),
                'shannonIndex': round(calculate_shannon_index(beneficiary_categories), 2)
            }
            
            # Funding Sources
            funding_sources = {}
            funding_sources.update(actor_categories)
            
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
            
            # Temporal Distribution
            temporal_distribution = {}
            for doc in Document.objects.filter(event_date__isnull=False):
                if doc.event_date:
                    year = doc.event_date.year
                    if year < 2020:
                        period = "Before 2020"
                    elif year < 2022:
                        period = "2020-2021"
                    elif year < 2024:
                        period = "2022-2023"
                    else:
                        period = "2024-2025"
                    
                    temporal_distribution[period] = temporal_distribution.get(period, 0) + 1
            
            if not temporal_distribution:
                for doc in Document.objects.all()[:100]:
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
    
    def get_timeline_data(self):
        """Generate temporal evolution data for documents by year in Chart.js format"""
        try:
            timeline_qs = (
                Document.objects
                .filter(event_date__isnull=False)
                .annotate(year=ExtractYear('event_date'))
                .values('year')
                .annotate(
                    total=Count('id'),
                    agreements=Count('id', filter=Q(document_type__startswith='agreements')),
                    dialogues=Count('id', filter=Q(document_type__startswith='dialogues'))
                )
                .order_by('year')
            )
            
            # Convert to Chart.js format: {labels: [], datasets: [{label: '', data: []}]}
            years = []
            total_data = []
            agreements_data = []
            dialogues_data = []
            
            for entry in timeline_qs:
                year = str(entry['year'])
                years.append(year)
                total_data.append(entry['total'])
                agreements_data.append(entry['agreements'])
                dialogues_data.append(entry['dialogues'])
            
            return {
                'labels': years,
                'datasets': [
                    {
                        'label': 'Total',
                        'data': total_data
                    },
                    {
                        'label': 'Agreements',
                        'data': agreements_data
                    },
                    {
                        'label': 'Dialogues',
                        'data': dialogues_data
                    }
                ]
            }
            
        except Exception as e:
            logger.error(f"Error generating timeline data: {e}")
            return {
                'labels': ['2020'],
                'datasets': [
                    {'label': 'Total', 'data': [0]},
                    {'label': 'Agreements', 'data': [0]},
                    {'label': 'Dialogues', 'data': [0]}
                ]
            }

    def get_qualitative_analysis(self):
        """
        Aggregate qualitative indicator scores across all documents.

        Returns coverage stats, per-indicator averages, and per-level averages
        for use in the Analysis Dashboard.
        """
        try:
            total_docs = Document.objects.count()
            active_count = QualitativeIndicator.objects.filter(is_active=True).count()

            # A document is "fully scored" when every active indicator has a non-null score
            if active_count > 0:
                scored_docs = (
                    Document.objects
                    .annotate(
                        scored=Count(
                            'qualitative_indicators',
                            filter=Q(qualitative_indicators__score__isnull=False),
                        )
                    )
                    .filter(scored=active_count)
                    .count()
                )
            else:
                scored_docs = 0

            coverage_rate = round(scored_docs / total_docs * 100, 1) if total_docs else 0

            # Per-indicator averages (ordered by level then label for consistent chart order)
            by_indicator = []
            for ind in QualitativeIndicator.objects.filter(is_active=True).order_by('level', 'label'):
                agg = DocumentQualitativeIndicator.objects.filter(
                    indicator=ind,
                    score__isnull=False,
                ).aggregate(avg=Avg('score'), cnt=Count('id'))
                by_indicator.append({
                    'code':          ind.code,
                    'label':         ind.label,
                    'level':         ind.level,
                    'dimension':     ind.dimension,
                    'avg_score':     round(agg['avg'] or 0, 3),
                    'scored_count':  agg['cnt'] or 0,
                })

            # Per-level averages
            by_level = {}
            for level in ('micro', 'meso', 'macro'):
                agg = DocumentQualitativeIndicator.objects.filter(
                    indicator__level=level,
                    indicator__is_active=True,
                    score__isnull=False,
                ).aggregate(avg=Avg('score'))
                by_level[level] = {
                    'avg_score': round(agg['avg'] or 0, 3),
                    'label':     level.capitalize(),
                }

            return {
                'coverage': {
                    'total_documents': total_docs,
                    'scored_documents': scored_docs,
                    'coverage_rate':   coverage_rate,
                },
                'by_indicator': by_indicator,
                'by_level':     by_level,
            }

        except Exception as e:
            logger.error(f"Error generating qualitative analysis: {e}")
            return {
                'coverage': {
                    'total_documents': 0,
                    'scored_documents': 0,
                    'coverage_rate': 0,
                },
                'by_indicator': [],
                'by_level': {
                    'micro': {'avg_score': 0, 'label': 'Micro'},
                    'meso':  {'avg_score': 0, 'label': 'Meso'},
                    'macro': {'avg_score': 0, 'label': 'Macro'},
                },
            }