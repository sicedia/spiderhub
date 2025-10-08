from django.contrib import admin
from django.urls import path, include
from .views import explore_documents, document_detail, export_document_pdf, get_related_documents

app_name = 'documents'
urlpatterns = [
    path('', explore_documents, name='explore'),
    path('<int:document_id>/', document_detail, name='detail'),
    path('<int:document_id>/export-pdf/', export_document_pdf, name='export_pdf'),
]

# API endpoints
api_urlpatterns = [
    path('<int:document_id>/related', get_related_documents, name='related'),
]