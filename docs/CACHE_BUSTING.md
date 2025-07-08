# Cache Busting para Archivos Estáticos

## Problema
Los navegadores cachean archivos CSS, JS e imágenes. Cuando modificas estos archivos, los usuarios deben hacer Ctrl+Shift+R para ver los cambios.

## Solución Implementada

### Para Development
- **Middleware anti-cache**: Agrega headers para evitar cache del navegador
- **Versionado automático**: Usa la fecha de modificación del archivo como versión
- **Template tags personalizados**: `{% static_versioned %}`, `{% css_versioned %}`, `{% js_versioned %}`

### Para Production
- **Versión estática**: Usa variable de entorno `STATIC_VERSION`
- **Cache del navegador habilitado**: Para mejor rendimiento

## Uso

### En Templates
```html
{% load static_tags %}

<!-- CSS con versionado -->
{% css_versioned 'core/css/base.css' %}

<!-- JavaScript normal con versionado -->
{% js_versioned 'core/js/script.js' %}

<!-- JavaScript de módulo con versionado -->
{% js_module_versioned 'core/js/main.js' %}

<!-- Archivos estáticos con versionado -->
<img src="{% static_versioned 'images/logo.png' %}" alt="Logo">
```

### Comandos de Gestión
```bash
# Generar nueva versión para producción
python manage.py update_static_version

# Usar versión específica
python manage.py update_static_version --version "2.1.0"
```

## Resultados

### Development
- URL: `/static/core/css/base.css?v=1672854123` (timestamp de modificación)
- Headers anti-cache automáticos
- No más Ctrl+Shift+R necesario

### Production
- URL: `/static/core/css/base.css?v=1.0.0` (versión configurada)
- Cache del navegador habilitado para rendimiento
- Actualizar `STATIC_VERSION` para nuevas versiones

## Configuración de Variables de Entorno

### Producción
```env
STATIC_VERSION=1.0.0
```

Cuando depliegues una nueva versión, incrementa `STATIC_VERSION` para forzar la actualización de cache en todos los navegadores.
