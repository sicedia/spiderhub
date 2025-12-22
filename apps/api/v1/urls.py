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
    CabinetSummaryAPIView,
    CabinetTrendsAPIView,
    CabinetMapAPIView,
    CabinetMixAPIView,
    CabinetTopAPIView,
    CountryListAPIView,
    LeadCountriesAPIView,
    CountriesByRoleAPIView,
    ExploreFiltersAPIView,
    HomeStatsAPIView,
    RecentDocumentsAPIView,
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
    
    # Strategic Cabinet
    path('cabinet/summary/', CabinetSummaryAPIView.as_view(), name='cabinet-summary'),
    path('cabinet/trends/', CabinetTrendsAPIView.as_view(), name='cabinet-trends'),
    path('cabinet/map/', CabinetMapAPIView.as_view(), name='cabinet-map'),
    path('cabinet/mix/', CabinetMixAPIView.as_view(), name='cabinet-mix'),
    path('cabinet/top/', CabinetTopAPIView.as_view(), name='cabinet-top'),
    
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
]
