"""
Analysis API Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from ..services.analysis_service import AnalysisService


class AnalysisSummaryAPIView(APIView):
    """Get summary statistics for analysis page"""
    
    @extend_schema(
        summary="Get analysis summary statistics",
        description="Returns main summary statistics including total documents, countries, themes, etc."
    )
    def get(self, request):
        service = AnalysisService()
        data = service.get_summary_stats()
        return Response(data)


class SDGAnalysisAPIView(APIView):
    """Get SDG analysis data"""
    
    @extend_schema(
        summary="Get SDG analysis data",
        description="Returns SDG counts, relevance metrics, and labels"
    )
    def get(self, request):
        service = AnalysisService()
        data = service.get_sdg_analysis()
        return Response(data)


class ThemeAnalysisAPIView(APIView):
    """Get theme analysis data"""
    
    @extend_schema(
        summary="Get theme analysis data",
        description="Returns theme distribution by category"
    )
    def get(self, request):
        service = AnalysisService()
        data = service.get_theme_analysis()
        return Response(data)


class ActorAnalysisAPIView(APIView):
    """Get actor analysis data"""
    
    @extend_schema(
        summary="Get actor analysis data",
        description="Returns actor distribution by category"
    )
    def get(self, request):
        service = AnalysisService()
        data = service.get_actor_analysis()
        return Response(data)


class BeneficiaryAnalysisAPIView(APIView):
    """Get beneficiary analysis data"""
    
    @extend_schema(
        summary="Get beneficiary analysis data",
        description="Returns beneficiary group distribution by category"
    )
    def get(self, request):
        service = AnalysisService()
        data = service.get_beneficiary_analysis()
        return Response(data)


class TimelineAPIView(APIView):
    """Get timeline evolution data"""
    
    @extend_schema(
        summary="Get timeline evolution data",
        description="Returns document evolution by year"
    )
    def get(self, request):
        service = AnalysisService()
        data = service.get_timeline_data()
        return Response(data)


class DiversityRadarAPIView(APIView):
    """Get diversity radar data"""
    
    @extend_schema(
        summary="Get diversity radar data",
        description="Returns diversity metrics across multiple dimensions"
    )
    def get(self, request):
        service = AnalysisService()
        data = service.get_diversity_radar_data()
        return Response(data)


class NetworkGraphAPIView(APIView):
    """Get network graph data (actor-theme matrix)"""
    
    @extend_schema(
        summary="Get network graph data",
        description="Returns actor-theme co-occurrence matrix for network visualization"
    )
    def get(self, request):
        service = AnalysisService()
        matrix = service.get_actor_theme_matrix()
        theme_ben_matrix = service.get_theme_beneficiary_matrix()
        
        # Also get lead country counts and countries data
        lead_country_counts = service.get_lead_country_counts()
        countries_data = service.get_countries_data()
        
        # Get legal bindingness and coverage scope
        binding_data = service.get_legal_bindingness_data()
        scope_data = service.get_coverage_scope_data()
        
        # Get initiative treemap
        treemap_data = service.get_initiative_treemap_data()
        
        return Response({
            'actor_theme_matrix': matrix,
            'theme_ben_matrix': theme_ben_matrix,
            'lead_country_counts': lead_country_counts,
            'countries': countries_data['countries'],
            'country_names': countries_data['country_names'],
            'binding_counts': binding_data['binding_counts'],
            'binding_info': binding_data['binding_info'],
            'scope_counts': scope_data['scope_counts'],
            'initiative_treemap_data': treemap_data,
        })

