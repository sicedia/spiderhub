# Acceso al servidor de producción y despliegue (v1.0) — plantilla pública

> **Repositorio público:** los valores concretos de host y usuario no se versionan. Sustituye `<PRODUCTION_HOST>`, `<SSH_USER>`, etc. El equipo puede guardar una copia rellenada como `docs/SERVER_PRODUCTION_ACCESS_v1.0.md` en local (ese archivo está en `.gitignore`).

Guía operativa para desarrolladores e IA: **build local**, **Docker Hub**, **SSH**, **rutas en Linux**, **compose**, **logs** y **depuración**.  
Complementa [STATIC_ASSETS_AND_CACHE_v1.0.md](STATIC_ASSETS_AND_CACHE_v1.0.md) y [DEPLOYMENT_CHECKLIST_v1.3.md](DEPLOYMENT_CHECKLIST_v1.3.md).

---

## 1. Arquitectura resumida

| Pieza | Rol |
|--------|-----|
| **Docker Hub** | Registro de la imagen `sicedia/spiderhub:<tag>` (y opcionalmente `:latest`). |
| **Servidor Linux** | Ubuntu; usuario de despliegue típico `<SSH_USER>`. **No** se usa el repo Git en el servidor para actualizar la app: se **pull** de la imagen publicada. |
| **Directorio de compose** | `~/spiderhub` → `docker-compose.yml`, `.env.production`, `docker/nginx/`, `data/`, `deploy.sh`. |
| **Contenedores** | `spider_web` (Django/Gunicorn), `spider_db` (PostgreSQL), `spider_nginx` (TLS y proxy). |
| **Dominio público** | `<PRODUCTION_HOST>` (HTTPS vía nginx → `web:8000`). |

---

## 2. Prerrequisitos en tu máquina

- Código clonado del repo (rama `dev` o la que uses).
- **Docker Desktop** (Windows) o Docker en Linux/Mac para `docker build` / `docker push`.
- Cuenta con permiso de **push** al repo `sicedia/spiderhub` en Docker Hub (`docker login`).
- **SSH**: clave pública autorizada en el servidor para `<SSH_USER>@<PRODUCTION_HOST>` (recomendado). No documentes contraseñas en el repositorio.

---

## 3. Flujo estándar: cambios en código → producción

### 3.1 En local (Windows, raíz del repo)

1. Cambios en código; commit y push a Git si aplica.
2. **Versión de imagen:** edita [`VERSION`](../VERSION) y el `ARG VERSION` del [`Dockerfile`](../Dockerfile) si subes release (p. ej. `0.1.0-rc.29`).
3. **Build y push** (lee `VERSION` automáticamente):

```powershell
cd C:\Projects\spiderhub_web
.\scripts\build-docker.ps1 -Push
```

Equivalente Linux/macOS desde la raíz del repo:

```bash
./scripts/build-docker.sh --push
```

Esto construye y publica:

- `sicedia/spiderhub:<VERSION>` (ej. `sicedia/spiderhub:0.1.0-rc.28`)
- `sicedia/spiderhub:latest` (mismo contenido que el tag recién construido)

### 3.2 Alineación con el repositorio

El archivo [`docker-compose.production.yml`](../docker-compose.production.yml) del repo debe usar el **mismo** `image: sicedia/spiderhub:<tag>` que acabas de publicar, para que el historial de Git refleje producción. Haz commit de `VERSION` + `Dockerfile` + compose si cambiaste el tag.

### 3.3 En el servidor Linux (después del push)

**Ruta base del despliegue:**

```text
/home/<SSH_USER>/spiderhub
```

Contenido típico:

| Ruta | Uso |
|------|-----|
| `~/spiderhub/docker-compose.yml` | Stack en ejecución (servicios, imagen `web`, volúmenes). |
| `~/spiderhub/.env.production` | Variables secretas (no versionar). |
| `~/spiderhub/docker/nginx/nginx.conf` | Configuración nginx montada en el contenedor `nginx`. |
| `~/spiderhub/data/` | Datos montados hacia la app si el compose lo define. |
| `~/spiderhub/deploy.sh` | Script local que hace `docker compose pull` + `up -d` (similar a [`scripts/deploy-production.sh`](../scripts/deploy-production.sh) del repo). |

**Actualizar la imagen y reiniciar:**

```bash
ssh <SSH_USER>@<PRODUCTION_HOST>
cd ~/spiderhub
```

1. Edita `docker-compose.yml` y asegura que bajo `services.web.image` figure **`sicedia/spiderhub:<mismo-tag-que-pusheaste>`** (si fijáis tag explícito; ver sección 5).
2. Ejecuta:

```bash
docker compose pull web
docker compose up -d
```

