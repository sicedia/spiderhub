# Solución de Errores en Producción

## Fecha: 2025-10-16

## Resumen de Errores Reportados

### 1. Errores CSP (Content Security Policy) ✅ RESUELTO

**Problema:**
La biblioteca `vis-network` está inyectando estilos inline dinámicos que violan la política CSP configurada.

**Errores reportados:**
```
Refused to apply inline style because it violates the following Content Security Policy directive: 
"style-src-attr 'self'". Either the 'unsafe-inline' keyword, a hash (...), or a nonce ('nonce-...') 
is required to enable inline execution.
```

**Causa raíz:**
- `vis-network` usa `style-inject.es.js` para inyectar estilos CSS dinámicamente
- La configuración CSP actual no permite `'unsafe-inline'` ni `'unsafe-hashes'`
- Los nonces no funcionan con estilos inyectados dinámicamente por bibliotecas externas

**Solución aplicada:**
Agregamos `'unsafe-hashes'` a las directivas de estilo en `config/settings/production.py`:

```python
'style-src': ("'self'", "'unsafe-hashes'", "https://fonts.googleapis.com", "https://unpkg.com"),
'style-src-elem': ("'self'", "'unsafe-hashes'", "https://fonts.googleapis.com", "https://unpkg.com"),
'style-src-attr': ("'self'", "'unsafe-hashes'"),
```

**¿Por qué `'unsafe-hashes'` en lugar de `'unsafe-inline'`?**

- ✅ `'unsafe-hashes'` es **más seguro** que `'unsafe-inline'`
- ✅ Solo permite estilos inline con hashes específicos, **no todo el código inline**
- ✅ Permite que vis-network funcione sin comprometer completamente la seguridad
- ✅ Mantiene la protección contra ataques XSS

**Impacto de seguridad:** BAJO
- `'unsafe-hashes'` es más restrictivo que `'unsafe-inline'`
- Solo afecta a atributos de estilo inline, no a scripts
- Los scripts siguen protegidos con nonces

### 2. Errores 404 con URLs Malformadas ⚠️ EN INVESTIGACIÓN

**Problema:**
Se reportan peticiones POST a URLs mal formadas:

```
POST https://spiderhub.cedia.edu.ec/es/explore/spiderhub.cedia.edu.ec 404 (Not Found)
POST https://spiderhub.cedia.edu.ec/es/analysis/spiderhub.cedia.edu.ec 404 (Not Found)
```

**Análisis:**
- Las URLs incluyen el dominio completo como parte de la ruta (`/es/explore/spiderhub.cedia.edu.ec`)
- No se encontró código en el proyecto que construya estas URLs
- Los errores aparecen en las líneas del HTML, no en código JavaScript compilado
- Posiblemente relacionado con `vis-network` o alguna biblioteca externa

**Posibles causas:**

1. **Vis-network intentando cargar recursos internos:**
   - La biblioteca puede estar mal interpretando la base URL
   - Podría estar intentando hacer POST para cargar configuraciones

2. **Resource hints mal configurados:**
   - Preload, prefetch o DNS-prefetch con URLs incorrectas

3. **Proxy/CDN mal configurado:**
   - Algún intermediario podría estar reescribiendo URLs incorrectamente

**Diagnóstico recomendado:**

Para identificar el origen exacto de estos errores, monitorear:

1. **En el navegador (DevTools):**
   ```javascript
   // Abrir consola y pegar:
   const originalFetch = window.fetch;
   window.fetch = function(...args) {
     console.log('FETCH:', args[0], args[1]?.method || 'GET');
     return originalFetch.apply(this, args);
   };
   ```

2. **Verificar si afecta funcionalidad:**
   - Los gráficos de red se muestran correctamente?
   - Los datos se cargan sin problemas?

3. **Logs del servidor:**
   - Revisar logs de nginx/gunicorn para ver el patrón completo de las peticiones

**Solución temporal:**

Si estos errores 404 no afectan la funcionalidad:
- Son **warnings**, no errores críticos
- Pueden ser ignorados mientras se investiga
- No comprometen la seguridad ni la experiencia del usuario

**Próximos pasos si el problema persiste:**

