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

---

## 🚀 Sistema Mejorado de Cache Busting (v2.0)

### ✨ Nuevas Características

#### 1. **Hash de Contenido en Producción**
El sistema ahora genera **hashes MD5 del contenido** de cada archivo en producción:

```html
<!-- Antes -->
<script src="/static/core/js/ExploreEntry.js?v=1.0.0"></script>

<!-- Ahora -->
<script src="/static/core/js/ExploreEntry.js?v=a1b2c3d4e5f6"></script>
```

**Ventajas:**
- ✅ Cada archivo tiene su propia versión única
- ✅ Solo cambia cuando el contenido del archivo cambia
- ✅ No necesitas incrementar `STATIC_VERSION` manualmente
- ✅ Funciona automáticamente al hacer deploy

#### 2. **Integración con Docker Build**
El Dockerfile ahora captura información del build:

```dockerfile
ARG BUILD_DATE          # Fecha/hora del build
ARG GIT_COMMIT_HASH    # Hash del commit de Git
ARG VERSION            # Versión del proyecto
```

Estas variables están disponibles en la aplicación Django y se usan como fallback si no se puede generar el hash del archivo.

#### 3. **Scripts de Build Mejorados**

**Para Windows (PowerShell):**
```powershell
.\scripts\build-docker.ps1 -Version "0.1.0-rc.4"
```

**Para Linux/Mac (Bash):**
```bash
./scripts/build-docker.sh 0.1.0-rc.4
```

Estos scripts automáticamente:
- Obtienen el hash del commit actual de Git
- Capturan la fecha/hora del build
- Pasan estos valores al Docker build
- Generan versiones únicas para cache busting

### 📋 Nuevo Workflow de Deploy

#### Paso 1: Build de Docker
```powershell
# Windows
.\scripts\build-docker.ps1 -Version "0.1.0-rc.4"

# Linux/Mac  
./scripts/build-docker.sh 0.1.0-rc.4
```

#### Paso 2: Push a Registry
```bash
docker push sicedia/spiderhub:0.1.0-rc.4
docker push sicedia/spiderhub:latest
```

#### Paso 3: Deploy
El contenedor ya incluye toda la información de cache busting:
- Hash de Git: `GIT_COMMIT_HASH` env var
- Fecha de build: `BUILD_DATE` env var
- Hash de contenido: calculado automáticamente

**¡No más necesidad de actualizar manualmente `STATIC_VERSION`!**

### 🎯 Comportamiento del Sistema

#### En Desarrollo (`DEBUG=True`)
- Usa **timestamp de modificación** del archivo
- Actualiza automáticamente en cada guardado
- Headers anti-cache ultra-agresivos

#### En Producción (`DEBUG=False`)
1. **Primera opción**: Hash MD5 del contenido del archivo (12 caracteres)
2. **Segunda opción**: Hash del commit de Git desde `GIT_COMMIT_HASH`
3. **Tercera opción**: Timestamp del build desde `BUILD_DATE`
4. **Fallback**: Timestamp actual

### 📊 Ejemplo de Versiones Generadas

```html
<!-- CSS -->
<link rel="stylesheet" href="/static/core/css/tokens.css?v=f3a1b2c4d5e6">

<!-- JavaScript Modules -->
<script type="module" src="/static/core/js/ExploreEntry.js?v=9d8c7b6a5f4e"></script>

<!-- El hash cambia solo si el contenido del archivo cambia -->
```

### ✅ Ventajas del Nuevo Sistema

1. **Automático**: No requiere intervención manual
2. **Preciso**: Solo invalida cache de archivos modificados
3. **Eficiente**: Archivos sin cambios mantienen su cache
4. **Trazable**: Incluye información de Git en cada build
5. **Confiable**: Múltiples fallbacks para garantizar versiones únicas

### 🔧 Configuración Recomendada

Ya no necesitas configurar `STATIC_VERSION` manualmente. El sistema lo maneja automáticamente usando:

```python
# config/settings/production.py
STATIC_VERSION = os.getenv(
    'STATIC_VERSION', 
    os.getenv('GIT_COMMIT_HASH', str(int(time.time())))[:12]
)
```

### 📝 Notas Importantes

1. **Después de `collectstatic`**: Los hashes se calculan desde `STATIC_ROOT`
2. **Cache en memoria**: Los hashes se cachean para mejor rendimiento
3. **Invalidación automática**: Si un archivo cambia, su hash se recalcula
4. **Compatible con WhiteNoise**: Funciona con el sistema de compresión

### 🎉 Resultado

**Ya no necesitas:**
- ❌ Incrementar manualmente `STATIC_VERSION`
- ❌ Recordar cambiar versiones antes de deploy
- ❌ Preocuparte por cache de archivos antiguos
- ❌ Forzar a usuarios a hacer Ctrl+Shift+R

**El sistema garantiza:**
- ✅ Usuarios siempre ven la última versión
- ✅ Cache eficiente para archivos sin cambios
- ✅ Trazabilidad completa de cada versión
- ✅ Deploy más simple y confiable
