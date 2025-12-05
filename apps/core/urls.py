"""
Core URL Configuration
Template pages only - all API endpoints moved to apps.api.v1
"""
from django.urls import path
from django.shortcuts import render
from .views import (
    home_page,
    about_page,
    analysis_page,
    explore_page,
    document_detail_page,
    strategic_cabinet_page,
)

app_name = 'core'

urlpatterns = [
    # Template pages
    path('', home_page, name='home'),
    path('about/', about_page, name='about'),
    path('analysis/', analysis_page, name='analysis'),
    path('explore/', explore_page, name='explore'),
    path('strategic-cabinet/', strategic_cabinet_page, name='strategic_cabinet'),
    path('document_detail/<int:pk>/', document_detail_page, name='document_detail'),
    
    # Test pages
    path('test-lead-countries/', lambda request: render(request, 'test_real_data.html'), name='test_lead_countries'),
    path('test-logger/', lambda request: render(request, 'core/logger_test.html'), name='test_logger'),
]