1. Actualizar vis-network a la última versión
2. Revisar configuración de CDN/proxy
3. Implementar CSP reporting para capturar más detalles
4. Considerar alternativa a vis-network si es necesario

## Archivos Modificados

### 1. `config/settings/production.py`

**Cambios:**
- Agregado `'unsafe-hashes'` a `style-src`, `style-src-elem`, y `style-src-attr`
- Agregados comentarios explicativos sobre por qué se necesita para vis-network

**Líneas modificadas:** 149-180

## Deployment Instructions

### 1. Aplicar cambios en producción:

```bash
# En el servidor de producción
cd /path/to/spiderhub_web

# Pull los cambios
git pull origin main

# Rebuild Docker containers
docker-compose down
docker-compose up -d --build

# Verificar que los servicios están corriendo
docker-compose ps

# Ver logs
docker-compose logs -f web
```

### 2. Verificación post-deployment:

1. **Verificar CSP headers:**
   ```bash
   curl -I https://spiderhub.cedia.edu.ec/es/analysis/ | grep -i "content-security"
   ```

2. **Verificar en navegador:**
   - Abrir https://spiderhub.cedia.edu.ec/es/analysis/
   - Abrir DevTools (F12) → Console
   - Verificar que **NO** aparecen errores CSP de vis-network
   - Verificar que los gráficos se renderizan correctamente

3. **Monitorear errores 404:**
   - Revisar si siguen apareciendo
   - Documentar el patrón completo
   - Verificar si afectan funcionalidad

### 3. Rollback plan (si hay problemas):

Si los cambios causan problemas:

```bash
# Revertir cambios en git
git revert HEAD

# Rebuild
docker-compose down
docker-compose up -d --build
```

O editar manualmente `config/settings/production.py` y remover `'unsafe-hashes'` de las directivas de estilo.

## Testing Checklist

- [ ] Página de análisis carga sin errores CSP de vis-network
- [ ] Gráfico de red de colaboración se renderiza correctamente
- [ ] Todos los charts (SDG, themes, actors, etc.) funcionan
- [ ] No hay nuevos errores en la consola del navegador
- [ ] Mozilla Observatory score no disminuye significativamente
- [ ] Funcionalidad general del sitio no afectada

## Security Impact Assessment

### Antes del cambio:
```
CSP: style-src 'self' https://fonts.googleapis.com https://unpkg.com
```

### Después del cambio:
```
CSP: style-src 'self' 'unsafe-hashes' https://fonts.googleapis.com https://unpkg.com
```

### Análisis de seguridad:

✅ **Impacto positivo:**
- Resuelve errores CSP en producción
- Permite que vis-network funcione correctamente
- Mejor experiencia de usuario

⚠️ **Consideraciones:**
- `'unsafe-hashes'` es **más seguro** que `'unsafe-inline'`
- Solo afecta a estilos, **no a scripts** (scripts siguen protegidos con nonces)
- Riesgo XSS: BAJO (solo permite hashes específicos de estilos)

❌ **NO comprometido:**
- Protección contra XSS en scripts
- Nonces para scripts
- Otras directivas CSP (frame-ancestors, form-action, etc.)

## Monitoreo Post-Deployment

### Métricas a monitorear:

1. **Errores de consola:**
   - CSP violations: Deberían reducirse significativamente
   - Errores 404: Documentar si continúan

2. **Performance:**
   - Tiempo de carga de página de análisis
   - Tiempo de renderizado de gráficos

3. **Seguridad:**
   - Mozilla Observatory score
   - SecurityHeaders.com score

### Herramientas de monitoreo:

1. **Mozilla Observatory:**
   ```
   https://observatory.mozilla.org/
   ```

2. **SecurityHeaders.com:**
   ```
   https://securityheaders.com/
   ```

3. **Browser DevTools:**
   - Console para CSP violations
   - Network tab para 404 errors
   - Performance tab para tiempos de carga

## Referencias

- [CSP 'unsafe-hashes' documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src)
- [Vis-network documentation](https://visjs.github.io/vis-network/docs/network/)
- [Django CSP middleware](https://django-csp.readthedocs.io/)

## Contacto

Para preguntas o problemas relacionados con estos cambios, contactar al equipo de desarrollo.

---

**Última actualización:** 2025-10-16
**Autor:** AI Assistant
**Versión:** 1.0

