# Guía de Solución de Problemas - HSTS Headers

## 🔍 Diagnóstico

### Paso 1: Verificar que el archivo está actualizado en el contenedor

```bash
# Ver el contenido del archivo nginx.conf dentro del contenedor
docker exec spider_nginx cat /etc/nginx/conf.d/default.conf | grep -A 2 "Strict-Transport-Security"
```

**Deberías ver:**
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

Si NO ves `includeSubDomains; preload`, el archivo no se actualizó en el contenedor.

---

### Paso 2: Reiniciar nginx correctamente

```bash
# Opción 1: Reiniciar solo nginx
docker-compose restart nginx

# Opción 2: Forzar recreación del contenedor
docker-compose up -d --force-recreate nginx

# Opción 3: Reconstruir todo si es necesario
docker-compose down
docker-compose up -d
```

---

### Paso 3: Verificar que nginx se inició sin errores

```bash
# Ver logs de nginx
docker-compose logs nginx

# Verificar que nginx está corriendo
docker-compose ps nginx
```

**No deberías ver errores**, solo avisos como el que ya arreglamos del http2.

---

### Paso 4: Probar los headers directamente

#### Desde Windows (PowerShell):
```powershell
.\test-security-headers.ps1 -Url "https://tu-dominio.com"
```

#### Desde Linux/Mac:
```bash
chmod +x test-security-headers.sh
./test-security-headers.sh https://tu-dominio.com
```

#### Manualmente con curl:
```bash
curl -I -k https://tu-dominio.com/ | grep -i strict
```

**Deberías ver:**
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

---

### Paso 5: Verificar en Mozilla Observatory

1. Ve a: https://observatory.mozilla.org/
2. Ingresa tu dominio
3. Espera el escaneo
4. Revisa la sección "Strict Transport Security (HSTS)"

**Debe mostrar:** ✅ Pass

---

## ⚠️ Problemas Comunes

### Problema 1: "El archivo no se actualiza en el contenedor"

**Causa:** El volumen está montado como read-only o hay un problema de sincronización.

**Solución:**
```bash
# 1. Detener los contenedores
docker-compose down

# 2. Verificar que el archivo local tiene los cambios
cat docker/nginx/nginx.conf | grep "Strict-Transport-Security"

# 3. Eliminar el contenedor y volúmenes si es necesario
docker-compose down -v

# 4. Volver a levantar
docker-compose up -d
```

---

### Problema 2: "Mozilla Observatory aún dice que falla"

**Causas posibles:**

1. **Probando con HTTP en lugar de HTTPS**
   - Mozilla Observatory DEBE escanear el dominio con HTTPS
   - Asegúrate de que tu dominio tenga un certificado SSL válido

2. **CDN o proxy intermedio**
   - Si usas Cloudflare, AWS CloudFront, etc., pueden estar quitando headers
   - Revisa la configuración del CDN

3. **Cache de Mozilla Observatory**
   - A veces tarda unos minutos en actualizar
   - Prueba el "Rescan" después de 5-10 minutos

4. **Certificado SSL autofirmado**
   - Mozilla Observatory rechaza certificados autofirmados
   - Necesitas un certificado válido de Let's Encrypt, DigiCert, etc.

---

### Problema 3: "Headers presentes en / pero no en /static/"

**Causa:** Los location blocks no heredan headers del servidor.

**Solución:** Ya está implementado en el nginx.conf actualizado. Verifica con:

```bash
# Probar endpoint raíz
curl -I https://tu-dominio.com/ | grep -i strict

# Probar archivos estáticos
curl -I https://tu-dominio.com/static/favicon.ico | grep -i strict
```

Ambos DEBEN mostrar el header HSTS.

---

## ✅ Checklist de Verificación

- [ ] El archivo `docker/nginx/nginx.conf` local contiene `includeSubDomains; preload`
- [ ] El archivo dentro del contenedor (`docker exec spider_nginx cat ...`) tiene los cambios
- [ ] Nginx se reinició sin errores (`docker-compose logs nginx`)
- [ ] El header aparece al hacer `curl -I https://dominio.com/`
- [ ] El header aparece en archivos estáticos `/static/`
- [ ] El certificado SSL es válido (no autofirmado)
- [ ] No hay CDN/proxy quitando los headers
- [ ] Mozilla Observatory muestra el dominio con HTTPS

---

## 🔧 Comandos Rápidos de Diagnóstico

```bash
# 1. Verificar archivo en contenedor
docker exec spider_nginx cat /etc/nginx/conf.d/default.conf | head -40

# 2. Verificar sintaxis nginx
docker exec spider_nginx nginx -t

# 3. Recargar configuración sin downtime
docker exec spider_nginx nginx -s reload

# 4. Ver headers completos
curl -Ik https://tu-dominio.com/ 2>&1 | head -20

# 5. Verificar solo HSTS
curl -Ik https://tu-dominio.com/ 2>&1 | grep -i "strict-transport"
```

---

## 📝 Notas Importantes

1. **HTTPS es obligatorio**: Los navegadores IGNORAN el header HSTS si viene por HTTP
2. **Primera visita**: HSTS solo funciona después de la primera visita exitosa por HTTPS
3. **Max-age**: Con 63072000 segundos (2 años), cumples el requisito de preload
4. **Subdomains**: `includeSubDomains` aplica la política a todos los subdominios
5. **Preload**: Para incluir tu sitio en la lista de preload de los navegadores, visita: https://hstspreload.org/

---

## 🆘 Si Nada Funciona

Comparte esta información para diagnóstico:

```bash
# Información del sistema
docker --version
docker-compose --version

# Estado de contenedores
docker-compose ps

# Logs de nginx
docker-compose logs --tail=50 nginx

# Configuración actual
docker exec spider_nginx cat /etc/nginx/conf.d/default.conf

# Test de headers
curl -Ik https://tu-dominio.com/ 2>&1
```

