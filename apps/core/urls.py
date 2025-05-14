from django.contrib import admin
from django.urls import path, include
from .views import home_page
from .views import test_page
from .views import about_page

app_name = 'core'
urlpatterns = [
    path('', home_page, name='home'),
    path('about/', about_page, name='about'),
    path('test/', test_page, name='test'),
    
]