Si cambió solo `nginx.conf`:

```bash
docker compose exec nginx nginx -s reload
```

---

## 4. Conexión SSH

```bash
ssh <SSH_USER>@<PRODUCTION_HOST>
```

- Primer acceso: aceptar fingerprint del host si lo pide.
- Sin clave configurada: el servidor puede pedir contraseña (configuración del admin); **no** guardes contraseñas en este repo.

Comprobar que estás en el servidor:

```bash
hostname
pwd   # suele ser /home/<SSH_USER>
ls ~/spiderhub
```

---

## 5. Imagen `latest` vs tag fijo

- **Tag fijo** (`image: sicedia/spiderhub:0.1.0-rc.28`): sabes exactamente qué release corre; al desplegar, subes el tag en `docker-compose.yml` y haces `pull` de ese tag.
- **`latest`**: basta `docker compose pull web` para traer la última imagen subida como `latest`; útil pero menos trazable.

El equipo ha usado **tag explícito** en compose de producción para despliegues reproducibles.

---

## 6. Comandos útiles en producción

### Estado y logs

```bash
cd ~/spiderhub
docker compose ps
docker compose logs -f web --tail=100
docker compose logs -f nginx --tail=50
```

### Entrar al contenedor web (Django)

```bash
docker exec -it spider_web bash
# Dentro del contenedor:
curl -s http://localhost:8000/health/
python manage.py shell   # si necesitas inspeccionar Django (cuidado en prod)
exit
```

### Base de datos

PostgreSQL suele estar en el contenedor `spider_db`. La contraseña está en `.env.production` (no copiar a documentación). Puerto **5432** puede estar expuesto al host según el compose del servidor.

### Nginx

```bash
docker compose exec nginx nginx -t      # sintaxis
docker compose exec nginx nginx -s reload
```

### Volúmenes Docker (referencia)

Los nombres exactos salen de `docker volume ls`; suelen incluir `static_data`, `media_data`, `logs_data`, `postgres_data` según el `docker-compose.yml` del servidor.

---

## 7. Verificación rápida tras un deploy

Desde tu PC:

```bash
curl -sI https://<PRODUCTION_HOST>/health/
```

Debe responder `200`. Para la API de versión (caché / `build_id`):

```bash
curl -s https://<PRODUCTION_HOST>/api/v1/app/version/
```

---

## 8. Depuración (debug)

| Objetivo | Acción |
|----------|--------|
| Error 500 / traceback | `docker compose logs web` y buscar la excepción; revisar `logs_data` montado en `/app/logs` dentro del contenedor si aplica. |
| Estáticos viejos | Ver [STATIC_ASSETS_AND_CACHE_v1.0.md](STATIC_ASSETS_AND_CACHE_v1.0.md); comprobar que la imagen nueva está en ejecución (`docker inspect spider_web`). |
| CSP / cabeceras | Inspeccionar respuesta con `curl -I` o DevTools; ver docs de CSP. |
| Solo reproducir en local con settings producción | Usar `.env` y `DJANGO_SETTINGS_MODULE=config.settings.production` con cuidado (secretos, DB). |

**No** ejecutes migraciones destructivas en producción sin proceso acordado. El `entrypoint` del contenedor web suele ejecutar `migrate` al arrancar; revisa [`entrypoint.sh`](../entrypoint.sh).

---

## 9. Qué **no** hace falta en el servidor

- **Clonar el repo** solo para desplegar la app: el código va **dentro de la imagen Docker**. El servidor solo necesita compose, env y (si aplica) nginx montado.
- Opcional: copiar `nginx.conf` desde tu máquina con `scp` si cambió en el repo y el compose monta `./docker/nginx/nginx.conf`.

Ejemplo de copia de `nginx.conf` desde tu PC (Windows PowerShell, rutas ajustadas):

```powershell
scp .\docker\nginx\nginx.conf <SSH_USER>@<PRODUCTION_HOST>:~/spiderhub/docker/nginx/nginx.conf
```

Luego `nginx -s reload` como arriba.

---

## 10. Referencias cruzadas

- [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md) — transferir imagen con `docker save` / `docker load` sin registry.
- [STATIC_ASSETS_AND_CACHE_v1.0.md](STATIC_ASSETS_AND_CACHE_v1.0.md) — caché, `BUILD_ID`, `collectstatic`.
- [DEPLOYMENT_CHECKLIST_v1.3.md](DEPLOYMENT_CHECKLIST_v1.3.md) — checklist previo/post despliegue.

---

**Versión del documento:** v1.0  
**Última actualización:** marzo 2026  
**Mantenimiento:** actualizar rutas o nombres de contenedor si cambia el `docker-compose` del servidor.
