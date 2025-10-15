# Despliegue de Corrección HSTS

## 📋 Cambios Realizados

### 1. Archivo: `docker/nginx/nginx.conf` ✅ YA APLICADO
- Actualizado HSTS header con `includeSubDomains` y `preload`
- Agregado HSTS a todos los location blocks
- Mejorada configuración SSL/TLS (http2, ssl_stapling)

### 2. Archivo: `config/settings/production.py` ⚠️ NECESITA ACTUALIZAR
- Deshabilitado HSTS en Django para evitar headers duplicados
- Nginx ahora maneja completamente el HSTS

---

## 🚀 Pasos para Desplegar en Producción

### En tu servidor Ubuntu (spiderhub.cedia.edu.ec)

```bash
# 1. Ir al directorio del proyecto
cd /ruta/a/spiderhub_web

# 2. Actualizar el código desde Git
git pull origin feature/multilanguage

# 3. Verificar que los cambios están presentes
grep -n "HSTS is handled by nginx" config/settings/production.py

# Deberías ver:
# 42:# HSTS is handled by nginx to avoid duplicate headers

# 4. Reconstruir la imagen web si usas imagen local
# (Si usas sicedia/spiderhub:0.1.0-rc.7, necesitas crear una nueva versión)
docker compose build web

# 5. Reiniciar los servicios
docker compose down
docker compose up -d

# 6. Verificar que los contenedores están corriendo
docker compose ps

# 7. Esperar que estén healthy
sleep 30

# 8. Verificar logs
docker compose logs web --tail=50
docker compose logs nginx --tail=50
```

---

## 🧪 Verificación

### Paso 1: Verificar que solo hay UN header HSTS

```bash
curl -I https://spiderhub.cedia.edu.ec/ | grep -i "strict-transport"
```

**Resultado esperado (SOLO UNO):**
```
strict-transport-security: max-age=63072000; includeSubDomains; preload
```

**Si ves DOS headers, Django aún está enviando HSTS. Verifica que:**
- El archivo `config/settings/production.py` tiene los cambios
- Reconstruiste la imagen: `docker compose build web`
- Reiniciaste: `docker compose restart web`

---

### Paso 2: Verificar headers en diferentes endpoints

```bash
# Página principal
curl -I https://spiderhub.cedia.edu.ec/ | grep "strict-transport-security"

# Archivos estáticos
curl -I https://spiderhub.cedia.edu.ec/static/favicon.ico | grep "strict-transport-security"

# API (si aplica)
curl -I https://spiderhub.cedia.edu.ec/api/ | grep "strict-transport-security"
```

Todos deben mostrar el mismo header HSTS.

---

### Paso 3: Verificar todos los headers de seguridad

```bash
curl -I https://spiderhub.cedia.edu.ec/
```

**Debes ver:**
```
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
content-security-policy: ...
referrer-policy: strict-origin-when-cross-origin
```

---

## 🎯 Mozilla Observatory

### Ejecutar el scan

1. Ve a: https://observatory.mozilla.org/
2. Ingresa: `spiderhub.cedia.edu.ec`
3. Click en "Scan Me" o "Rescan"
4. Espera 1-2 minutos

### Resultado esperado

**Strict Transport Security (HSTS):** ✅ **PASS** (+0 puntos)

- ✅ max-age >= 15552000 (6 meses)
- ✅ includeSubDomains presente
- ✅ preload presente

---

## ⚠️ Si Mozilla Observatory Aún Falla

### Posible Causa 1: Headers Duplicados
Si aún ves DOS headers HSTS, el problema es que Django sigue enviándolos.

**Verificar:**
```bash
# Ver configuración actual de Django
docker exec spider_web python manage.py shell -c "from django.conf import settings; print(f'HSTS: {settings.SECURE_HSTS_SECONDS}')"
```

Si imprime un número, Django aún tiene HSTS activo.

**Solución:**
```bash
# Reconstruir imagen
docker compose build web --no-cache
docker compose up -d web
```

---

### Posible Causa 2: CDN/Proxy modificando headers

Si usas un CDN (Cloudflare, CloudFront, etc.):
- Verifica que no esté modificando los headers HSTS
- Desactiva "Auto Minify" o features que modifican headers
- Purga el cache del CDN

---

### Posible Causa 3: Cache de Mozilla Observatory

- Espera 10-15 minutos
- Usa modo privado/incógnito en el navegador
- Prueba desde: https://securityheaders.com/ como alternativa

---

## 📊 Herramientas de Verificación Adicionales

### Security Headers
```
https://securityheaders.com/?q=https://spiderhub.cedia.edu.ec/
```

### SSL Labs
```
https://www.ssllabs.com/ssltest/analyze.html?d=spiderhub.cedia.edu.ec
```

### HSTS Preload List
```
https://hstspreload.org/?domain=spiderhub.cedia.edu.ec
```

---

## 🔄 Rollback (si algo sale mal)

Si necesitas volver atrás:

```bash
# 1. Restaurar configuración anterior de Django
cd /ruta/a/spiderhub_web
git checkout config/settings/production.py

# 2. Reconstruir
docker compose build web
docker compose up -d
```

---

## ✅ Checklist Final

- [ ] `git pull` ejecutado en el servidor
- [ ] Archivo `config/settings/production.py` tiene comentadas las líneas HSTS
- [ ] `docker compose build web` ejecutado
- [ ] `docker compose up -d` ejecutado
- [ ] Solo UN header HSTS visible con `curl -I`
- [ ] Header contiene: `max-age=63072000; includeSubDomains; preload`
- [ ] Mozilla Observatory muestra HSTS como PASS
- [ ] No hay errores en logs: `docker compose logs`

---

## 📞 Soporte

Si tienes problemas, ejecuta este comando y comparte la salida:

```bash
echo "=== NGINX CONFIG ==="
docker exec spider_nginx cat /etc/nginx/conf.d/default.conf | grep -A 1 "Strict-Transport"

echo -e "\n=== DJANGO SETTINGS ==="
docker exec spider_web python manage.py shell -c "from django.conf import settings; print(f'HSTS_SECONDS: {getattr(settings, \"SECURE_HSTS_SECONDS\", \"NOT SET\")}')"

echo -e "\n=== ACTUAL HEADERS ==="
curl -I https://spiderhub.cedia.edu.ec/ | grep -i "strict\|x-frame\|x-content"

echo -e "\n=== CONTAINER STATUS ==="
docker compose ps
```

