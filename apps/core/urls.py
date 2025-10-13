from django.urls import path
from django.shortcuts import render
from .views import home_page, \
    about_page, \
    analysis_page, \
    explore_page, \
    document_detail_page, \
    strategic_cabinet_page, \
    api_countries, \
    api_lead_countries, \
    api_cabinet_summary, \
    api_cabinet_trends, \
    api_cabinet_map, \
    api_cabinet_mix, \
    api_cabinet_top
app_name = 'core'
urlpatterns = [
    path('', home_page, name='home'),
    path('about/', about_page, name='about'),
    path('analysis/', analysis_page, name='analysis'),
    path('explore/', explore_page, name='explore'),
    path('strategic-cabinet/', strategic_cabinet_page, name='strategic_cabinet'),
    path('document_detail/<int:pk>/', document_detail_page, name='document_detail'),
    path('api/countries/', api_countries, name='api_countries'),
    path('api/lead-countries/', api_lead_countries, name='api_lead_countries'),
    # Strategic Cabinet API endpoints
    path('api/cabinet/summary/', api_cabinet_summary, name='api_cabinet_summary'),
    path('api/cabinet/trends/', api_cabinet_trends, name='api_cabinet_trends'),
    path('api/cabinet/map/', api_cabinet_map, name='api_cabinet_map'),
    path('api/cabinet/mix/', api_cabinet_mix, name='api_cabinet_mix'),
    path('api/cabinet/top/', api_cabinet_top, name='api_cabinet_top'),
    # Test pages
    path('test-lead-countries/', lambda request: render(request, 'test_real_data.html'), name='test_lead_countries'),
    path('test-logger/', lambda request: render(request, 'core/logger_test.html'), name='test_logger'),
]