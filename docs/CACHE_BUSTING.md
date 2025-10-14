# Cache Busting para Archivos Estáticos

## Problema
Los navegadores cachean archivos CSS, JS e imágenes. Cuando modificas estos archivos, los usuarios deben hacer Ctrl+Shift+R para ver los cambios.

### ⚠️ Problema Específico con ES6 Modules
Los navegadores modernos (Chrome, Firefox, Edge) tienen un **cache extremadamente agresivo** para ES6 modules (`import`/`export`). Esto significa que:

- El entry point puede tener versionado: `AnalysisEntry.js?v=123456` ✅
- Pero los imports internos NO: `import { darkModeManager } from './darkMode.js'` ❌
- El navegador cachea `darkMode.js` sin importar si cambias la versión del entry point
- Resultado: Los usuarios deben hacer **Ctrl+Shift+R** (hard refresh) para ver cambios en dark mode, gráficos, filtros, etc.

**Archivos afectados comúnmente:**
- `darkMode.js` - Cambios en estilos de dark mode
- `NetworkGraph.js` - Cambios en el grafo de red
- `ExplorePageManager.js` - Cambios en filtros de explore
- `CabinetPageManager.js` - Cambios en combo box de países de Strategic Cabinet

## Solución Implementada

### Para Development
- **Middleware anti-cache mejorado**: Headers HTTP extra agresivos específicamente para archivos `.js`
- **Versionado automático**: Usa la fecha de modificación del archivo como versión
- **Template tags personalizados**: `{% static_versioned %}`, `{% css_versioned %}`, `{% js_versioned %}`
- **Headers especiales para ES6 modules**: `Clear-Site-Data`, `Vary`, `no-store`, `proxy-revalidate`

### Para Production
- **Versión estática**: Usa variable de entorno `STATIC_VERSION`
- **Cache del navegador habilitado**: Para mejor rendimiento
- **IMPORTANTE**: Al hacer deploy, **SIEMPRE incrementa `STATIC_VERSION`** para forzar recarga de todos los modules

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
- Headers anti-cache automáticos ultra-agresivos para archivos `.js`
- **Debería** funcionar sin Ctrl+Shift+R en la mayoría de casos
- Si aún ves cache: Cierra y reabre el navegador, o usa modo incógnito para testing

### Production
- URL: `/static/core/css/base.css?v=1.0.0` (versión configurada)
- Cache del navegador habilitado para rendimiento
- Actualizar `STATIC_VERSION` para nuevas versiones

## Configuración de Variables de Entorno

### Producción
```env
STATIC_VERSION=1.0.0
```

**⚠️ IMPORTANTE para deployments:**

Cuando hagas deploy con cambios en JavaScript (especialmente dark mode, componentes, utils), **SIEMPRE incrementa `STATIC_VERSION`**:

```bash
# Ejemplo de incremento de versión
# Antes
STATIC_VERSION=1.0.0

# Después (cambios menores - bugfixes, dark mode, estilos)
STATIC_VERSION=1.0.1

# O (cambios mayores - nuevas features)
STATIC_VERSION=1.1.0
```

Esto fuerza la recarga de **TODOS** los archivos estáticos, incluyendo los ES6 modules importados.

## Mejores Prácticas

### Durante Desarrollo
1. **Si ves cache persistente**: Cierra TODAS las pestañas del sitio y reabre
2. **Para testing limpio**: Usa modo incógnito (Ctrl+Shift+N)
3. **DevTools abierto**: En Chrome DevTools > Network, marca "Disable cache" durante desarrollo
4. **Verifica headers**: En Network tab, verifica que los archivos `.js` tengan `Cache-Control: no-store`

### Antes de hacer Deploy
1. ✅ **SIEMPRE incrementa `STATIC_VERSION`** si tocaste archivos JavaScript
2. ✅ Verifica que `config/settings/production.py` usa `STATIC_VERSION` correctamente
3. ✅ Prueba en modo incógnito antes de deployar
4. ✅ Documenta el cambio de versión en el commit/PR

### Archivos que SIEMPRE requieren increment de versión
- ❗ `darkMode.js` - Afecta a TODOS los gráficos y componentes
- ❗ `Logger.js` - Usado por toda la aplicación
- ❗ Cualquier archivo en `/core/utils/` - Son compartidos
- ❗ Componentes de charts (`NetworkGraph.js`, etc.)
- ❗ Page managers (`ExplorePageManager.js`, `CabinetPageManager.js`, `AnalysisPageManager.js`)

## Troubleshooting

### "Actualicé STATIC_VERSION pero sigo viendo la versión vieja"
- Verifica que el .env de producción tenga el valor correcto
- Haz restart del servidor/contenedor para que cargue la nueva variable
- Limpia la cache de nginx/proxy si usas uno
- Verifica en el HTML source que el `?v=` tenga el nuevo valor

### "En desarrollo sigo necesitando Ctrl+Shift+R"
- Cierra TODAS las pestañas del sitio
- Usa modo incógnito para testing
- Verifica que `DEBUG=True` en settings
- Verifica que el middleware `NoCacheMiddleware` esté en `MIDDLEWARE` en settings
- Revisa DevTools > Network para confirmar que los headers sean `no-store, no-cache`

### "Solo algunos archivos .js tienen problemas de cache"
- Es normal con ES6 modules - Chrome tiene cache por archivo
- Asegúrate de que el middleware esté activo
- Intenta cerrar el navegador completamente y reabrir
- Como último recurso: DevTools > Application > Clear storage > Clear site data
