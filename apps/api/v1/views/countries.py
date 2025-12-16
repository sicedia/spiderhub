"""
Countries API Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.db.models import Count, Q
from apps.documents.models import Country, Document
from ..services.analysis_service import AnalysisService


class CountryListAPIView(APIView):
    """Get all countries from database"""
    
    @extend_schema(
        summary="Get all countries",
        description="Returns list of all countries with ISO codes and names",
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        countries = Country.objects.all().values('iso3', 'iso2', 'name')
        return Response({
            'countries': list(countries)
        })


class LeadCountriesAPIView(APIView):
    """Get document counts by lead country"""
    
    @extend_schema(
        summary="Get lead countries",
        description="Returns document counts by lead country for choropleth map",
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        service = AnalysisService()
        lead_country_counts = service.get_lead_country_counts()
        
        # Get country names
        countries_info = []
        for iso3, count in lead_country_counts.items():
            try:
                country = Country.objects.get(iso3=iso3)
                countries_info.append({
                    'iso3': iso3,
                    'name': country.name,
                    'count': count
                })
            except Country.DoesNotExist:
                continue
        
        return Response({
            'counts': lead_country_counts,
            'countries': countries_info,
            'total_documents': sum(lead_country_counts.values()),
            'total_lead_countries': len(lead_country_counts)
        })


class CountriesByRoleAPIView(APIView):
    """Get countries with document counts filtered by role"""
    
    @extend_schema(
        summary="Get countries by role",
        description="Returns countries with document counts filtered by participation role",
        parameters=[
            OpenApiParameter('role', OpenApiTypes.STR, description="Role: 'any', 'lead', 'involved', 'event'", default='any'),
        ],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        role = request.GET.get('role', 'any')
        
        countries_with_docs = Country.objects.filter(
            Q(document__isnull=False) |
            Q(lead_documents__isnull=False) |
            Q(mentioned_in_documents__isnull=False)
        ).distinct()
        
        countries_data = []
        for country in countries_with_docs:
            if role == 'lead':
                doc_count = Document.objects.filter(lead_country=country).distinct().count()
            elif role == 'involved':
                doc_count = Document.objects.filter(countries_involved=country).distinct().count()
            elif role == 'event':
                doc_count = Document.objects.filter(event_country=country).distinct().count()
            else:  # 'any'
                doc_count = Document.objects.filter(
                    Q(event_country=country) |
                    Q(lead_country=country) |
                    Q(countries_involved=country)
                ).distinct().count()
            
            if doc_count > 0:
                countries_data.append({
                    'iso3': country.iso3,
                    'name': country.name,
                    'count': doc_count
                })
        
        countries_data = sorted(countries_data, key=lambda x: x['name'])
        
        return Response({'countries': countries_data})

