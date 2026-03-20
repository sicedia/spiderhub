# Deployment Checklist - SPIDERHUB

**Companion:** [STATIC_ASSETS_AND_CACHE_v1.0.md](STATIC_ASSETS_AND_CACHE_v1.0.md) (static files, `BUILD_ID`, nginx).

## Pre-Deployment (Local Development)

### 1. Verify JavaScript Changes
- [ ] Did you modify any `.js` files?
- [ ] Did you change `darkMode.js`?
- [ ] Did you update chart components (`NetworkGraph.js`, etc.)?
- [ ] Did you modify page managers (`ExplorePageManager.js`, `CabinetPageManager.js`, `AnalysisPageManager.js`)?
- [ ] Did you change files in `/core/utils/`?

### 2. Testing in Incognito Mode
- [ ] Open the site in incognito mode (Ctrl+Shift+N)
- [ ] Verify that dark mode works correctly
- [ ] Test the network graph on the analysis page
- [ ] Test filters in explore data
- [ ] Test the country combo box in strategic cabinet
- [ ] Verify there are NO errors in the browser console

### 3. Static assets & Docker image

- [ ] Production uses **`STORAGES['staticfiles']`** → `CompressedManifestStaticFilesStorage` (see `config/settings/production.py`).
- [ ] **Recommended:** do **not** set `STATIC_VERSION` in `.env.production` unless you need a fixed label; the API exposes **`build_id`** (digest of `staticfiles.json`) for client reload—see [STATIC_ASSETS_AND_CACHE_v1.0.md](STATIC_ASSETS_AND_CACHE_v1.0.md).
- [ ] Bump [`VERSION`](../VERSION) / image tag when releasing; build and push: `scripts/build-docker.ps1 -Push` or `build-docker.sh --push`.
- [ ] Pin `image: sicedia/spiderhub:<tag>` in `docker-compose.production.yml` to match what you pushed.

### 4. Verify Translations (if you added new content)
- [ ] Did you add new visible texts?
- [ ] Did you use `{% trans %}` in templates and `_()` in JavaScript?
- [ ] Did you run `makemessages` to extract strings
- [ ] Did you add translations in `locale/es/LC_MESSAGES/` and `locale/pt/LC_MESSAGES/`
- [ ] Did you compile with `compilemessages`
- [ ] Did you test in Spanish (`/es/`) and Portuguese (`/pt/`)

See: [TRANSLATION_WORKFLOW_v1.1.md](TRANSLATION_WORKFLOW_v1.1.md)

### 5. Update Documentation
- [ ] Note image tag / `VERSION` in the commit or release notes
- [ ] If it's a major change, update the changelog
- [ ] If you added translations, document which strings were added

## During Deployment

### 1. Production Configuration
- [ ] `DEBUG=False` in production
- [ ] `ALLOWED_HOSTS` correct
- [ ] Compiled `.mo` files present in `locale/*/LC_MESSAGES/`
- [ ] New image **pulled** on server (`docker compose pull`) if using Docker Hub

### 2. Build and Deploy (typical Docker Hub flow)

```bash
# Local: build + push (see scripts/build-docker.ps1)
# Server:
cd ~/spiderhub   # or your compose directory
docker compose pull
docker compose up -d
# If nginx.conf changed:
docker compose exec nginx nginx -s reload
```

### 3. Verify HTTP Headers (static)

```bash
# Hashed path in production — URL will look like .../AnalysisEntry.<hash>.js
curl -I "https://your-domain.com/static/core/js/AnalysisEntry.XXXXXXXXXXXX.js"

# Expect long-lived cache on fingerprinted assets, e.g.:
# Cache-Control: public, max-age=31536000
```

## Post-Deployment

### 1. Basic Verification
- [ ] Site loads without 500/404 errors
- [ ] No errors in browser console (F12)
- [ ] Dark mode works correctly
- [ ] Charts render correctly
- [ ] Translations work in `/es/` and `/pt/`
- [ ] Language selector works correctly

### 2. Static assets verification

1. **View source** (Ctrl+U): script/link URLs under `/static/` should show **hashed filenames** (e.g. `main.abc123def456.css`), **not** bare `main.css` with only `?v=` in production.
2. **`GET /api/v1/app/version/`**: response includes **`build_id`**; it should change when static output changes.
3. **Optional:** `docker compose exec web python manage.py validate_static_deploy` (with production settings and after `collectstatic`).

**Development (`DEBUG=True`):** URLs may still show `?v=<mtime>`—that is expected locally.

### 3. Functionality Verification
- [ ] **Network Graph**: Analysis page renders in dark/light mode
- [ ] **Explore Filters**: filters work
- [ ] **Strategic Cabinet**: country combo updates data
- [ ] **Dark Mode Toggle**: components update

### 4. If Something Goes Wrong

#### Symptom: "Users still see the old version"
```bash
curl -s https://your-domain.com/analysis/ | grep -E 'MainEntry|AnalysisEntry'
docker compose restart web
docker compose exec nginx nginx -s reload
docker compose exec web ls -la /app/staticfiles/staticfiles.json
```

#### Symptom: "Errors in console after deploy"
```bash
docker compose exec web ls -la /app/staticfiles/core/js/
docker compose exec web python manage.py collectstatic --noinput --clear   # if you run collectstatic manually
```

#### Symptom: "No staticfiles.json / no hashes"
- Confirm **`STORAGES`** in production settings—not legacy `STATICFILES_STORAGE` alone (Django 5). See [STATIC_ASSETS_AND_CACHE_v1.0.md](STATIC_ASSETS_AND_CACHE_v1.0.md).

## Quick Rollback

Redeploy the **previous Docker image tag** from Docker Hub (or load a saved image), update `docker-compose.yml` `image:` line, then `docker compose up -d`.

## Important Notes

### Chrome / ES modules
Users with **many open tabs** may still need to close tabs once; [VersionCheckService](../apps/core/static/core/js/services/VersionCheckService.js) coordinates reload using **`build_id`**.

### Service workers (future)
If you add a service worker, plan explicit cache invalidation—see static assets doc.

---

**Document Version:** v1.3  
**Created:** September 2025  
**Last Updated:** March 2026  
**Category:** Deployment & Operations
