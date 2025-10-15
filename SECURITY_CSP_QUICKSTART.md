# CSP Security Fix - Quick Start Guide

## ✅ What Was Fixed

Mozilla Observatory identified that SpiderHub was using `'unsafe-inline'` in Content Security Policy (CSP), creating an XSS vulnerability worth -20 points.

**This has been fixed!** The application now uses secure nonce-based CSP.

## 🚀 Quick Deploy Checklist

Before deploying to production:

- [ ] **1. Test in development** (5 minutes)
  ```bash
  python manage.py runserver
  # Open http://localhost:8000/
  # Open browser console (F12)
  # Navigate through all pages
  # Verify no CSP errors in console
  ```

- [ ] **2. Check critical functionality** (10 minutes)
  - [ ] Homepage carousel works
  - [ ] Explore page search/filters work
  - [ ] Analysis page charts render (Chart.js, vis-network)
  - [ ] Language switching works
  - [ ] Document detail pages load

- [ ] **3. Deploy to production**
  ```bash
  python manage.py collectstatic --noinput
  # Deploy using your normal process
  ```

- [ ] **4. Verify Mozilla Observatory** (2 minutes)
  - Go to https://observatory.mozilla.org/
  - Enter your domain
  - Click "Scan Me"
  - **Expected:** CSP shows PASS (not -20 points)

## 📋 What Changed (Technical)

### Files Modified
1. `config/settings/production.py` - Secure CSP config with nonces
2. `config/settings/development.py` - CSP config for dev
3. `apps/core/templatetags/static_tags.py` - Template tags now include nonces
4. `apps/core/templates/core/base.html` - Updated JavaScript catalog
5. `apps/core/templates/core/analysis.html` - Added nonces to CDN scripts

### How It Works
- Django generates a unique cryptographic nonce per request
- All scripts/styles get this nonce as an attribute
- CSP header includes the nonce
- Browser only executes scripts with matching nonce
- Result: XSS protection without breaking functionality

## 🔍 Quick Verification

### 1. Check Browser Console (Development)
```
Open http://localhost:8000/
Press F12 → Console tab
✅ Good: No errors
❌ Bad: "Refused to execute inline script..."
```

### 2. Check HTML Source
```
View page source (Ctrl+U)
Look for: <script ... nonce="abc123...">
✅ All scripts should have nonce attribute
```

### 3. Check CSP Header (Production)
```
F12 → Network tab → Click HTML document → Response Headers
Look for: Content-Security-Policy: ... 'nonce-abc123...' ...
✅ Should include nonces, NOT 'unsafe-inline'
```

## 🆘 Troubleshooting

### Issue: Charts don't render on Analysis page

**Fix:** Check browser console for CSP violations. External CDN scripts need nonces.

**Verify in `apps/core/templates/core/analysis.html`:**
```django
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"
        {% if request.csp_nonce %}nonce="{{ request.csp_nonce }}"{% endif %}></script>
```

### Issue: Language switching doesn't work

**Fix:** Verify Django's JavaScript catalog has nonce.

**Verify in `apps/core/templates/core/base.html`:**
```django
{% js_catalog_nonce %}
```

### Issue: Scripts not loading at all

**Fix:** Ensure template tags are used (not plain `<script>` tags).

**Use:**
```django
{% js_module_versioned 'core/js/MainEntry.js' %}
```

**Not:**
```html
<script src="{% static 'core/js/MainEntry.js' %}"></script>
```

## 📚 Full Documentation

- **Implementation Details:** `docs/CSP_IMPLEMENTATION.md`
- **Complete Testing Guide:** `docs/CSP_TESTING_GUIDE.md`
- **Full Summary:** `CSP_IMPLEMENTATION_SUMMARY.md`

## ⚡ Emergency Rollback

If critical issues occur in production:

1. Edit `config/settings/production.py`:
   ```python
   # Line 147 - add 'unsafe-inline' back temporarily
   'script-src': ("'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", ...),
   ```

2. Redeploy

3. Investigate issue using browser console

4. Fix and re-apply strict CSP

## ✨ Expected Results

### Before
```
Mozilla Observatory: -20 points
Content Security Policy: FAILED
- 'unsafe-inline' in script-src
```

### After
```
Mozilla Observatory: 0 points (or better)
Content Security Policy: PASSED
- No 'unsafe-inline'
- Secure nonce-based execution
```

## 🎯 Success Criteria

Implementation is successful when:
- ✅ All pages load without CSP violations
- ✅ All JavaScript works (charts, search, filters)
- ✅ Mozilla Observatory shows CSP: PASS
- ✅ No console errors
- ✅ Language switching works

## 🔐 Security Benefit

**Before:** Attackers could inject and execute arbitrary JavaScript
**After:** Only scripts with valid nonces execute (generated server-side per request)

**Result:** Significantly reduced XSS attack surface

---

**Ready to deploy?** Start with the Quick Deploy Checklist above ⬆️

