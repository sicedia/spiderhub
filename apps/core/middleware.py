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
    Middleware that applies relaxed CSP policies for Django Admin
    to resolve CSP violations with inline styles that Django Admin requires
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Check if the request is for pages that need relaxed CSP
        if self._needs_relaxed_csp(request):
            # Apply relaxed CSP policy for admin pages
            self._apply_relaxed_csp_headers(response)
        
        return response
    
    def _needs_relaxed_csp(self, request):
        """Detect if the request is for pages that need relaxed CSP policies"""
        path = request.path
        return (
            path.startswith('/admin/') or 
            path.startswith('/en/admin/') or 
            path.startswith('/es/admin/') or
            path.startswith('/pt/admin/')
        )
    
    def _apply_relaxed_csp_headers(self, response):
        """Apply relaxed CSP headers for admin pages that need inline styles"""
        # Get CSP_RELAXED_POLICY from settings if defined
        relaxed_policy = getattr(settings, 'CSP_RELAXED_POLICY', None)
        
        if relaxed_policy:
            # Build CSP header with relaxed policies
            csp_directives = []
            
            for directive, sources in relaxed_policy.items():
                if sources:
                    sources_str = ' '.join(f"'{s}'" if s.startswith("'") else s for s in sources)
                    csp_directives.append(f"{directive} {sources_str}")
            
            if csp_directives:
                csp_header = '; '.join(csp_directives)
                response['Content-Security-Policy'] = csp_header
