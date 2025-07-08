"""
Template tags personalizados para el manejo de archivos estáticos con cache busting
"""
import os
import time
from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def static_versioned(path):
    """
    Genera una URL para un archivo estático con un parámetro de versión
    basado en la fecha de modificación del archivo (en desarrollo) 
    o un hash fijo (en producción).
    
    Uso: {% static_versioned 'core/css/base.css' %}
    Resultado: /static/core/css/base.css?v=1234567890
    """
    if settings.DEBUG:
        # En desarrollo, usar timestamp de modificación del archivo
        try:
            # Buscar en STATICFILES_DIRS primero
            static_path = None
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
            
            if static_path and os.path.exists(static_path):
                mtime = os.path.getmtime(static_path)
                version = str(int(mtime))
            else:
                # Si el archivo no existe, usar timestamp actual
                version = str(int(time.time()))
        except (OSError, ValueError):
            version = str(int(time.time()))
    else:
        # En producción, usar un hash estático o versión configurada
        version = getattr(settings, 'STATIC_VERSION', '1.0.0')
    
    static_url = static(path)
    return f"{static_url}?v={version}"


@register.simple_tag
def css_versioned(path):
    """
    Genera un tag <link> completo para CSS con versionado automático
    
    Uso: {% css_versioned 'core/css/base.css' %}
    """
    versioned_url = static_versioned(path)
    return mark_safe(f'<link rel="stylesheet" href="{versioned_url}">')


@register.simple_tag
def js_versioned(path):
    """
    Genera un tag <script> completo para JavaScript con versionado automático
    
    Uso: {% js_versioned 'core/js/main.js' %}
    """
    versioned_url = static_versioned(path)
    return mark_safe(f'<script src="{versioned_url}"></script>')


@register.simple_tag
def js_module_versioned(path):
    """
    Genera un tag <script type="module"> para JavaScript modules con versionado automático
    
    Uso: {% js_module_versioned 'core/js/main.js' %}
    """
    versioned_url = static_versioned(path)
    return mark_safe(f'<script type="module" src="{versioned_url}"></script>')
