from django.contrib import admin
from django.urls import path, include
from .views import home_page, \
    about_page, \
    explore_page, \
    document_detail_page, \
    test_page

app_name = 'core'
urlpatterns = [
    path('', home_page, name='home'),
    path('about/', about_page, name='about'),
    path('explore/', explore_page, name='explore'),
    path('document_detail/', document_detail_page, name='document_detail'),
    path('test/', test_page, name='test'),
    
]