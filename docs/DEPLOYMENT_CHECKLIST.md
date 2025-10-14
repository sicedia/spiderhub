# Deployment Checklist - SPIDERHUB

## Pre-Deployment (Desarrollo Local)

### 1. Verificar Cambios en JavaScript
- [ ] ¿Modificaste algún archivo `.js`?
- [ ] ¿Cambiaste `darkMode.js`?
- [ ] ¿Actualizaste componentes de charts (`NetworkGraph.js`, etc.)?
- [ ] ¿Modificaste page managers (`ExplorePageManager.js`, `CabinetPageManager.js`, `AnalysisPageManager.js`)?
- [ ] ¿Cambiaste archivos en `/core/utils/`?

### 2. Testing en Modo Incógnito
- [ ] Abre el sitio en modo incógnito (Ctrl+Shift+N)
- [ ] Verifica que el dark mode funcione correctamente
- [ ] Prueba el network graph en la página de análisis
- [ ] Prueba los filtros en explore data
- [ ] Prueba el combo box de países en strategic cabinet
- [ ] Verifica que NO hay errores en la consola del navegador

### 3. Preparar Versión Estática

Si modificaste archivos JavaScript:

```bash
# Incrementar STATIC_VERSION
# En tu .env de producción o docker-compose.yml

# Para cambios menores (bugfixes, dark mode, estilos)
STATIC_VERSION=X.Y.(Z+1)

# Para cambios mayores (nuevas features)
STATIC_VERSION=X.(Y+1).0
```

Ejemplo:
```bash
# Antes
STATIC_VERSION=1.0.5

# Después de cambios en darkMode.js
STATIC_VERSION=1.0.6
```

### 4. Actualizar Documentación
- [ ] Documenta el cambio de `STATIC_VERSION` en el commit message
- [ ] Si es un cambio mayor, actualiza el changelog

## Durante Deployment

### 1. Configuración de Producción
- [ ] Verifica que `.env` de producción tenga la nueva `STATIC_VERSION`
- [ ] Verifica que `DEBUG=False` en producción
- [ ] Verifica que `ALLOWED_HOSTS` esté configurado correctamente

### 2. Build y Deploy
```bash
# Si usas Docker
docker-compose -f docker-compose.yml build --no-cache
docker-compose -f docker-compose.yml up -d

# Collectstatic (si es necesario)
python manage.py collectstatic --noinput
```

### 3. Verificar Headers HTTP
```bash
# Verifica que los archivos JS tengan cache habilitado en producción
curl -I https://tu-dominio.com/static/core/js/AnalysisEntry.js

# Deberías ver:
# Cache-Control: public, max-age=31536000
# (en producción con whitenoise/nginx)
```

## Post-Deployment

### 1. Verificación Básica
- [ ] El sitio carga sin errores 500/404
- [ ] No hay errores en la consola del navegador (F12)
- [ ] El dark mode funciona correctamente
- [ ] Los gráficos se renderizan correctamente

### 2. Verificación de Cache Busting

#### Opción A: Verificar en HTML Source
1. Abre el sitio en modo incógnito
2. Click derecho > "Ver código fuente" (Ctrl+U)
3. Busca `AnalysisEntry.js` o `ExploreEntry.js`
4. Verifica que tenga `?v=` con la nueva versión

```html
<!-- Debería verse así: -->
<script type="module" src="/static/core/js/AnalysisEntry.js?v=1.0.6"></script>
```

#### Opción B: Verificar en Network Tab
1. Abre DevTools (F12) > Network tab
2. Recarga la página (F5)
3. Busca archivos `.js` en la lista
4. Verifica que:
   - Tengan `?v=X.Y.Z` en la URL
   - El status sea `200` (no `304 Not Modified` ni `(memory cache)`)

### 3. Verificación de Funcionalidad
- [ ] **Network Graph**: Abre página de análisis, verifica que el grafo se renderice con colores correctos en dark/light mode
- [ ] **Explore Filters**: Abre explore data, aplica filtros, verifica que funcionen
- [ ] **Strategic Cabinet**: Abre strategic cabinet, cambia el país en el combo box, verifica que actualice los datos
- [ ] **Dark Mode Toggle**: Cambia entre light/dark mode, verifica que todos los componentes se actualicen

### 4. Si Algo Sale Mal

#### Síntoma: "Los usuarios siguen viendo la versión vieja"
```bash
# 1. Verifica la versión en el HTML
curl https://tu-dominio.com/analysis/ | grep "AnalysisEntry.js"

# 2. Reinicia el servidor
docker-compose restart web

# 3. Limpia cache de nginx (si aplica)
docker-compose exec nginx nginx -s reload

# 4. Verifica que la variable de entorno se cargó
docker-compose exec web env | grep STATIC_VERSION
```

#### Síntoma: "Errores en consola después del deploy"
```bash
# 1. Verifica que todos los archivos JS se copiaron correctamente
docker-compose exec web ls -la staticfiles/core/js/

# 2. Re-ejecuta collectstatic
docker-compose exec web python manage.py collectstatic --noinput --clear

# 3. Verifica permisos
docker-compose exec web ls -la staticfiles/
```

#### Síntoma: "El dark mode no funciona"
```bash
# 1. Verifica que darkMode.js esté presente
curl https://tu-dominio.com/static/core/js/core/utils/darkMode.js

# 2. Verifica la consola del navegador por errores de import
# F12 > Console tab

# 3. Verifica que la versión del entry point haya cambiado
# View Source > buscar "ExploreEntry.js?v="
```

## Rollback Rápido

Si necesitas revertir:

```bash
# 1. Vuelve a la versión anterior en git
git checkout HEAD~1

# 2. Rebuild (opcional si solo cambió .env)
docker-compose build web

# 3. Restart
docker-compose restart web

# 4. O simplemente cambia STATIC_VERSION a la versión anterior
# En .env:
STATIC_VERSION=1.0.5  # versión que funcionaba

# Y reinicia:
docker-compose restart web
```

## Notas Importantes

### ⚠️ Chrome Memory Cache
Chrome tiene un "memory cache" muy agresivo para módulos JavaScript. Incluso con cache busting correcto, los usuarios que tienen pestañas abiertas pueden necesitar:
1. Cerrar TODAS las pestañas del sitio
2. Reabrir en una nueva pestaña

### ⚠️ Service Workers
Si en el futuro implementas service workers, necesitarás invalidar su cache también:
```javascript
// En el service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => caches.delete(cache))
      );
    })
  );
});
```

### ✅ Best Practice
**Siempre incremente `STATIC_VERSION` cuando toque archivos JavaScript**, incluso para cambios menores. Es mejor ser conservador y forzar reload que tener usuarios con versiones mezcladas (entry point nuevo pero modules viejos).

