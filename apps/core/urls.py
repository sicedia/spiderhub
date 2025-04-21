from django.contrib import admin
from django.urls import path, include
from .views import home_page

urlpatterns = [
    path('home/', home_page, name='home'),
]