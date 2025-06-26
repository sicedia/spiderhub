from django.urls import path
from django.shortcuts import render
from .views import home_page, \
    about_page, \
    analysis_page, \
    explore_page, \
    document_detail_page, \
    api_countries, \
    api_lead_countries
app_name = 'core'
urlpatterns = [
    path('', home_page, name='home'),
    path('about/', about_page, name='about'),
    path('analysis/', analysis_page, name='analysis'),
    path('explore/', explore_page, name='explore'),
    path('document_detail/<int:pk>/', document_detail_page, name='document_detail'),
    path('api/countries/', api_countries, name='api_countries'),
    path('api/lead-countries/', api_lead_countries, name='api_lead_countries'),
    # Test page for real data
    path('test-lead-countries/', lambda request: render(request, 'test_real_data.html'), name='test_lead_countries'),
]