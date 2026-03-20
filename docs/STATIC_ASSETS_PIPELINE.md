# Static assets and cache invalidation

## Django 5 and `STORAGES` (important)

Django 5 defines a default `STORAGES['staticfiles']` backend. **That entry overrides the legacy `STATICFILES_STORAGE` setting** if you only set `STATICFILES_STORAGE` without updating `STORAGES`. The symptom was `collectstatic` copying files **without** hashing and **without** writing `staticfiles.json`, so browsers kept stale URLs.

Production must set **`STORAGES['staticfiles']`** to `whitenoise.storage.CompressedManifestStaticFilesStorage` (see [`config/settings/production.py`](../config/settings/production.py)).

## Runtime model

- **Templates** load scripts and styles via `{% static_versioned %}` / `css_versioned` / `js_module_versioned` in [`apps/core/templatetags/static_tags.py`](../apps/core/templatetags/static_tags.py).
- **Production** uses `CompressedManifestStaticFilesStorage` (Whitenoise). Django rewrites URLs to **content-hashed filenames** and, for JavaScript, rewrites **relative ES module imports** during `collectstatic`.
- **Query strings (`?v=`)** are **not** appended in production when manifest storage is active—the fingerprint is in the **path**.
- **Development** (`DEBUG=True`) still appends `?v=<mtime>` for fast refresh.

## Deploy identity (`BUILD_ID`)

- [`config/build_id.py`](../config/build_id.py) defines `compute_build_id(STATIC_ROOT)`.
- **Order:** `BUILD_ID` env → MD5 digest of `staticfiles.json` (short hex) → `GIT_COMMIT_HASH` → `unknown`.
- Exposed on [`GET /api/v1/app/version/`](../apps/api/v1/views/app_info.py) as `build_id` (and `version` / `git_commit` for labels).
- [`VersionCheckService`](../apps/core/static/core/js/services/VersionCheckService.js) compares `build_id` so a **new static bundle** triggers reload even when the git commit is unchanged.

## Nginx / CDN

- [`docker/nginx/nginx.conf`](../docker/nginx/nginx.conf) uses long `max-age` for `/static/` **without** `immutable`, so accidental stable URLs can still revalidate.
- `/media/` uses shorter TTL and `must-revalidate` (uploads may change at the same URL).
- If you put a **CDN** in front of the origin, ensure HTML is not cached (or cache-busted) and that CDN rules respect `Cache-Control` from nginx.

## Validation

After `collectstatic` (e.g. in [`entrypoint.sh`](../entrypoint.sh)):

```bash
python manage.py validate_static_deploy
```

Checks that `staticfiles.json` exists and that critical logical paths resolve via `staticfiles_storage`.

## Webpack

- [`webpack.config.js`](../webpack.config.js) builds `analysis` / `explore` UMD bundles; **templates do not reference these files** today. Use only if you integrate bundles into Django or add a webpack manifest loader.

## Audit checklist (staging / production)

1. Open a page, view source: `<link>` / `<script>` URLs under `/static/` should include **hashed** filenames (e.g. `main.a1b2c3d4e5f6.css`).
2. Response headers for HTML: `Cache-Control: no-cache` (via Django + nginx).
3. `GET /api/v1/app/version/`: `build_id` present; changes after redeploy with new static files.
4. On disk / volume: `staticfiles/staticfiles.json` present after deploy.
