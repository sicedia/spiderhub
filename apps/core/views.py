"""
Core views - SPA mode: Templates only, all data via API
"""
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import json
import logging

logger = logging.getLogger(__name__)


def health_check(request):
    """Comprehensive health check endpoint for production"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected',
            'version': '1.0.0'
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)


@csrf_exempt
def csp_report_view(request):
    """Endpoint to receive Content Security Policy reports"""
    if request.method != 'POST':
        return HttpResponse(status=405)
    
    try:
        report_data = json.loads(request.body)
        report_type = report_data.get('type', 'unknown')
        report_body = report_data.get('body', {})
        blocked_uri = report_body.get('blocked-uri', 'unknown')
        violated_directive = report_body.get('violated-directive', 'unknown')
        source_file = report_body.get('source-file', 'unknown')
        line_number = report_body.get('line-number', 'unknown')
        column_number = report_body.get('column-number', 'unknown')
        
        logger.warning(
            f"CSP Violation Report - Type: {report_type}, "
            f"Blocked URI: {blocked_uri}, "
            f"Violated Directive: {violated_directive}, "
            f"Source: {source_file}:{line_number}:{column_number}, "
            f"User Agent: {request.META.get('HTTP_USER_AGENT', 'unknown')}, "
            f"IP: {request.META.get('REMOTE_ADDR', 'unknown')}"
        )
        
        if settings.DEBUG:
            logger.debug(f"Full CSP Report: {json.dumps(report_data, indent=2)}")
        
        return HttpResponse(status=204)
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing CSP report JSON: {e}")
        return HttpResponse(status=400)
        
    except Exception as e:
        logger.error(f"Error processing CSP report: {e}")
        return HttpResponse(status=500)


# =============================================================================
# SPA Views - Return only HTML shell, JavaScript loads all data via API
# =============================================================================

def home_page(request):
    """Home page - all data loaded via /api/v1/home/* endpoints"""
    return render(request, 'core/home.html')


def about_page(request):
    """About page - static content"""
    return render(request, 'core/about.html')


def explore_page(request):
    """Explore page - filters and documents loaded via /api/v1/explore/* and /api/v1/search/*"""
    return render(request, 'core/explore.html')


def analysis_page(request):
    """Analysis page - all data loaded via /api/v1/analysis/* endpoints"""
    return render(request, 'core/analysis.html')


def document_detail_page(request, pk):
    """Document detail - data loaded via /api/v1/documents/{pk}/ endpoint"""
    return render(request, 'core/document_detail.html', {'document_id': pk})


def strategic_cabinet_page(request):
    """Strategic Cabinet - all data loaded via /api/v1/cabinet/* endpoints"""
    return render(request, 'core/strategic_cabinet.html')
