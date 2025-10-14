# Resumen de Cambios - Cache Busting para ES6 Modules

## 📅 Fecha
Octubre 14, 2025

## 🎯 Problema Identificado

Los usuarios reportaron que después de actualizar la versión, todavía necesitaban hacer **Ctrl+Shift+R** (hard refresh) para ver cambios en:

1. **Dark mode** en todas las páginas
2. **Network graph** en la página de análisis
3. **Filtros** en explore data
4. **Combo box de países** en strategic cabinet

### Causa Raíz

Los navegadores modernos (Chrome, Firefox, Edge) tienen un **cache extremadamente agresivo para ES6 modules**. Aunque el archivo entry point tenga versionado (`AnalysisEntry.js?v=123456`), los imports internos NO lo tienen:

```javascript
// ✅ Tiene versionado (entry point)
<script type="module" src="/static/core/js/AnalysisEntry.js?v=1234567890"></script>

// ❌ NO tiene versionado (imports internos)
import { darkModeManager } from './core/utils/darkMode.js';
import { NetworkGraph } from './components/charts/NetworkGraph.js';
```

El navegador cachea estos módulos importados sin importar el parámetro `?v=` del entry point.

## ✅ Soluciones Implementadas

### 1. Middleware Mejorado (`apps/core/middleware.py`)

**Cambios:**
- Headers HTTP extra-agresivos específicamente para archivos `.js`
- Agregado `Clear-Site-Data: "cache"` para prevenir memory cache de Chrome
- Agregado `Vary: *` para asegurar que cada request sea única
- Agregado `proxy-revalidate` al Cache-Control
- Diferenciación entre archivos JS y otros archivos estáticos

**Headers antes:**
```http
Cache-Control: no-cache, no-store, must-revalidate, max-age=0
Pragma: no-cache
Expires: 0
```

**Headers ahora (para archivos .js):**
```http
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
Pragma: no-cache
Expires: 0
Clear-Site-Data: "cache"
Vary: *
```

### 2. Documentación Actualizada (`docs/CACHE_BUSTING.md`)

**Agregado:**
- ⚠️ Sección específica sobre el problema con ES6 modules
- Explicación detallada de por qué los imports no heredan versionado
- Lista de archivos comúnmente afectados (darkMode.js, NetworkGraph.js, etc.)
- Mejores prácticas durante desarrollo
- Checklist antes de hacer deploy
- Troubleshooting completo con soluciones paso a paso

**Secciones nuevas:**
- "Problema Específico con ES6 Modules"
- "Mejores Prácticas - Durante Desarrollo"
- "Mejores Prácticas - Antes de hacer Deploy"
- "Archivos que SIEMPRE requieren increment de versión"
- "Troubleshooting" con 3 escenarios comunes

### 3. Deployment Checklist (`docs/DEPLOYMENT_CHECKLIST.md`)

**Nuevo archivo** con:
- Checklist pre-deployment (verificación de cambios JS)
- Testing en modo incógnito
- Preparación de STATIC_VERSION
- Checklist durante deployment
- Checklist post-deployment
- Verificación de cache busting (2 métodos)
- Verificación de funcionalidad por feature
- Troubleshooting con comandos específicos
- Procedimiento de rollback rápido

### 4. Herramienta de Testing (`static/cache-test.html`)

**Nueva página** para verificar headers HTTP en desarrollo:
- Test automático de archivos JavaScript críticos
- Visualización de headers HTTP en tiempo real
- Status badges (success/warning/error)
- Instrucciones paso a paso
- Información del sistema (navegador, fecha/hora)

**Archivos testeados:**
- AnalysisEntry.js
- ExploreEntry.js
- CabinetEntry.js
- darkMode.js
- NetworkGraph.js
- ExplorePageManager.js

### 5. README Actualizado

Agregada sección "Technical Documentation" con:
- Enlaces a guías de desarrollo
- Enlaces a herramientas de testing
- Notas importantes sobre deployment
- Recordatorio en la sección Contributing sobre STATIC_VERSION

## 📋 Archivos Modificados

```
✏️  apps/core/middleware.py
✏️  docs/CACHE_BUSTING.md
✏️  README.md
➕ docs/DEPLOYMENT_CHECKLIST.md (nuevo)
➕ docs/CACHE_BUSTING_CHANGES_SUMMARY.md (nuevo)
➕ static/cache-test.html (nuevo)
```

## 🧪 Cómo Testear los Cambios

### En Desarrollo (DEBUG=True)

1. **Accede a la herramienta de testing:**
   ```
   http://localhost:8000/static/cache-test.html
   ```

