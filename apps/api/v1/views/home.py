"""
Home API Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from django.db.models import Count, Q
from apps.documents.models import Document, Country, Actor, Theme, BeneficiaryGroup


class HomeStatsAPIView(APIView):
    """Get home page statistics"""
    
    @extend_schema(
        summary="Get home page stats",
        description="Returns summary statistics for the home page"
    )
    def get(self, request):
        from apps.api.v1.services.analysis_service import AnalysisService
        
        service = AnalysisService()
        stats = service.get_summary_stats()
        
        return Response({
            'total_documents': stats.get('total_documents', 0),
            'total_countries': stats.get('active_countries', 0),
            'total_actors': stats.get('total_actors', 0),
            'total_themes': stats.get('active_themes', 0),
            'total_beneficiary_groups': stats.get('total_beneficiaries', 0),
        })


class RecentDocumentsAPIView(APIView):
    """Get recent documents for home page"""
    
    @extend_schema(
        summary="Get recent documents",
        description="Returns most recent documents for home page carousel"
    )
    def get(self, request):
        recent_documents = (
            Document.objects
            .select_related('event_country', 'created_by')
            .order_by('-created_at')[:6]
        )
        
        data = []
        for doc in recent_documents:
            data.append({
                'id': doc.id,
                'title': doc.title,
                'event_date': doc.event_date.isoformat() if doc.event_date else None,
                'event_country': {
                    'name': doc.event_country.name if doc.event_country else None,
                    'iso3': doc.event_country.iso3 if doc.event_country else None,
                } if doc.event_country else None,
                'executive_summary': doc.executive_summary,
                'document_type': doc.get_document_type_display() if doc.document_type else None,
            })
        
        return Response({
            'documents': data
        })

