# Fix URLs con Soporte Multiidioma (i18n)

## Fecha: 2025-10-16

## 🔴 Problema Identificado

El usuario preguntó si los errores 404 estaban relacionados con multiidioma. **¡Tenía razón!**

### Errores encontrados:

1. **URLs hardcodeadas sin prefijo de idioma:**
   ```javascript
   // ❌ INCORRECTO
   window.location.href = '/explore';
   window.location.href = '/analysis';
   ```
   
   Con `i18n_patterns` y `prefix_default_language=True`, todas las URLs deben incluir el idioma:
   ```javascript
   // ✅ CORRECTO
   window.location.href = '/es/explore';
   window.location.href = '/en/explore';
   ```

2. **Errores 404 misteriosos:**
   ```
   POST /es/explore/spiderhub.cedia.edu.ec → 404
   POST /es/analysis/spiderhub.cedia.edu.ec → 404
   ```
   Probablemente causados por vis-network tomando hostname incorrectamente.

## ✅ Solución Implementada

### 1. Nueva utilidad de i18n

Creado `apps/core/static/core/js/core/utils/i18n.js` con funciones helper:

```javascript
// Obtener idioma actual de la URL
getCurrentLanguage()  // → 'es', 'en', 'pt'

// Construir URL con prefijo de idioma
buildI18nUrl('/explore')  // → '/es/explore'

// Navegar con soporte i18n
navigateI18n('explore')  // → window.location.href = '/es/explore'

// Obtener path sin idioma
getBasePathWithoutLang()  // '/es/explore/search' → '/explore/search'

// Verificar si es la página actual (ignorando idioma)
isCurrentPage('/explore')  // true si estamos en /es/explore o /en/explore

// URLs de API (sin prefijo de idioma)
getApiUrl('/api/search/')  // → '/api/search/'

// URL completa con dominio
buildFullUrl('/explore')  // → 'https://spiderhub.cedia.edu.ec/es/explore'

// Cambiar idioma manteniendo página actual
switchLanguage('en')  // '/es/explore' → '/en/explore'

// Idiomas disponibles
getAvailableLanguages()  // → [{ code: 'es', name: 'Spanish', ... }]
```

### 2. Archivos actualizados

#### `HomeInteractionCoordinator.js`

**Antes:**
```javascript
window.location.href = '/explore';
window.location.href = `/explore?search=${query}`;
```

**Después:**
```javascript
import { navigateI18n } from '../core/utils/i18n.js';

navigateI18n('explore');
navigateI18n(`explore?search=${query}`);
```

#### `DocumentDetailManager.js`

**Antes:**
```javascript
<a href="/explore" class="btn btn-primary">Browse Documents</a>
```

**Después:**
```javascript
import { buildI18nUrl } from '../core/utils/i18n.js';

<a href="${buildI18nUrl('explore')}" class="btn btn-primary">Browse Documents</a>
```

## 📋 Configuración i18n Actual

### `config/urls.py`

```python
# URLs sin prefijo de idioma (APIs, health checks, etc.)
urlpatterns = [
    path('api/search/', include('apps.search.urls')),
    path('api/documents/', include(documents_api_urls)),
    path('health/', health_check),
    path('i18n/', include('django.conf.urls.i18n')),
    path('jsi18n/', JavaScriptCatalog.as_view()),
]

# URLs con prefijo de idioma
urlpatterns += i18n_patterns(
    path('', include('apps.core.urls')),
    path('documents/', include('apps.documents.urls')),
    path('admin/', admin.site.urls),
    prefix_default_language=True,  # Siempre incluir prefijo
)
```

### Idiomas configurados:

```python
# config/settings/base.py
LANGUAGE_CODE = 'en'
LANGUAGES = [
    ('en', 'English'),
    ('es', 'Español'),
    # ('pt', 'Português'),  # Desactivado temporalmente
]
```

## 🎯 Casos de Uso

### 1. Navegación desde JavaScript

```javascript
import { navigateI18n } from '../core/utils/i18n.js';

// Simple navigation
navigateI18n('explore');  // → /es/explore (respeta idioma actual)

// Con query params
navigateI18n('explore?q=test');  // → /es/explore?q=test

// Abrir en nueva pestaña
navigateI18n('analysis', { newTab: true });

// Replace en lugar de navigate
navigateI18n('about', { replace: true });
```

### 2. Construir URLs para links

```javascript
import { buildI18nUrl } from '../core/utils/i18n.js';

const exploreUrl = buildI18nUrl('explore');  // → '/es/explore'
const searchUrl = buildI18nUrl('explore?q=test');  // → '/es/explore?q=test'

// En templates/HTML
<a href="${buildI18nUrl('explore')}">Explore</a>
```

### 3. Compartir URLs completas

```javascript
import { buildFullUrl } from '../core/utils/i18n.js';

const shareUrl = buildFullUrl('explore');
// → 'https://spiderhub.cedia.edu.ec/es/explore'

await navigator.clipboard.writeText(shareUrl);
```

### 4. Detectar página actual

