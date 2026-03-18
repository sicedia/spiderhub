# Deployment Checklist - SPIDERHUB

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

### 3. Prepare Static Version

**Recommended (auto-reload):** Do **not** set `STATIC_VERSION` in `.env.production`. The Docker image carries `GIT_COMMIT_HASH` at build time; Django uses it for `/api/v1/app/version/`, so each deploy gets a new version and the client auto-reloads all tabs without Ctrl+Shift+R. See `docs/CACHE_BUSTING_V2_SUMMARY_v2.0.md`.

If you must pin a static version (not recommended):

```bash
# In your production .env (only if you need a fixed version)
# For minor changes: STATIC_VERSION=X.Y.(Z+1)
# For major changes: STATIC_VERSION=X.(Y+1).0
```

### 4. Verify Translations (if you added new content)
- [ ] Did you add new visible texts?
- [ ] Did you use `{% trans %}` in templates and `_()` in JavaScript?
- [ ] Did you run `makemessages` to extract strings
- [ ] Did you add translations in `locale/es/LC_MESSAGES/` and `locale/pt/LC_MESSAGES/`
- [ ] Did you compile with `compilemessages`
- [ ] Did you test in Spanish (`/es/`) and Portuguese (`/pt/`)

See: [Translation Workflow Guide](TRANSLATION_WORKFLOW.md)

### 5. Update Documentation
- [ ] Document the `STATIC_VERSION` change in the commit message
- [ ] If it's a major change, update the changelog
- [ ] If you added translations, document which strings were added

## During Deployment

### 1. Production Configuration
- [ ] For auto-reload on deploy: ensure production `.env` does **not** set `STATIC_VERSION` (so `GIT_COMMIT_HASH` from the image is used). Or if you use a fixed version, set the new `STATIC_VERSION`.
- [ ] Verify that `DEBUG=False` in production
- [ ] Verify that `ALLOWED_HOSTS` is configured correctly
- [ ] Verify that compiled `.mo` files are present in `locale/*/LC_MESSAGES/`

### 2. Build and Deploy
```bash
# If using Docker
docker-compose -f docker-compose.yml build --no-cache
docker-compose -f docker-compose.yml up -d

# Collectstatic (if necessary)
poetry run python manage.py collectstatic --noinput

# Compile translations (if you added new ones)
poetry run python manage.py compilemessages
```

### 3. Verify HTTP Headers
```bash
# Verify that JS files have cache enabled in production
curl -I https://your-domain.com/static/core/js/AnalysisEntry.js

# You should see:
# Cache-Control: public, max-age=31536000
# (in production with whitenoise/nginx)
```

## Post-Deployment

### 1. Basic Verification
- [ ] Site loads without 500/404 errors
- [ ] No errors in browser console (F12)
- [ ] Dark mode works correctly
- [ ] Charts render correctly
- [ ] Translations work in `/es/` and `/pt/`
- [ ] Language selector works correctly

### 2. Cache Busting Verification

#### Option A: Verify in HTML Source
1. Open the site in incognito mode
2. Right click > "View page source" (Ctrl+U)
3. Search for `AnalysisEntry.js` or `ExploreEntry.js`
4. Verify it has `?v=` with the new version

```html
<!-- Should look like this: -->
<script type="module" src="/static/core/js/AnalysisEntry.js?v=1.0.6"></script>
```

#### Option B: Verify in Network Tab
1. Open DevTools (F12) > Network tab
2. Reload the page (F5)
3. Search for `.js` files in the list
4. Verify that:
   - They have `?v=X.Y.Z` in the URL
   - Status is `200` (not `304 Not Modified` or `(memory cache)`)

### 3. Functionality Verification
- [ ] **Network Graph**: Open analysis page, verify graph renders with correct colors in dark/light mode
- [ ] **Explore Filters**: Open explore data, apply filters, verify they work
- [ ] **Strategic Cabinet**: Open strategic cabinet, change country in combo box, verify it updates data
- [ ] **Dark Mode Toggle**: Switch between light/dark mode, verify all components update

### 4. If Something Goes Wrong

#### Symptom: "Users still see the old version"
```bash
# 1. Verify version in HTML
curl https://your-domain.com/analysis/ | grep "AnalysisEntry.js"

# 2. Restart server
docker-compose restart web

# 3. Clear nginx cache (if applicable)
docker-compose exec nginx nginx -s reload

# 4. Verify environment variable loaded
docker-compose exec web env | grep STATIC_VERSION
```

#### Symptom: "Errors in console after deploy"
```bash
# 1. Verify all JS files copied correctly
docker-compose exec web ls -la staticfiles/core/js/

# 2. Re-run collectstatic
docker-compose exec web python manage.py collectstatic --noinput --clear

# 3. Verify permissions
docker-compose exec web ls -la staticfiles/
```

#### Symptom: "Dark mode doesn't work"
```bash
# 1. Verify darkMode.js is present
curl https://your-domain.com/static/core/js/core/utils/darkMode.js

# 2. Check browser console for import errors
# F12 > Console tab

# 3. Verify entry point version changed
# View Source > search for "ExploreEntry.js?v="
```

## Quick Rollback

If you need to revert:

```bash
# 1. Go back to previous version in git
git checkout HEAD~1

# 2. Rebuild (optional if only .env changed)
docker-compose build web

# 3. Restart
docker-compose restart web

# 4. Or simply change STATIC_VERSION to previous version
# In .env:
STATIC_VERSION=1.0.5  # version that worked

# And restart:
docker-compose restart web
```

## Important Notes

### ⚠️ Chrome Memory Cache
Chrome has a very aggressive "memory cache" for JavaScript modules. Even with correct cache busting, users who have open tabs may need to:
1. Close ALL site tabs
2. Reopen in a new tab

### ⚠️ Service Workers
If you implement service workers in the future, you'll need to invalidate their cache too:
```javascript
// In the service worker
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
**Always increment `STATIC_VERSION` when you touch JavaScript files**, even for minor changes. It's better to be conservative and force reload than to have users with mixed versions (new entry point but old modules).

---

**Document Version:** v1.2  
**Created:** September 2025  
**Last Updated:** October 2025  
**Category:** Deployment & Operations
