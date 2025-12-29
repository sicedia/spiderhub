"""
Middleware to prevent browser caching of static files during development
and to handle CSP specific to Django Admin
"""
import os
from datetime import datetime, timezone
from django.conf import settings


class NoCacheMiddleware:
    """
    Middleware that adds headers to prevent browser caching
    of static files during development.
    
    IMPORTANT: ES6 modules have very aggressive caching in modern browsers.
    This middleware uses very strict HTTP headers to force reload.
    
    Supports temporary forced no-cache via FORCE_NO_CACHE_UNTIL environment variable.
    Format: ISO datetime string (e.g., "2024-01-15T18:00:00Z" or "2024-01-15T18:00:00+00:00")
    After this date/time, normal caching behavior resumes.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self._force_no_cache_until = self._parse_force_until_date()

    def _parse_force_until_date(self):
        """Parse FORCE_NO_CACHE_UNTIL environment variable to datetime."""
        force_until_str = os.getenv('FORCE_NO_CACHE_UNTIL', '').strip()
        if not force_until_str:
            return None
        
        try:
            # Try parsing ISO format with timezone
            if 'T' in force_until_str:
                # ISO format: 2024-01-15T18:00:00Z or 2024-01-15T18:00:00+00:00
                dt = datetime.fromisoformat(force_until_str.replace('Z', '+00:00'))
                # Ensure timezone aware
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            else:
                # Try parsing as timestamp
                return datetime.fromtimestamp(float(force_until_str), tz=timezone.utc)
        except (ValueError, TypeError):
            # Invalid format, ignore
            return None

    def _should_force_no_cache(self):
        """
        Check if we should force no-cache based on FORCE_NO_CACHE_UNTIL.
        Returns True if current time is before the expiration date.
        """
        if self._force_no_cache_until is None:
            return False
        
        now = datetime.now(timezone.utc)
        return now < self._force_no_cache_until

    def __call__(self, request):
        response = self.get_response(request)
        
        # Detect if it's a JavaScript file (including ES6 modules)
        is_js_file = request.path.endswith('.js')
        is_html = response.get('Content-Type', '').startswith('text/html')
        is_api = request.path.startswith('/api/')
        is_static = request.path.startswith(settings.STATIC_URL) or request.path.startswith(settings.MEDIA_URL)
        
        # Check if we should force no-cache temporarily
        force_no_cache = self._should_force_no_cache()
        
        # Always prevent caching of HTML responses (both dev and production)
        # This ensures the browser always gets fresh HTML with updated JS references
        if is_html:
            if force_no_cache:
                # Aggressive no-cache during forced period
                response['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                response['Clear-Site-Data'] = '"cache"'
            else:
                # Normal no-cache for HTML
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
            
            # Remove ETag and Last-Modified to prevent conditional requests
            if 'ETag' in response:
                del response['ETag']
            if 'Last-Modified' in response:
                del response['Last-Modified']
        
        # Apply aggressive no-cache to API during forced period
        if is_api and force_no_cache:
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            response['Clear-Site-Data'] = '"cache"'
        
        # Apply aggressive no-cache to static files during forced period
        if is_static and force_no_cache:
            if is_js_file:
                response['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                response['Last-Modified'] = ''
                response['ETag'] = ''
                response['Clear-Site-Data'] = '"cache"'
                response['Vary'] = '*'
            else:
                response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                response['Last-Modified'] = ''
                response['ETag'] = ''
        
        # Only apply to static files in development
        if settings.DEBUG:
            # Debug: print when processing JS files
            if is_js_file:
                print(f"[NoCacheMiddleware] Processing: {request.path}")
            
            # Apply to static and media files
            if (request.path.startswith(settings.STATIC_URL) or 
                request.path.startswith(settings.MEDIA_URL)):
                
                if is_js_file:
                    # Extra aggressive headers for ES6 modules
                    # Chrome, Firefox and Edge aggressively cache modules
                    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
                    response['Pragma'] = 'no-cache'
                    response['Expires'] = '0'
                    response['Last-Modified'] = ''
                    response['ETag'] = ''
                    # Additional header to prevent Chrome's "memory cache"
                    response['Clear-Site-Data'] = '"cache"'
                    # Vary header to ensure each request is unique
                    response['Vary'] = '*'
                    print(f"[NoCacheMiddleware] Applied aggressive headers to: {request.path}")
                else:
                    # Normal headers for CSS, images, etc.
                    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
                    response['Pragma'] = 'no-cache'
                    response['Expires'] = '0'
                    response['Last-Modified'] = ''
                    response['ETag'] = ''
            
            # Also apply to CSS, JS files by extension outside /static/
            elif (request.path.endswith('.css') or 
                  request.path.endswith('.js') or 
                  request.path.endswith('.ico')):
                
                if is_js_file:
                    # Extra aggressive headers for JavaScript
                    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
                    response['Pragma'] = 'no-cache'
                    response['Expires'] = '0'
                    response['Clear-Site-Data'] = '"cache"'
                    response['Vary'] = '*'
                else:
                    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
                    response['Pragma'] = 'no-cache'
                    response['Expires'] = '0'
        
        return response


class RelaxedCSPMiddleware:
    """
    Middleware that applies relaxed CSP policies for specific pages that require
    'unsafe-inline' for styles (Django Admin and /analysis/ with vis-network).
    
    This allows the base CSP to be strict (no unsafe-inline) for optimal Observatory
    scores on main pages, while maintaining functionality for pages that need it.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Check if the request is for pages that need relaxed CSP
        if self._needs_relaxed_csp(request):
            # Apply relaxed CSP policy for pages that need inline styles
            self._apply_relaxed_csp_headers(response)
        
        return response
    
    def _needs_relaxed_csp(self, request):
        """
        Detect if the request is for pages that need relaxed CSP policies.
        These pages require 'unsafe-inline' for styles due to:
        - Django Admin: uses inline styles
        - /analysis/: uses vis-network which injects <style> elements dynamically
        - /api/docs/: Swagger UI requires inline scripts and styles
        """
        path = request.path
        return (
            # Django Admin pages
            path.startswith('/admin/') or 
            path.startswith('/en/admin/') or 
            path.startswith('/es/admin/') or
            path.startswith('/pt/admin/') or
            # Analysis page with vis-network
            path.startswith('/analysis/') or
            path.startswith('/en/analysis/') or
            path.startswith('/es/analysis/') or
            path.startswith('/pt/analysis/') or
            # Swagger UI documentation
            path.startswith('/api/docs/') or
            path == '/api/docs'
        )
    
    def _apply_relaxed_csp_headers(self, response):
        """
        Apply relaxed CSP headers for pages that need inline styles.
        This modifies the existing CSP header (generated by django-csp) to add
        'unsafe-inline' to style directives while preserving nonces.
        """
        import re
        
        # Get existing CSP header (generated by django-csp with nonces)
        existing_csp = response.get('Content-Security-Policy', '')
        
        if not existing_csp:
            # Fallback: build from settings if no CSP exists
            csp_config = getattr(settings, 'CONTENT_SECURITY_POLICY', {})
            directives = csp_config.get('DIRECTIVES', {})
            csp_directives = []
            
            for key, values in directives.items():
                if key != 'report-uri':  # Skip report-uri, handled separately
                    csp_directives.append(f"{key.replace('_', '-')} {' '.join(values)}")
            
            existing_csp = '; '.join(csp_directives)
        
        # Parse existing CSP to extract nonces and directives
        # Extract nonce from script-src if present
        nonce_match = re.search(r"script-src[^;]*(?:'nonce-([a-zA-Z0-9+/=]+)')?", existing_csp)
        nonce_value = nonce_match.group(1) if nonce_match and nonce_match.group(1) else None
        
        # Modify style directives to add unsafe-inline
        # Replace style-src
        style_src_pattern = r"style-src\s+([^;]+)"
        style_src_match = re.search(style_src_pattern, existing_csp)
        if style_src_match:
            style_src_content = style_src_match.group(1)
            if "'unsafe-inline'" not in style_src_content:
                modified_style_src = f"style-src {style_src_content} 'unsafe-inline'"
                existing_csp = re.sub(style_src_pattern, modified_style_src, existing_csp)
        else:
            # Add style-src if it doesn't exist
            existing_csp += "; style-src 'self' 'unsafe-inline'"
        
        # Modify script-src to add unsafe-inline for Swagger UI
        script_src_pattern = r"script-src\s+([^;]+)"
        script_src_match = re.search(script_src_pattern, existing_csp)
        if script_src_match:
            script_src_content = script_src_match.group(1)
            if "'unsafe-inline'" not in script_src_content:
                # Check if nonce is present, if so keep it
                if nonce_value:
                    modified_script_src = f"script-src {script_src_content} 'unsafe-inline' 'nonce-{nonce_value}'"
                else:
                    modified_script_src = f"script-src {script_src_content} 'unsafe-inline'"
                existing_csp = re.sub(script_src_pattern, modified_script_src, existing_csp)
        else:
            # Add script-src if it doesn't exist
            if nonce_value:
                existing_csp += f"; script-src 'self' 'unsafe-inline' 'nonce-{nonce_value}'"
            else:
                existing_csp += "; script-src 'self' 'unsafe-inline'"
        
        # Replace style-src-elem
        style_src_elem_pattern = r"style-src-elem\s+([^;]+)"
        style_src_elem_match = re.search(style_src_elem_pattern, existing_csp)
        if style_src_elem_match:
            style_src_elem_content = style_src_elem_match.group(1)
            if "'unsafe-inline'" not in style_src_elem_content:
                modified_style_src_elem = f"style-src-elem {style_src_elem_content} 'unsafe-inline'"
                existing_csp = re.sub(style_src_elem_pattern, modified_style_src_elem, existing_csp)
        else:
            existing_csp += "; style-src-elem 'self' 'unsafe-inline'"
        
        # Replace style-src-attr
        style_src_attr_pattern = r"style-src-attr\s+([^;]+)"
        style_src_attr_match = re.search(style_src_attr_pattern, existing_csp)
        if style_src_attr_match:
            style_src_attr_content = style_src_attr_match.group(1)
            if "'unsafe-inline'" not in style_src_attr_content:
                modified_style_src_attr = f"style-src-attr {style_src_attr_content} 'unsafe-inline'"
                existing_csp = re.sub(style_src_attr_pattern, modified_style_src_attr, existing_csp)
        else:
            existing_csp += "; style-src-attr 'self' 'unsafe-inline'"
        
        # Update the CSP header
        response['Content-Security-Policy'] = existing_csp


