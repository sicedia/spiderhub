"""
Middleware para evitar el cache del navegador en archivos estáticos durante development
"""
from django.conf import settings


class NoCacheMiddleware:
    """
    Middleware que añade headers para evitar el cache del navegador
    en archivos estáticos durante el desarrollo.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Solo aplicar en development
        if settings.DEBUG:
            # Aplicar a archivos estáticos y media
            if (request.path.startswith(settings.STATIC_URL) or 
                request.path.startswith(settings.MEDIA_URL)):
                # Headers para evitar cache
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                response['Last-Modified'] = ''
                response['ETag'] = ''
            
            # También aplicar a archivos CSS, JS específicos por extensión
            elif (request.path.endswith('.css') or 
                  request.path.endswith('.js') or 
                  request.path.endswith('.ico')):
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
        
        return response
