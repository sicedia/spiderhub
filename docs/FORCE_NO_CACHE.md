# 🚫 Modo No-Cache Forzado Temporal

Este sistema permite forzar la recarga de todos los recursos (HTML, JS, CSS, API) por un período de tiempo determinado, y luego se desactiva automáticamente.

## 📋 ¿Cuándo usar esto?

Útil después de un deploy importante cuando:
- Se actualizaron archivos JavaScript críticos
- Se cambiaron rutas de API
- Los usuarios reportan problemas de caché
- Necesitas asegurar que todos los usuarios obtengan la nueva versión

## 🚀 Uso Rápido

### Windows (PowerShell)

```powershell
# Activar por 24 horas (por defecto)
.\scripts\force-no-cache.ps1

# Activar por 48 horas
.\scripts\force-no-cache.ps1 -Hours 48

# Desactivar manualmente
.\scripts\force-no-cache.ps1 -Disable
```

### Linux/Mac (Bash)

```bash
# Activar por 24 horas (por defecto)
./scripts/force-no-cache.sh

# Activar por 48 horas
./scripts/force-no-cache.sh 48

# Desactivar manualmente
./scripts/force-no-cache.sh --disable
```

### Manual (cualquier sistema)

Edita tu archivo `.env.production` y agrega:

```bash
# Activar hasta una fecha específica (formato ISO)
FORCE_NO_CACHE_UNTIL=2024-01-15T18:00:00Z

# Para desactivar, elimina la línea o déjala vacía
# FORCE_NO_CACHE_UNTIL=
```

Luego reinicia el contenedor:

```bash
docker-compose restart web
```

## ⚙️ Cómo Funciona

1. **Configuración**: Se establece una fecha/hora de expiración en la variable de entorno `FORCE_NO_CACHE_UNTIL`
2. **Middleware**: El `NoCacheMiddleware` verifica si la fecha actual es anterior a la fecha de expiración
3. **Headers Agresivos**: Si está activo, se aplican headers muy estrictos de no-cache:
   - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`
   - `Pragma: no-cache`
   - `Expires: 0`
   - `Clear-Site-Data: "cache"` (para forzar limpieza de caché del navegador)
4. **Expiración Automática**: Después de la fecha configurada, el sistema vuelve a la configuración normal de caché

## 📅 Formatos de Fecha Soportados

- **ISO 8601 con timezone**: `2024-01-15T18:00:00Z` (recomendado)
- **ISO 8601 con offset**: `2024-01-15T18:00:00+00:00`
- **Timestamp Unix**: `1705344000` (segundos desde epoch)

## 🔍 Verificación

### Verificar que está activo

```bash
# Ver la variable en el contenedor
docker exec spider_web env | grep FORCE_NO_CACHE_UNTIL

# Verificar headers en una respuesta
curl -I https://tu-dominio.com/
# Deberías ver: Cache-Control: no-store, no-cache, ...
```

### Verificar que expiró

Después de la fecha de expiración, los headers deberían volver a la normalidad:
- HTML: `Cache-Control: no-cache, no-store, must-revalidate` (normal)
- API: `Cache-Control: no-cache, no-store, must-revalidate` (normal)
- Static files: `Cache-Control: public, immutable` (con caché normal)

## ⚠️ Consideraciones

1. **Rendimiento**: Durante el período forzado, todos los recursos se descargan en cada request, lo que puede aumentar la carga del servidor
2. **Ancho de Banda**: Los usuarios descargarán todos los recursos en cada visita
3. **Duración Recomendada**: 
   - **Mínimo**: 1-2 horas (para que la mayoría de usuarios activos recarguen)
   - **Recomendado**: 24-48 horas (para cubrir usuarios que visitan diariamente)
   - **Máximo**: 72 horas (no más, para evitar impacto en rendimiento)

## 🔄 Flujo de Deploy con No-Cache Forzado

```bash
# 1. Hacer deploy
docker-compose pull web
docker-compose up -d

# 2. Activar no-cache forzado por 24 horas
./scripts/force-no-cache.sh 24

# 3. Reiniciar para aplicar cambios
docker-compose restart web

# 4. Verificar
docker exec spider_web env | grep FORCE_NO_CACHE_UNTIL

# 5. (Opcional) Desactivar manualmente antes de tiempo
./scripts/force-no-cache.sh --disable
docker-compose restart web
```

## 🐛 Troubleshooting

### El modo no se activa

1. Verifica que la variable esté en `.env.production`:
   ```bash
   grep FORCE_NO_CACHE_UNTIL .env.production
   ```

2. Verifica que el contenedor tenga la variable:
   ```bash
   docker exec spider_web env | grep FORCE_NO_CACHE_UNTIL
   ```

3. Verifica el formato de la fecha (debe ser ISO 8601):
   ```bash
   # Correcto
   FORCE_NO_CACHE_UNTIL=2024-01-15T18:00:00Z
   
   # Incorrecto
   FORCE_NO_CACHE_UNTIL=2024-01-15 18:00:00
   ```

### El modo no expira

1. Verifica la fecha/hora del servidor:
   ```bash
   docker exec spider_web date -u
   ```

2. Verifica que la fecha de expiración sea futura:
   ```bash
   docker exec spider_web python -c "from datetime import datetime; print(datetime.now().isoformat() + 'Z')"
   ```

3. Si es necesario, desactiva manualmente:
   ```bash
   ./scripts/force-no-cache.sh --disable
   docker-compose restart web
   ```

## 📚 Referencias

- [HTTP Caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Clear-Site-Data Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data)