class SecurityHeadersMiddleware:
    """
    Middleware that adds security headers to all responses.
    This ensures headers like Permissions-Policy are present in both
    development and production environments.
    
    Note: In production, nginx also adds these headers, but having them
    at the Django level ensures they're present in development and provides
    redundancy in production.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add Permissions-Policy header
        # This header allows sites to control which features and APIs can be used
        # Setting to empty parentheses denies all listed features
        if 'Permissions-Policy' not in response:
            response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response


class ForceEnglishDefaultMiddleware:
    """
    Middleware that forces the default language to English, ignoring browser language detection.
    This ensures that the site always starts in English unless the user explicitly chooses
    a different language via URL prefix or language switcher.
    
    This middleware runs BEFORE LocaleMiddleware and removes the Accept-Language header
    to prevent Django from detecting the browser's language preference.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.conf import settings
        
        # Check if language is explicitly set in URL (has language prefix)
        # If URL has a language prefix like /es/ or /pt/, allow it
        path_parts = request.path_info.strip('/').split('/')
        has_language_prefix = path_parts and path_parts[0] in dict(settings.LANGUAGES).keys()
        
        # Check if language is set in session (user explicitly chose a language via switcher)
        language_from_session = request.session.get('django_language', None) if hasattr(request, 'session') else None
        
        # If there's no language prefix in URL and no language in session,
        # remove Accept-Language header to prevent browser language detection
        # This forces Django to use LANGUAGE_CODE (English) as default
        if not has_language_prefix and not language_from_session:
            # Temporarily remove Accept-Language header to prevent browser language detection
            if 'HTTP_ACCEPT_LANGUAGE' in request.META:
                # Store original value in case we need it later
                request.META['HTTP_ACCEPT_LANGUAGE_ORIGINAL'] = request.META['HTTP_ACCEPT_LANGUAGE']
                # Remove it so LocaleMiddleware won't use it
                del request.META['HTTP_ACCEPT_LANGUAGE']
        
        response = self.get_response(request)
        return response
