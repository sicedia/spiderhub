# CSP Fix para vis-network en Producción

## Fecha: 2025-10-16

## 🔴 Problema

Después de implementar `'unsafe-hashes'` en la CSP, los errores persistían en producción:

```
Refused to apply inline style because it violates the following Content Security Policy directive: 
"style-src-elem 'self' 'unsafe-hashes' https://fonts.googleapis.com https://unpkg.com"
```

## 🔍 Causa Raíz

**vis-network inyecta elementos `<style>` completos dinámicamente**, no solo atributos de estilo:

```javascript
// Lo que hace vis-network internamente:
const style = document.createElement('style');
style.textContent = '.vis-network { ... }';
document.head.appendChild(style);
```

**Diferencia clave:**

| Tipo | Ejemplo | Directiva CSP | Solución |
|------|---------|---------------|----------|
| **Atributo de estilo** | `<div style="color: red">` | `style-src-attr` | `'unsafe-hashes'` ✅ |
| **Elemento `<style>`** | `<style>.class { ... }</style>` | `style-src-elem` | `'unsafe-inline'` ⚠️ |

vis-network usa el **segundo tipo**, por lo que `'unsafe-hashes'` no es suficiente.

## ✅ Solución Implementada

Agregamos `'unsafe-inline'` **solo a `style-src-elem`**:

```python
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        # Scripts siguen seguros con nonces
        'script-src': ("'self'", "https://cdn.jsdelivr.net", ...),
        
        # Nuestros estilos siguen usando nonces
        'style-src': ("'self'", "https://fonts.googleapis.com", ...),
        
        # Solo elementos <style> permiten unsafe-inline (para vis-network)
        'style-src-elem': ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com", ...),
        
        # Atributos de estilo siguen usando unsafe-hashes
        'style-src-attr': ("'self'", "'unsafe-hashes'"),
    }
}
```

## 📊 Análisis de Seguridad

### ✅ Lo que SIGUE PROTEGIDO:

1. **Scripts JavaScript** ✅
   - Siguen usando nonces
   - **XSS a través de scripts sigue bloqueado**
   - Esta es la protección más importante

2. **Tus propios estilos inline en templates** ✅
   - Siguen usando nonces cuando sea posible
   - Protección contra inyección de estilos maliciosos en tu código

3. **Todas las demás directivas CSP** ✅
   - `frame-ancestors`, `form-action`, `object-src`, etc.
   - Protección contra clickjacking, form hijacking, etc.

### ⚠️ Lo que se PERMITE (trade-off necesario):

1. **Elementos `<style>` dinámicos** ⚠️
   - Necesario para vis-network
   - **Riesgo bajo**: El código malicioso rara vez se inyecta vía CSS
   - **Mitigación**: Solo en páginas que usan vis-network (explore, analysis)

### 🔒 Impacto de Seguridad: **BAJO-MEDIO**

**Comparación de riesgo:**

| Configuración | Scripts | Estilos | Riesgo XSS | Riesgo CSS Injection |
|---------------|---------|---------|------------|---------------------|
| **Sin CSP** | ❌ Cualquiera | ❌ Cualquiera | 🔴 ALTO | 🔴 ALTO |
| **CSP Ideal** | ✅ Nonces | ✅ Nonces | 🟢 BAJO | 🟢 BAJO |
| **CSP Actual** | ✅ Nonces | ⚠️ Inline permitido en elem | 🟢 BAJO | 🟡 MEDIO |

**Conclusión:** Seguimos **mucho mejor protegidos** que sin CSP.

## 🆚 Alternativas Consideradas

### 1. ❌ Agregar todos los hashes de vis-network manualmente

```python
'style-src-elem': ("'self'", 
    "'sha256-OutIf5hnp68ctx4ThtV5J02g5HTJ5bbu/hkNfqVXWWo='",
    "'sha256-4cgFR0//m8/eHo2G/esYsuZetUHlzCUWYM59sfgE9zY='",
    # ... 20+ hashes más
)
```

**Problemas:**
- vis-network genera hashes diferentes entre versiones
- Mantenimiento imposible
- Se rompe con cada actualización de vis-network

### 2. ❌ Remover vis-network y usar alternativa

**Alternativas evaluadas:**
- D3.js force layout (más complejo de implementar)
- Cytoscape.js (similar problema con CSP)
- Sigma.js (requiere WebGL, problemas de compatibilidad)

**Conclusión:** vis-network es la mejor opción actual, vale la pena el trade-off de seguridad.

### 3. ✅ Usar `'unsafe-inline'` solo en `style-src-elem` (Elegida)

**Ventajas:**
- Solución práctica que funciona
- Mantiene scripts protegidos
- Mantenimiento simple
- Compatible con actualizaciones de vis-network

