"""
Middleware para evitar el cache del navegador en archivos estáticos durante development
y para manejar CSP específico para Django Admin
"""
from django.conf import settings


class NoCacheMiddleware:
    """
    Middleware que añade headers para evitar el cache del navegador
    en archivos estáticos durante el desarrollo.
    
    IMPORTANTE: Los ES6 modules tienen un cache muy agresivo en navegadores modernos.
    Este middleware usa headers HTTP muy estrictos para forzar la recarga.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Solo aplicar en development
        if settings.DEBUG:
            # Detectar si es un archivo JavaScript (incluyendo ES6 modules)
            is_js_file = request.path.endswith('.js')
            
            # Debug: imprimir cuando procesamos archivos JS
            if is_js_file:
                print(f"[NoCacheMiddleware] Processing: {request.path}")
            
            # Aplicar a archivos estáticos y media
            if (request.path.startswith(settings.STATIC_URL) or 
                request.path.startswith(settings.MEDIA_URL)):
                
                if is_js_file:
                    # Headers extra agresivos para ES6 modules
                    # Chrome, Firefox y Edge cachean agresivamente los modules
                    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
                    response['Pragma'] = 'no-cache'
                    response['Expires'] = '0'
                    response['Last-Modified'] = ''
                    response['ETag'] = ''
                    # Header adicional para prevenir el "memory cache" de Chrome
                    response['Clear-Site-Data'] = '"cache"'
                    # Vary header para asegurar que cada request sea única
                    response['Vary'] = '*'
                    print(f"[NoCacheMiddleware] ✅ Applied aggressive headers to: {request.path}")
                else:
                    # Headers normales para CSS, imágenes, etc.
                    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
                    response['Pragma'] = 'no-cache'
                    response['Expires'] = '0'
                    response['Last-Modified'] = ''
                    response['ETag'] = ''
            
            # También aplicar a archivos CSS, JS específicos por extensión fuera de /static/
            elif (request.path.endswith('.css') or 
                  request.path.endswith('.js') or 
                  request.path.endswith('.ico')):
                
                if is_js_file:
                    # Headers extra agresivos para JavaScript
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


class AdminCSPMiddleware:
    """
    Middleware que aplica políticas CSP relajadas específicamente para Django Admin
    para resolver violaciones CSP con estilos inline que Django Admin requiere
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Verificar si la request es para Django Admin
        if self._is_admin_request(request):
            # Aplicar política CSP relajada para admin
            self._apply_admin_csp_headers(response)
        
        return response
    
    def _is_admin_request(self, request):
        """Detectar si la request es para Django Admin"""
        path = request.path
        return (
            path.startswith('/admin/') or 
            path.startswith('/en/admin/') or 
            path.startswith('/es/admin/') or
            path.startswith('/pt/admin/')
        )
    
    def _apply_admin_csp_headers(self, response):
        """Aplicar headers CSP relajados para Django Admin"""
        # Obtener CSP_ADMIN_POLICY de settings si está definida
        admin_policy = getattr(settings, 'CSP_ADMIN_POLICY', None)
        
        if admin_policy:
            # Construir header CSP con políticas relajadas
            csp_directives = []
            
            for directive, sources in admin_policy.items():
                if sources:
                    sources_str = ' '.join(f"'{s}'" if s.startswith("'") else s for s in sources)
                    csp_directives.append(f"{directive} {sources_str}")
            
            if csp_directives:
                csp_header = '; '.join(csp_directives)
                response['Content-Security-Policy'] = csp_header
