from django.urls import path
from .views import home_page, \
    about_page, \
    analysis_page, \
    explore_page, \
    document_detail_page
app_name = 'core'
urlpatterns = [
    path('', home_page, name='home'),
    path('about/', about_page, name='about'),
    path('analysis/', analysis_page, name='analysis'),
    path('explore/', explore_page, name='explore'),
    path('document_detail/<int:pk>/', document_detail_page, name='document_detail'),
]