2. **Haz click en "Ejecutar Tests"**
   - Deberías ver ✅ en todos los archivos .js
   - Los headers deben incluir `Clear-Site-Data` y `proxy-revalidate`

3. **Verifica manualmente en DevTools:**
   - Abre DevTools (F12) > Network tab
   - Marca "Disable cache"
   - Recarga la página
   - Inspecciona los headers de archivos .js
   - Verifica que tengan `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`

4. **Test de dark mode:**
   - Cambia entre dark/light mode en el sistema operativo
   - Recarga la página (F5) - NO deberías necesitar Ctrl+Shift+R
   - Los gráficos y componentes deberían actualizar colores automáticamente

### En Producción (DEBUG=False)

1. **Antes del deploy:**
   ```bash
   # Incrementa STATIC_VERSION en .env
   # Antes: STATIC_VERSION=1.0.5
   # Después: STATIC_VERSION=1.0.6
   ```

2. **Después del deploy:**
   ```bash
   # Verifica que la versión se actualizó
   curl https://tu-dominio.com/analysis/ | grep "AnalysisEntry.js"
   # Deberías ver: AnalysisEntry.js?v=1.0.6
   ```

3. **Test en modo incógnito:**
   - Abre el sitio en modo incógnito
   - Verifica que dark mode funcione
   - Verifica que gráficos se rendericen correctamente
   - NO deberías ver errores en consola

## ⚠️ Acciones Requeridas

### Para Desarrolladores

1. **De ahora en adelante**, cuando modifiques archivos JavaScript:
   ```bash
   # En desarrollo: Los cambios deberían reflejarse automáticamente
   # NO deberías necesitar Ctrl+Shift+R (pero cierra y reabre el navegador si es necesario)
   ```

2. **Si aún ves cache persistente**:
   - Cierra TODAS las pestañas del sitio
   - Reabre en una nueva pestaña
   - O usa modo incógnito para testing

### Para Deployments a Producción

1. **SIEMPRE incrementa `STATIC_VERSION`** si tocaste archivos JavaScript:
   ```bash
   # En .env de producción
   STATIC_VERSION=1.0.6  # incrementa el último número
   ```

2. **Consulta el checklist completo**:
   - Lee `docs/DEPLOYMENT_CHECKLIST.md` antes de cada deploy
   - Marca cada item del checklist
   - Documenta el cambio de versión en el commit/PR

3. **Verifica después del deploy**:
   - Modo incógnito
   - View Source > buscar `?v=1.0.6`
   - Test de dark mode
   - Test de funcionalidad (gráficos, filtros, combos)

## 🎯 Resultados Esperados

### En Desarrollo
- ✅ Headers anti-cache ultra-agresivos para .js
- ✅ NO deberías necesitar Ctrl+Shift+R en la mayoría de casos
- ✅ Si persiste cache: cerrar/reabrir navegador resuelve el problema
- ✅ Herramienta de testing disponible en `/static/cache-test.html`

### En Producción
- ✅ Incrementar STATIC_VERSION fuerza recarga de TODOS los modules
- ✅ Los usuarios NO necesitan Ctrl+Shift+R
- ✅ Los cambios en dark mode se reflejan inmediatamente
- ✅ Los gráficos y filtros usan la versión actualizada

## 📞 Soporte

Si después de implementar estos cambios aún experimentas problemas de cache:

1. **Verifica el middleware:**
   ```bash
   # En Django shell
   python manage.py shell
   >>> from django.conf import settings
   >>> 'apps.core.middleware.NoCacheMiddleware' in settings.MIDDLEWARE
   True  # Debe ser True
   ```

2. **Verifica DEBUG:**
   ```bash
   >>> settings.DEBUG
   True  # En desarrollo
   ```

3. **Consulta Troubleshooting:**
   - Lee `docs/CACHE_BUSTING.md` sección "Troubleshooting"
   - Lee `docs/DEPLOYMENT_CHECKLIST.md` sección "Si Algo Sale Mal"

4. **Último recurso:**
   - DevTools > Application > Clear storage > Clear site data
   - Cierra completamente el navegador
   - Reabre en modo incógnito

## 📝 Notas Finales

- Estos cambios NO afectan el rendimiento en producción
- El middleware solo aplica headers agresivos en desarrollo (DEBUG=True)
- En producción, el cache sigue funcionando normalmente con STATIC_VERSION
- Los usuarios de producción SOLO necesitan cerrar pestañas si tienen el sitio abierto durante el deploy
- La mayoría de usuarios verán los cambios automáticamente al recargar

---

**Fecha de implementación**: Octubre 14, 2025  
**Versión de documentación**: 1.0  
**Próxima revisión**: Después del próximo deployment a producción

