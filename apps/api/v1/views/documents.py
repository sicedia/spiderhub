"""
Documents API Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from apps.documents.models import Document
from apps.documents.serializers import RelatedDocumentSerializer


class DocumentDetailAPIView(APIView):
    """Get full document details for SPA rendering"""
    
    @extend_schema(
        summary="Get document details",
        description="Returns complete document information including all relationships for SPA rendering"
    )
    def get(self, request, pk):
        """
        GET /api/v1/documents/{pk}/
        
        Returns complete document data for SPA rendering
        """
        try:
            document = get_object_or_404(
                Document.objects.select_related(
                    'event_country', 'event_city', 'created_by', 'lead_country'
                ).prefetch_related(
                    'themes', 'actors', 'beneficiary_groups', 'sdgs',
                    'practical_applications', 'commitments__details',
                    'kpis', 'countries_involved', 'eu_policy_alignments', 'source_files'
                ),
                pk=pk
            )
            
            # Build comprehensive response
            data = {
                'id': document.id,
                'title': document.title,
                'executive_summary': document.executive_summary,
                'document_type': document.get_document_type_display() if document.document_type else None,
                'document_type_key': document.document_type,
                'event_date': document.event_date.isoformat() if document.event_date else None,
                'event_format': document.get_event_format_display() if document.event_format else None,
                'coverage_scope': document.get_coverage_scope_display() if document.coverage_scope else None,
                'legal_bindingness': document.get_legal_bindingness_display() if document.legal_bindingness else None,
                'score': document.score,
                
                # Location
                'event_country': {
                    'id': document.event_country.id,
                    'name': document.event_country.name,
                    'iso3': document.event_country.iso3
                } if document.event_country else None,
                'event_city': {
                    'id': document.event_city.id,
                    'name': document.event_city.name
                } if document.event_city else None,
                'lead_country': {
                    'id': document.lead_country.id,
                    'name': document.lead_country.name,
                    'iso3': document.lead_country.iso3
                } if document.lead_country else None,
                
                # Countries involved
                'countries_involved': [
                    {'id': c.id, 'name': c.name, 'iso3': c.iso3}
                    for c in document.countries_involved.all()
                ],
                
                # Taxonomies
                'themes': [
                    {'id': t.id, 'name': t.label}
                    for t in document.themes.all()
                ],
                'actors': [
                    {'id': a.id, 'name': a.label}
                    for a in document.actors.all()
                ],
                'beneficiary_groups': [
                    {'id': b.id, 'name': b.label, 'category': b.category or ''}
                    for b in document.beneficiary_groups.all()
                ],
                'sdgs': [
                    {'id': s.id, 'number': s.number, 'label': s.label}
                    for s in document.sdgs.all()
                ],
                'eu_policy_alignments': [
                    {'id': p.id, 'name': p.name}
                    for p in document.eu_policy_alignments.all()
                ],
                
                # Content
                'practical_applications': [
                    {
                        'id': pa.id,
                        'description': pa.description
                    }
                    for pa in document.practical_applications.all()
                ],
                'commitments': [
                    {
                        'id': c.id,
                        'text': c.text,
                        'details': [
                            {
                                'id': d.id,
                                'commitment_class': d.commitment_class,
                                'text': d.text
                            }
                            for d in c.details.all()
                        ]
                    }
                    for c in document.commitments.all()
                ],
                'kpis': [
                    {
                        'id': k.id,
                        'metric_name': k.metric_name,
                        'kpi_text': k.kpi_text,
                        'kpi_type': k.kpi_type,
                        'target_value': k.target_value,
                        'target_description': k.target_description,
                        'unit': k.unit,
                        'timeframe': k.timeframe,
                        'measurement_method': k.measurement_method,
                        'responsible_entity': k.responsible_entity,
                        'sector': k.sector
                    }
                    for k in document.kpis.all()
                ],
                
                # Source files
                'source_files': [
                    {
                        'id': sf.id,
                        'original_filename': getattr(sf, 'original_filename', ''),
                        'file_url': sf.file.url if sf.file and hasattr(sf.file, 'url') else None
                    }
                    for sf in document.source_files.all()
                ],
                
                # Meta
                'created_at': document.created_at.isoformat() if document.created_at else None,
                'updated_at': document.updated_at.isoformat() if document.updated_at else None,
                'created_by': {
                    'id': document.created_by.id,
                    'username': document.created_by.username
                } if document.created_by else None,
                
                # Review status
                'ai_check_status': document.ai_check_status,
                'human_check_status': document.human_check_status,
            }
            
            return Response(data)
            
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            # Log the full error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in DocumentDetailAPIView for pk={pk}: {str(e)}\n{error_traceback}")
            
            # Return detailed error in development
            from django.conf import settings
            detail = 'An error occurred while fetching document details.'
            if settings.DEBUG:
                detail = f"Error: {str(e)}\nTraceback: {error_traceback}"
            
            return Response(
                {
                    'error': str(e),
                    'detail': detail,
                    'traceback': error_traceback if settings.DEBUG else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(cache_page(60 * 15), name='get')
class RelatedDocumentsAPIView(APIView):
    """Get related documents for a given document"""
    
    @extend_schema(
        summary="Get related documents",
        description="Returns up to 3 documents that share taxonomies with the current document"
    )
    def get(self, request, pk):
        """
        GET /api/v1/documents/{pk}/related/
        
        Returns up to 3 documents that share taxonomies with the current document
        """
        try:
            # Get the document
            document = get_object_or_404(Document, pk=pk)
            
            # Get related documents using the model method
            related_docs = document.get_related_documents(top_n=3)
            
            # Optimize query with select_related for event_country
            related_docs = related_docs.select_related('event_country')
            
            # Serialize the data
            serializer = RelatedDocumentSerializer(related_docs, many=True)
            
            return Response({
                'documents': serializer.data,
                'count': len(serializer.data)
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
