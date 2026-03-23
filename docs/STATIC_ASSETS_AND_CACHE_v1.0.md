# Static assets, HTTP cache, and deploy identity (v1.0)

**Canonical guide** for fingerprinted static files, nginx/CDN behavior, `BUILD_ID`, and client reload.  
**Supersedes:** `CACHE_BUSTING_V2_SUMMARY_v2.0.md` (removed), `STATIC_ASSETS_PIPELINE.md` (merged here).

---

## 1. Problem we solved

Browsers cached **stable URLs** (`/static/.../file.js`) while HTML or nginx allowed long-lived cache. Django 5 also **ignored** `STATICFILES_STORAGE` when the default **`STORAGES['staticfiles']`** pointed at plain `StaticFilesStorage`, so `collectstatic` did **not** emit `staticfiles.json` or hashed filenames—users saw stale CSS/JS/images until a hard reload.

**Fix (production):** set **`STORAGES['staticfiles']`** to `whitenoise.storage.CompressedManifestStaticFilesStorage` in [`config/settings/production.py`](../config/settings/production.py).

---

## 2. How it works now

| Layer | Behavior |
|--------|----------|
| **Django `collectstatic`** | Manifest storage: logical names → **hashed filenames**; ES module **imports** rewritten to hashed targets. Output includes **`staticfiles.json`**. |
| **Templates** | [`static_versioned`](../apps/core/templatetags/static_tags.py), `css_versioned`, `js_module_versioned`: in production with manifest storage, URLs are **`{% static %}` only** (no `?v=`). In **`DEBUG`**, `?v=<mtime>` for fast local refresh. |
| **Nginx** | [`docker/nginx/nginx.conf`](../docker/nginx/nginx.conf): `/static/` → long `max-age`, **no** `immutable` (safer if any stable URL slips through). `/media/` → shorter TTL + `must-revalidate`. |
| **HTML** | [`NoCacheMiddleware`](../apps/core/middleware.py): HTML responses get **no-store / no-cache** so the browser always fetches fresh markup with **new** asset URLs. |
| **Deploy identity** | [`config/build_id.py`](../config/build_id.py): `BUILD_ID` = env override → **MD5 of `staticfiles.json`** → `GIT_COMMIT_HASH` → `unknown`. |
| **API** | [`GET /api/v1/app/version/`](../apps/api/v1/views/app_info.py) returns `build_id`, `version`, `git_commit`. |
| **Browser** | [`VersionCheckService`](../apps/core/static/core/js/services/VersionCheckService.js) stores `spiderhub_deploy_id` and compares **`build_id`** so a **new static bundle** triggers reload even when **git commit is unchanged**. |

---

## 3. Environment variables

| Variable | Role |
|----------|------|
| **`BUILD_ID`** | Optional override for bundle identity (otherwise digest of manifest). |
| **`GIT_COMMIT_HASH`** | Set at **Docker build**; used in labels and as `STATIC_VERSION` fallback. |
| **`STATIC_VERSION`** | Human/git-oriented label; **do not** rely on it alone for “new assets” detection. Prefer leaving unset so `version` in API follows image git hash; **`build_id`** tracks the real static bundle. |

Recommended: **do not set** `STATIC_VERSION` in `.env.production` unless you have a specific reason; see [`.env.production.example`](../.env.production.example).

---

## 4. Deployment (Docker Hub, no git on server)

Typical flow:

1. **Local / CI:** bump [`VERSION`](../VERSION) and [`Dockerfile`](../Dockerfile) `ARG VERSION` if needed.
2. **Build and push:** `.\scripts\build-docker.ps1 -Push` (or `build-docker.sh --push`).
3. **Production:** `docker-compose.yml` pins `image: sicedia/spiderhub:<tag>`; on server: `docker compose pull` && `docker compose up -d`.
4. **Nginx config:** if [`docker/nginx/nginx.conf`](../docker/nginx/nginx.conf) changed, copy to the server’s compose-mounted path and `nginx -s reload`.

Entrypoint runs **`collectstatic --clear`** and **`validate_static_deploy`**—see below.

---

## 5. Validation

```bash
# After collectstatic with production settings (manifest present):
python manage.py validate_static_deploy
```

Fails if `staticfiles.json` is missing or critical logical paths do not resolve. With **`DEBUG=True`** and no manifest, the command **warns and skips** (local dev).

---

## 6. Temporary forced no-cache (emergencies)

[`FORCE_NO_CACHE_UNTIL`](../docs/FORCE_NO_CACHE.md) + [`NoCacheMiddleware`](../apps/core/middleware.py): optional aggressive headers for HTML/API during an incident. **Not** a substitute for correct static fingerprinting.

---

## 7. Webpack

[`webpack.config.js`](../webpack.config.js) builds optional UMD bundles; **templates use ES modules + Django manifest**, not these bundles unless you wire them in.

---

## 8. Verification checklist

1. View page source: `/static/...` URLs show **hashed** filenames (e.g. `main.abc123def456.css`).
2. `GET /api/v1/app/version/` → `build_id` present; changes after a deploy that changes static output.
3. Inside container: `staticfiles/staticfiles.json` exists after startup.
4. `curl -I` on HTML: cache-disabling headers for documents.

---

## 9. Troubleshooting

| Symptom | Check |
|---------|--------|
| Old CSS/JS after deploy | `STORAGES['staticfiles']` in production; `staticfiles.json` in volume; new image actually pulled. |
| `validate_static_deploy` fails | Run with production settings after `collectstatic`. |
| API never triggers reload | Compare `build_id` in API vs `localStorage` key `spiderhub_deploy_id`. |
| Diseño viejo **solo en móvil** (todas las rutas) | Algunos WebViews cachean HTML o mezclan estáticos: `base.html` hace un `fetch` temprano a `/api/v1/app/version/` y, si `build_id` ≠ `localStorage`, fuerza recarga con `?_v=…`; nginx oculta cabeceras de caché del upstream en `location /`. Tras cambiar `nginx.conf`, copiar al servidor y `nginx -s reload`. |

---

**Document version:** v1.0  
**Last updated:** March 2026  
**Category:** Deployment & static assets