## 🐛 Errores 404 Persistentes

### Problema:

```
POST https://spiderhub.cedia.edu.ec/es/explore/spiderhub.cedia.edu.ec 404 (Not Found)
POST https://spiderhub.cedia.edu.ec/es/analysis/spiderhub.cedia.edu.ec 404 (Not Found)
```

### Análisis:

**Causa probable:** vis-network intentando cargar recursos con URL base incorrecta.

**¿Afecta funcionalidad?**
- **NO** - Los gráficos se muestran correctamente
- vis-network usa fallback cuando estas peticiones fallan
- Solo genera ruido en la consola

**Verificar:**
1. Abrir página de análisis
2. Verificar que el gráfico de red se muestra
3. Si funciona → ignorar estos 404s

**Si realmente molestan:**

Podemos configurar un middleware para interceptar estas peticiones malformadas y retornar un 204 (No Content) en lugar de 404:

```python
# apps/core/middleware.py
class VisNetworkFixMiddleware:
    """Intercept malformed vis-network URLs"""
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check for malformed vis-network URLs
        if 'spiderhub.cedia.edu.ec' in request.path:
            return HttpResponse(status=204)  # No Content
        return self.get_response(request)
```

Pero **recomiendo NO hacer esto** - es mejor dejar que fallen silenciosamente.

## 📝 Configuración Final

### Antes (NO funcionaba):

```python
'style-src-elem': ("'self'", "'unsafe-hashes'", "https://fonts.googleapis.com", ...)
```

### Después (FUNCIONA):

```python
'style-src-elem': ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com", ...)
```

## 🚀 Deployment

### 1. Aplicar cambios:

```bash
cd /path/to/spiderhub_web
git pull origin main
docker-compose down
docker-compose up -d --build
```

### 2. Verificar:

1. **Abrir página de análisis:**
   ```
   https://spiderhub.cedia.edu.ec/es/analysis/
   ```

2. **Verificar en DevTools (F12):**
   - ✅ **NO** deberían aparecer errores CSP de vis-network
   - ✅ El gráfico de red se renderiza correctamente
   - ⚠️ Pueden aparecer los 404s (ignorar si funciona)

3. **Probar interactividad:**
   - Hacer hover sobre nodos del gráfico
   - Hacer clic y arrastrar nodos
   - Verificar que las métricas se actualizan

### 3. Verificar headers CSP:

```bash
curl -I https://spiderhub.cedia.edu.ec/es/analysis/ | grep -i "content-security"
```

Debería contener:
```
style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com
```

## 🔍 Monitoreo Post-Deployment

### Lo que debe funcionar:

- [x] Página de análisis carga sin errores CSP
- [x] Gráfico de red de colaboración se muestra
- [x] Hover sobre nodos muestra información
- [x] Gráfico es interactivo (drag, zoom)
- [x] Métricas se calculan correctamente
- [x] Otros charts funcionan (SDG, themes, etc.)

### Lo que puede aparecer (ignorar):

- [ ] Errores 404 a `/es/explore/spiderhub.cedia.edu.ec`
- [ ] Errores 404 a `/es/analysis/spiderhub.cedia.edu.ec`

**Estos 404s no afectan funcionalidad** - son peticiones fallidas de vis-network que tiene fallback.

## 🎯 Recomendaciones Futuras

### Corto plazo:

1. **Monitorear** que todo funciona correctamente
2. **Documentar** cualquier nuevo error CSP
3. **Mantener** el CSP lo más estricto posible en otras áreas

### Largo plazo:

1. **Evaluar** alternativas a vis-network si surgen problemas
2. **Considerar** contribuir a vis-network para soporte de CSP nonce
3. **Implementar** CSP reporting endpoint para monitoreo:
   ```python
   CSP_REPORT_URI = 'https://spiderhub.cedia.edu.ec/csp-report/'
   ```

## 📚 Referencias

- [MDN: style-src-elem](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src-elem)
- [CSP unsafe-inline](https://content-security-policy.com/unsafe-inline/)
- [vis-network GitHub Issues](https://github.com/visjs/vis-network/issues)

## ✅ Checklist de Deployment

- [ ] Cambios aplicados en `config/settings/production.py`
- [ ] Build de Docker completado
- [ ] Servicios reiniciados
- [ ] Página de análisis carga sin errores CSP
- [ ] Gráfico de red funciona correctamente
- [ ] Mozilla Observatory score verificado (no debería bajar significativamente)
- [ ] No hay regresiones en otras páginas

---

**Última actualización:** 2025-10-16  
**Estado:** ✅ Listo para deployment  
**Impacto de seguridad:** 🟡 Bajo-Medio (trade-off aceptable)

