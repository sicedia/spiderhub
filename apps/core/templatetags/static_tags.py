"""
Template tags personalizados para el manejo de archivos estáticos con cache busting
"""
import os
import time
import hashlib
from django import template
from django.conf import settings
from django.templatetags.static import static
from django.urls import reverse
from django.utils.safestring import mark_safe

register = template.Library()

# Cache de hashes de archivos para evitar recalcular en cada request
_file_hash_cache = {}


def get_file_hash(file_path, use_mtime=False):
    """
    Obtiene un hash único del archivo basado en su contenido o mtime.
    
    Args:
        file_path: Ruta al archivo
        use_mtime: Si True, usa solo el timestamp. Si False, usa hash del contenido.
    
    Returns:
        String con el hash o timestamp
    """
    if not os.path.exists(file_path):
        return str(int(time.time()))
    
    # En desarrollo, usar solo mtime para ser más rápido
    if use_mtime or settings.DEBUG:
        return str(int(os.path.getmtime(file_path)))
    
    # En producción, usar hash del contenido con cache
    if file_path in _file_hash_cache:
        cached_hash, cached_mtime = _file_hash_cache[file_path]
        current_mtime = os.path.getmtime(file_path)
        if cached_mtime == current_mtime:
            return cached_hash
    
    # Calcular hash MD5 del contenido del archivo
    try:
        hasher = hashlib.md5()
        with open(file_path, 'rb') as f:
            # Leer en bloques para archivos grandes
            for chunk in iter(lambda: f.read(8192), b''):
                hasher.update(chunk)
        file_hash = hasher.hexdigest()[:12]  # Usar solo primeros 12 caracteres
        
        # Guardar en cache
        _file_hash_cache[file_path] = (file_hash, os.path.getmtime(file_path))
        return file_hash
    except (OSError, IOError):
        return str(int(time.time()))


@register.simple_tag
def static_versioned(path):
    """
    Genera una URL para un archivo estático con un parámetro de versión
    basado en la fecha de modificación del archivo (en desarrollo) 
    o el hash del contenido (en producción).
    
    Uso: {% static_versioned 'core/css/base.css' %}
    Resultado: /static/core/css/base.css?v=1234567890
    """
    version = None
    
    try:
        # Buscar el archivo en las ubicaciones estáticas
        static_path = None
        
        if settings.DEBUG:
            # En desarrollo, buscar en STATICFILES_DIRS primero
            for static_dir in settings.STATICFILES_DIRS:
                potential_path = os.path.join(static_dir, path)
                if os.path.exists(potential_path):
                    static_path = potential_path
                    break
            
            # Si no se encuentra, probar en cada app
            if not static_path:
                for app in settings.INSTALLED_APPS:
                    if app.startswith('apps.'):
                        app_static_path = os.path.join(
                            settings.BASE_DIR, 
                            app.replace('.', '/'), 
                            'static', 
                            path
                        )
                        if os.path.exists(app_static_path):
                            static_path = app_static_path
                            break
            
            # Usar mtime en desarrollo
            if static_path:
                version = get_file_hash(static_path, use_mtime=True)
        else:
            # En producción, buscar en STATIC_ROOT (collectstatic)
            static_root_path = os.path.join(settings.STATIC_ROOT, path)
            if os.path.exists(static_root_path):
                static_path = static_root_path
                # Usar hash de contenido en producción
                version = get_file_hash(static_path, use_mtime=False)
            else:
                # Fallback: buscar en las mismas ubicaciones que desarrollo
                for static_dir in getattr(settings, 'STATICFILES_DIRS', []):
                    potential_path = os.path.join(static_dir, path)
                    if os.path.exists(potential_path):
                        static_path = potential_path
                        version = get_file_hash(static_path, use_mtime=False)
                        break
        
        # Si no encontramos el archivo o falló el hash
        if not version:
            # Usar la versión configurada como fallback
            version = getattr(settings, 'STATIC_VERSION', str(int(time.time())))
            
    except (OSError, ValueError, Exception):
        # En caso de error, usar timestamp actual
        version = str(int(time.time()))
    
    static_url = static(path)
    return f"{static_url}?v={version}"


@register.simple_tag(takes_context=True)
def css_versioned(context, path):
    """
    Genera un tag <link> completo para CSS con versionado automático y CSP nonce
    
    Uso: {% css_versioned 'core/css/base.css' %}
    """
    versioned_url = static_versioned(path)
    # Get CSP nonce from request if available
    request = context.get('request')
    nonce = getattr(request, 'csp_nonce', '') if request else ''
    nonce_attr = f' nonce="{nonce}"' if nonce else ''
    return mark_safe(f'<link rel="stylesheet" href="{versioned_url}"{nonce_attr}>')


@register.simple_tag(takes_context=True)
def js_versioned(context, path):
    """
    Genera un tag <script> completo para JavaScript con versionado automático y CSP nonce
    
    Uso: {% js_versioned 'core/js/main.js' %}
    """
    versioned_url = static_versioned(path)
    # Get CSP nonce from request if available
    request = context.get('request')
    nonce = getattr(request, 'csp_nonce', '') if request else ''
    nonce_attr = f' nonce="{nonce}"' if nonce else ''
    return mark_safe(f'<script src="{versioned_url}"{nonce_attr}></script>')


@register.simple_tag(takes_context=True)
def js_module_versioned(context, path):
    """
    Genera un tag <script type="module"> para JavaScript modules con versionado automático y CSP nonce
    
    Uso: {% js_module_versioned 'core/js/main.js' %}
    """
    versioned_url = static_versioned(path)
    # Get CSP nonce from request if available
    request = context.get('request')
    nonce = getattr(request, 'csp_nonce', '') if request else ''
    nonce_attr = f' nonce="{nonce}"' if nonce else ''
    return mark_safe(f'<script type="module" src="{versioned_url}"{nonce_attr}></script>')


@register.simple_tag(takes_context=True)
def js_catalog_nonce(context):
    """
    Genera un tag <script> para Django's JavaScript catalog con CSP nonce
    
    Uso: {% js_catalog_nonce %}
    
    Este tag es necesario para que el catálogo de traducciones de Django
    funcione correctamente con Content Security Policy sin 'unsafe-inline'.
    """
    # Get CSP nonce from request if available
    request = context.get('request')
    nonce = getattr(request, 'csp_nonce', '') if request else ''
    nonce_attr = f' nonce="{nonce}"' if nonce else ''
    
    # Generate URL for JavaScript catalog
    try:
        url = reverse('javascript-catalog')
    except Exception:
        # Fallback if javascript-catalog URL is not configured
        url = '/jsi18n/'
    
    return mark_safe(f'<script src="{url}"{nonce_attr}></script>')
