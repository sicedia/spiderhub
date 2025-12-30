"""
API v1 URL Configuration
"""
from django.urls import path, include
from .views import (
    AnalysisSummaryAPIView,
    SDGAnalysisAPIView,
    ThemeAnalysisAPIView,
    ActorAnalysisAPIView,
    BeneficiaryAnalysisAPIView,
    TimelineAPIView,
    DiversityRadarAPIView,
    NetworkGraphAPIView,
    OverviewSummaryAPIView,
    OverviewTrendsAPIView,
    OverviewMapAPIView,
    OverviewMixAPIView,
    OverviewTopAPIView,
    CountryListAPIView,
    LeadCountriesAPIView,
    CountriesByRoleAPIView,
    ExploreFiltersAPIView,
    HomeStatsAPIView,
    RecentDocumentsAPIView,
    AppVersionAPIView,
)
from .views.documents import DocumentDetailAPIView, RelatedDocumentsAPIView
from .views.events import (
    PublicEventsListAPIView,
    PublicEventDetailAPIView,
    UpcomingEventsAPIView,
    DocumentEventsAPIView,
    EventSuggestAPIView,
)

app_name = 'api-v1'

urlpatterns = [
    # Home
    path('home/stats/', HomeStatsAPIView.as_view(), name='home-stats'),
    path('home/recent-documents/', RecentDocumentsAPIView.as_view(), name='home-recent-documents'),
    
    # Analysis
    path('analysis/summary/', AnalysisSummaryAPIView.as_view(), name='analysis-summary'),
    path('analysis/sdgs/', SDGAnalysisAPIView.as_view(), name='analysis-sdgs'),
    path('analysis/themes/', ThemeAnalysisAPIView.as_view(), name='analysis-themes'),
    path('analysis/actors/', ActorAnalysisAPIView.as_view(), name='analysis-actors'),
    path('analysis/beneficiaries/', BeneficiaryAnalysisAPIView.as_view(), name='analysis-beneficiaries'),
    path('analysis/timeline/', TimelineAPIView.as_view(), name='analysis-timeline'),
    path('analysis/diversity/', DiversityRadarAPIView.as_view(), name='analysis-diversity'),
    path('analysis/network/', NetworkGraphAPIView.as_view(), name='analysis-network'),
    
    # Countries
    path('countries/', CountryListAPIView.as_view(), name='countries-list'),
    path('countries/lead/', LeadCountriesAPIView.as_view(), name='countries-lead'),
    path('countries/by-role/', CountriesByRoleAPIView.as_view(), name='countries-by-role'),
    
    # Explore
    path('explore/filters/', ExploreFiltersAPIView.as_view(), name='explore-filters'),
    
    # Overview
    path('overview/summary/', OverviewSummaryAPIView.as_view(), name='overview-summary'),
    path('overview/trends/', OverviewTrendsAPIView.as_view(), name='overview-trends'),
    path('overview/map/', OverviewMapAPIView.as_view(), name='overview-map'),
    path('overview/mix/', OverviewMixAPIView.as_view(), name='overview-mix'),
    path('overview/top/', OverviewTopAPIView.as_view(), name='overview-top'),
    
    # Documents
    path('documents/<int:pk>/', DocumentDetailAPIView.as_view(), name='document-detail'),
    path('documents/<int:pk>/related/', RelatedDocumentsAPIView.as_view(), name='document-related'),
    path('documents/<int:pk>/events/', DocumentEventsAPIView.as_view(), name='document-events'),
    
    # Events (public endpoints)
    path('events/upcoming/', UpcomingEventsAPIView.as_view(), name='events-upcoming'),
    path('events/suggest/', EventSuggestAPIView.as_view(), name='event-suggest'),
    path('events/<int:pk>/', PublicEventDetailAPIView.as_view(), name='event-detail'),
    path('events/', PublicEventsListAPIView.as_view(), name='events-list'),
    
    # Events (authenticated endpoints - keep existing)
    path('events/admin/', include('apps.events.urls')),
    
    # Search (include search app)
    path('search/', include('apps.search.urls')),
    
    # App Info
    path('app/version/', AppVersionAPIView.as_view(), name='app-version'),
]
