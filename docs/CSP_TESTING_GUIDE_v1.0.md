# CSP Implementation Testing Guide

## Pre-Deployment Testing Checklist

### 1. Development Environment Testing

#### Setup
```bash
# Ensure you're using development settings
export DJANGO_SETTINGS_MODULE=config.settings.development

# Start the development server
poetry run python manage.py runserver
```

#### Page-by-Page Testing

##### Homepage (http://localhost:8000/)
- [ ] Page loads without errors
- [ ] No CSP violations in browser console
- [ ] Carousel navigation works (next/previous buttons)
- [ ] Counter animations display correctly
- [ ] Language switcher dropdown opens and functions
- [ ] All images load correctly
- [ ] Main navigation links work

**Check browser console for errors:**
```
Press F12 → Console tab
Look for messages starting with "Refused to execute" or "Refused to load"
```

##### Explore Page (http://localhost:8000/explore/)
- [ ] Page loads without CSP violations
- [ ] Search box accepts input
- [ ] Search suggestions appear
- [ ] Filters can be opened/collapsed
- [ ] Filter checkboxes work
- [ ] "Apply Filters" button works
- [ ] Results load and display
- [ ] Pagination controls work
- [ ] Document cards are clickable

**Expected JavaScript modules:**
- ExploreEntry.js
- layout-fix.js

##### Analysis Dashboard (http://localhost:8000/analysis/)
- [ ] Page loads without CSP violations
- [ ] **External CDN scripts load:**
  - Chart.js (check for charts rendering)
  - chartjs-chart-treemap (check for treemap chart)
  - vis-network (check for network graph)
- [ ] Network graph displays and is interactive
- [ ] SDG Alignment radar chart renders
- [ ] Legal Framework chart renders
- [ ] Leading Countries bar chart renders
- [ ] Thematic Focus chart renders
- [ ] Actor Types chart renders
- [ ] Beneficiary Groups chart renders
- [ ] Hover tooltips work on all charts
- [ ] Charts are responsive

**Critical checks:**
```javascript
// In browser console, verify external libraries loaded:
typeof Chart !== 'undefined'  // Should return true
typeof vis !== 'undefined'    // Should return true
```

##### Document Detail Page (http://localhost:8000/documents/<id>/)
- [ ] Page loads without CSP violations
- [ ] Document details display
- [ ] Related documents sidebar shows
- [ ] "Export PDF" button works
- [ ] "Back to Results" link works
- [ ] All SVG icons display
- [ ] JavaScript modules load:
  - MainEntry.js
  - DocumentDetailEntry.js

##### About Page & Other Pages
- [ ] All static pages load without CSP violations
- [ ] Strategic Cabinet page loads correctly
- [ ] All navigation links work

#### Language Switching Test
1. [ ] Click language switcher
2. [ ] Select different language (ES, PT, EN)
3. [ ] Verify Django JavaScript catalog loads with nonce
4. [ ] Verify translations work
5. [ ] No CSP violations when switching languages

**Check in Network tab:**
```
Look for /jsi18n/ request
Verify it has 200 status
Check Response Headers include Content-Security-Policy
```

### 2. Browser Console Verification

Open Developer Tools (F12) and check for:

#### ✅ Good - No Issues
```
# Console should be clean or only show informational logs
# No CSP-related errors
```

#### ❌ Bad - CSP Violation Example
```
Refused to execute inline script because it violates the following 
Content Security Policy directive: "script-src 'self' 'nonce-XYZ...'". 
Either the 'unsafe-inline' keyword, a hash, or a nonce is required.
```

If you see this, check which script is failing and ensure it has the correct nonce.

### 3. Network Tab Verification

#### Check CSP Headers

1. Open Developer Tools → Network tab
2. Refresh the page
3. Click on the document (HTML) request
4. Check Response Headers

**Expected Production Header:**
```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'nonce-abc123...' https://cdn.jsdelivr.net https://d3js.org https://unpkg.com; 
  style-src 'self' 'nonce-abc123...' https://fonts.googleapis.com https://unpkg.com; 
  object-src 'none'; 
  base-uri 'self'; 
  form-action 'self'; 
  frame-ancestors 'none'
```

**Key points to verify:**
- ✅ `script-src` has `'nonce-XYZ...'` but NOT `'unsafe-inline'`
- ✅ `style-src` has `'nonce-XYZ...'` but NOT `'unsafe-inline'`
- ✅ `object-src 'none'` present
- ✅ `frame-ancestors 'none'` present
- ✅ `form-action 'self'` present

#### Check Script Loading