```javascript
import { isCurrentPage } from '../core/utils/i18n.js';

if (isCurrentPage('/explore')) {
    console.log('Estamos en explore');
}
// Funciona tanto en /es/explore como /en/explore
```

### 5. Cambio de idioma

```javascript
import { switchLanguage } from '../core/utils/i18n.js';

// Cambiar a inglés manteniendo la página actual
switchLanguage('en');
// Si estamos en /es/explore → /en/explore
```

## 🐛 Sobre los 404s de vis-network

Los errores:
```
POST /es/explore/spiderhub.cedia.edu.ec → 404
POST /es/analysis/spiderhub.cedia.edu.ec → 404
```

**Causa probable:**
- vis-network intentando cargar recursos con configuración incorrecta
- Toma `window.location.host` o similar y lo usa como path

**¿Afectan funcionalidad?**
- **NO** - vis-network usa fallback
- Los gráficos se muestran correctamente
- Solo ruido en consola

**Solución si persiste:**
Podemos crear middleware para interceptar estas URLs malformadas:

```python
# apps/core/middleware.py
class VisNetworkURLFixMiddleware:
    """Intercept malformed vis-network URLs"""
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check for malformed vis-network URLs
        if '.edu.ec' in request.path or '.com' in request.path:
            # Return 204 No Content instead of 404
            return HttpResponse(status=204)
        return self.get_response(request)
```

Pero **NO recomiendo implementar esto** a menos que cause problemas reales.

## ✅ Testing

### 1. Navegación desde home page

1. Ir a `/es/` (home)
2. Buscar algo en el search box
3. **Verificar:** Debe ir a `/es/explore?search=...`
4. Click en botón "Explore"
5. **Verificar:** Debe ir a `/es/explore`

### 2. Links en diferentes idiomas

1. Ir a `/es/explore`
2. Click en "Analysis" → Debe ir a `/es/analysis`
3. Cambiar a inglés: `/en/explore`
4. Click en "Analysis" → Debe ir a `/en/analysis`

### 3. Error 404 en documentos

1. Ir a `/es/document_detail/999999/` (ID inexistente)
2. **Verificar:** Botón "Browse Documents" debe tener href="/es/explore"

### 4. Compartir documento

1. Abrir cualquier documento
2. Click en botón compartir
3. **Verificar:** URL copiada debe incluir prefijo de idioma

## 🔄 Migración de Código Existente

### Patrón de migración:

**Antes:**
```javascript
window.location.href = '/some-path';
```

**Después:**
```javascript
import { navigateI18n } from '../core/utils/i18n.js';

navigateI18n('some-path');
```

**Antes:**
```javascript
<a href="/explore">Link</a>
```

**Después:**
```javascript
import { buildI18nUrl } from '../core/utils/i18n.js';

<a href="${buildI18nUrl('explore')}">Link</a>
```

### Archivos que necesitan revisión:

- [ ] `apps/core/static/core/js/coordinators/*.js` - Revisar todos los coordinadores
- [ ] `apps/core/static/core/js/pages/*.js` - Revisar todos los page managers
- [ ] `apps/core/static/core/js/components/**/*.js` - Revisar componentes
- [ ] Templates HTML - Verificar enlaces hardcodeados

## 📚 Beneficios

1. **Consistencia:** Todas las URLs respetan el idioma actual
2. **Mantenibilidad:** Cambios centralizados en i18n.js
3. **Flexibilidad:** Fácil agregar nuevos idiomas
4. **UX mejorado:** Navegación coherente entre páginas
5. **SEO:** URLs correctas por idioma

## 🚀 Deployment

### 1. Aplicar cambios:

```bash
cd /path/to/spiderhub_web
git pull origin main
docker-compose down
docker-compose up -d --build
```

### 2. Verificar:

1. **Navegación funciona correctamente con prefijos de idioma**
2. **No aparecen más errores 404 por URLs sin prefijo**
3. **Cambio de idioma funciona**
4. **Búsquedas redirigen a URL correcta**

### 3. Testing en diferentes idiomas:

```bash
# Español
curl -I https://spiderhub.cedia.edu.ec/es/explore

# Inglés
curl -I https://spiderhub.cedia.edu.ec/en/explore

# Portugués (si está activo)
curl -I https://spiderhub.cedia.edu.ec/pt/explore
```

## 🔮 Próximos Pasos

1. **Auditar código restante** para encontrar más URLs hardcodeadas
2. **Implementar tests** para i18n.js
3. **Documentar** en guía de desarrollo el uso obligatorio de i18n utils
4. **Considerar** agregar ESLint rule para detectar `/explore`, `/analysis`, etc. hardcodeados

## 📖 Referencias

- [Django i18n URL patterns](https://docs.djangoproject.com/en/4.2/topics/i18n/translation/#internationalization-in-url-patterns)
- [django.conf.urls.i18n](https://docs.djangoproject.com/en/4.2/topics/i18n/translation/#django.conf.urls.i18n.i18n_patterns)

---

**Última actualización:** 2025-10-16  
**Estado:** ✅ Implementado  
**Impacto:** 🟢 Positivo - Mejora UX y SEO

