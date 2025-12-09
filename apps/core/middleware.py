"""
Middleware to prevent browser caching of static files during development
and to handle CSP specific to Django Admin
"""
from django.conf import settings


class NoCacheMiddleware:
    """
    Middleware that adds headers to prevent browser caching
    of static files during development.
    
    IMPORTANT: ES6 modules have very aggressive caching in modern browsers.
    This middleware uses very strict HTTP headers to force reload.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Only apply in development
        if settings.DEBUG:
            # Detect if it's a JavaScript file (including ES6 modules)
            is_js_file = request.path.endswith('.js')
            
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
            path.startswith('/pt/analysis/')
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