Filter network requests by "JS" and verify:
- [ ] All local JavaScript files have `?v=` parameter (cache busting)
- [ ] External CDN scripts load successfully (200 status)
- [ ] Django JavaScript catalog (/jsi18n/) loads (200 status)

### 4. Nonce Verification

#### Check HTML Source

View page source (Ctrl+U) and verify nonces are present:

**✅ Correct - Scripts have nonces:**
```html
<script src="/jsi18n/" nonce="a1b2c3d4..."></script>
<script type="module" src="/static/core/js/MainEntry.js?v=123" nonce="a1b2c3d4..."></script>
<link rel="stylesheet" href="/static/core/css/main.css?v=123" nonce="a1b2c3d4...">
```

**❌ Wrong - No nonces:**
```html
<script src="/jsi18n/"></script>
<script type="module" src="/static/core/js/MainEntry.js?v=123"></script>
```

**Important:** All nonces on the same page should have the same value (they're generated once per request).

#### Verify Nonce Uniqueness

Refresh the page multiple times and check that nonces change with each request:
- Request 1: `nonce="abc123..."`
- Request 2: `nonce="xyz789..."` (different from Request 1)

### 5. Structured Data Verification

Check that JSON-LD structured data (in `<head>`) is NOT affected by CSP:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  ...
}
</script>
```

This should work without nonce because `type="application/ld+json"` is exempt from script-src CSP.

## Production Environment Testing

### Pre-Deployment Steps

1. **Update environment variables** (if needed):
   ```bash
   # Optional: Set CSP reporting endpoint
   CSP_REPORT_URI=https://your-domain.com/csp-report/
   ```

2. **Run collectstatic**:
   ```bash
   poetry run python manage.py collectstatic --noinput
   ```

3. **Check production settings**:
   ```python
   # Verify in config/settings/production.py
   DEBUG = False
   CSP_INCLUDE_NONCE_IN = ['script-src', 'style-src', 'style-src-elem', 'style-src-attr']
   ```

### Post-Deployment Verification

#### 1. Smoke Tests

Visit each major page and verify:
- [ ] Homepage loads
- [ ] Explore page loads and search works
- [ ] Analysis page loads with all charts
- [ ] Document detail pages load
- [ ] No visible errors or broken functionality

#### 2. Mozilla Observatory Scan

**Run the scan:**
1. Go to https://observatory.mozilla.org/
2. Enter your production domain
3. Click "Scan Me"
4. Wait for results (may take 1-2 minutes)

**Expected Results:**

✅ **Content Security Policy (CSP): PASS**
- Score: 0 (or positive)
- No longer -20 penalty
- Details should show:
  - ✅ `script-src` does not contain `'unsafe-inline'`
  - ✅ `style-src` does not contain `'unsafe-inline'`
  - ✅ `object-src` is set to `'none'`
  - ✅ `frame-ancestors` is present

**Before fix (Expected):**
```
Content Security Policy (CSP): FAILED (-20 points)
- 'unsafe-inline' found in script-src
- 'unsafe-inline' found in style-src
```

**After fix (Expected):**
```
Content Security Policy (CSP): PASSED (0 points)
- CSP implemented correctly
- No unsafe directives found
```

#### 3. Security Headers Check

Use https://securityheaders.com/ to verify all security headers:

**Expected Headers:**
- Content-Security-Policy: ✅ (A+ or A)
- Strict-Transport-Security: ✅
- X-Content-Type-Options: ✅
- X-Frame-Options: ✅ (or replaced by CSP frame-ancestors)

### 6. Cross-Browser Testing

Test in multiple browsers to ensure compatibility:

#### Chrome/Edge (Chromium)
- [ ] Homepage works
- [ ] Charts render on analysis page
- [ ] No CSP violations in console
- [ ] Language switching works

#### Firefox
- [ ] Homepage works
- [ ] Charts render on analysis page
- [ ] No CSP violations in console
- [ ] Language switching works

#### Safari (if available)
- [ ] Homepage works
- [ ] Charts render on analysis page
- [ ] No CSP violations in console
- [ ] Language switching works

**Note:** Safari may have different CSP behavior; verify carefully.

### 7. Mobile Testing

Test on mobile devices or browser dev tools mobile emulation:
- [ ] Pages load correctly
- [ ] Navigation menu works (mobile hamburger)
- [ ] Charts are responsive
- [ ] Touch interactions work
- [ ] No CSP violations

## Troubleshooting Guide

### Issue: Charts Don't Render on Analysis Page

**Symptoms:**
- Empty chart containers
- Console error: "Refused to load script..."

**Solution:**
1. Check that external scripts have nonces:
   ```django
   {% if request.csp_nonce %}nonce="{{ request.csp_nonce }}"{% endif %}
   ```

2. Verify CDN URLs are in CSP `script-src`:
   ```python
   'script-src': ("'self'", "https://cdn.jsdelivr.net", "https://unpkg.com", ...),
   ```

### Issue: Language Switching Doesn't Work

**Symptoms:**
- Translations don't load
- Console error about /jsi18n/

**Solution:**
1. Verify `{% js_catalog_nonce %}` is used in base.html
2. Check that JavaScript catalog URL is correct
3. Verify nonce is being applied to the script tag

### Issue: Inline Styles Not Working

**Symptoms:**
- Some elements appear unstyled
- Console: "Refused to apply inline style..."

**Solution:**

**Development:** Should work (unsafe-inline allowed for styles)

**Production:** 
1. Move inline styles to external CSS
2. Or use CSS classes instead of inline styles
3. Or add `'unsafe-hashes'` to `style-src-attr` (not recommended)

### Issue: External Resources Blocked

**Symptoms:**
- Images, fonts, or APIs don't load
- Console: "Refused to load..."

**Solution:**
1. Add the domain to appropriate CSP directive:
   - Images: `img-src`
   - Fonts: `font-src`
   - AJAX requests: `connect-src`

2. Example:
   ```python
   'img-src': ("'self'", "data:", "https://new-cdn.com"),
   ```

## Performance Checks

After CSP implementation, verify no performance degradation:

### Lighthouse Audit
1. Open Chrome DevTools → Lighthouse tab
2. Run audit (Performance, Accessibility, Best Practices, SEO)
3. Verify scores remain high

**Expected:**
- Performance: 90+ (should not change)
- Best Practices: 95+ (may improve due to better CSP)
- Security: Improved

### Load Time
- [ ] Homepage loads in < 2 seconds
- [ ] Analysis page (with charts) loads in < 3 seconds
- [ ] No increase in load times compared to before CSP changes

## Monitoring in Production

### Set Up CSP Reporting (Optional but Recommended)

1. Create CSP report endpoint:
   ```python
   # In your Django app
   @csrf_exempt
   def csp_report(request):
       if request.method == 'POST':
           report = json.loads(request.body)
           logger.warning(f"CSP Violation: {report}")
           return JsonResponse({'status': 'ok'})
   ```

2. Add to URLs:
   ```python
   path('csp-report/', csp_report, name='csp_report'),
   ```

3. Update CSP settings:
   ```python
   CSP_REPORT_URI = '/csp-report/'
   ```

4. Monitor logs for violations

### Periodic Scans

Schedule monthly scans:
- [ ] Mozilla Observatory
- [ ] SecurityHeaders.com
- [ ] Manual browser testing

## Rollback Procedure

If critical issues arise in production:

### Emergency Rollback (Restore 'unsafe-inline')

Edit `config/settings/production.py`:

```python
# TEMPORARY EMERGENCY ROLLBACK - FIX ASAP
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'script-src': ("'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", ...),
        'style-src': ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com", ...),
        # ... rest of config
    }
}
# Comment out or remove:
# CSP_INCLUDE_NONCE_IN = [...]
```

Redeploy immediately.

**Then:**
1. Investigate root cause
2. Fix the specific issue
3. Re-apply strict CSP
4. Test thoroughly before deploying again

## Success Criteria

The implementation is successful when:

- ✅ All pages load without CSP violations
- ✅ All JavaScript functionality works (charts, filters, search, etc.)
- ✅ Language switching works correctly
- ✅ Mozilla Observatory shows CSP: PASS (no 'unsafe-inline')
- ✅ No console errors in major browsers
- ✅ External libraries (Chart.js, vis-network) load and work
- ✅ Nonces are unique per request
- ✅ Nonces are present on all script and style tags
- ✅ Form submissions work
- ✅ PDF exports work
- ✅ Mobile responsiveness maintained

## Documentation Updates

After successful deployment:

1. Update README.md with CSP notes
2. Document any new CSP exceptions added
3. Create runbook for CSP troubleshooting
4. Train team on CSP best practices
5. Add CSP verification to CI/CD pipeline (if applicable)

## Contact & Support

For issues or questions about CSP implementation:
- Review: docs/CSP_IMPLEMENTATION.md
- Check browser console for specific errors
- Verify nonces in HTML source
- Test in different browsers
- Check Mozilla Observatory report details

---

**Document Version:** v1.0  
**Created:** October 16, 2025  
**Last Updated:** October 16, 2025  
**Category:** Security & Testing  
**Related:** CSP_IMPLEMENTATION.md

