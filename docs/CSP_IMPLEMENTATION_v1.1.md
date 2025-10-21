# Content Security Policy (CSP) Implementation Guide

## Overview

This document describes the implementation of secure Content Security Policy (CSP) for the SpiderHub project. The implementation removes `'unsafe-inline'` from CSP directives and uses cryptographic nonces to allow specific inline scripts and styles.

## What Changed

### Security Improvements

1. **Removed `'unsafe-inline'` from `script-src`**: This prevents arbitrary inline JavaScript execution, significantly reducing XSS attack surface
2. **Removed `'unsafe-inline'` from `style-src`**: Enhances protection against CSS-based attacks
3. **Added nonce-based script execution**: Scripts are now allowed using per-request cryptographic nonces
4. **Added additional CSP directives**: `form-action` and `frame-ancestors` for enhanced security

### Files Modified

#### 1. `config/settings/production.py`
- Updated `CONTENT_SECURITY_POLICY` configuration to remove `'unsafe-inline'`
- Added `CSP_INCLUDE_NONCE_IN` to enable nonce generation for scripts and styles
- Added `form-action` and `frame-ancestors` directives

#### 2. `config/settings/development.py`
- Added `CONTENT_SECURITY_POLICY` configuration for development
- Uses nonces for scripts (matching production behavior)
- Allows `'unsafe-inline'` for styles to ease development debugging
- Added `CSP_INCLUDE_NONCE_IN` for script nonces

#### 3. `apps/core/templatetags/static_tags.py`
- Updated `css_versioned()` to accept context and include CSP nonces
- Updated `js_versioned()` to accept context and include CSP nonces
- Updated `js_module_versioned()` to accept context and include CSP nonces
- Added new `js_catalog_nonce()` template tag for Django's JavaScript catalog
- Added `reverse` import for URL generation

#### 4. `apps/core/templates/core/base.html`
- Replaced direct `<script src="{% url 'javascript-catalog' %}">` with `{% js_catalog_nonce %}`
- Ensures Django's i18n catalog loads with proper CSP nonce

#### 5. `apps/core/templates/core/analysis.html`
- Added `{% if request.csp_nonce %}nonce="{{ request.csp_nonce }}"{% endif %}` to external CDN scripts
- Applies to Chart.js, chartjs-chart-treemap, and vis-network libraries

## How It Works

### Nonce-Based CSP

1. **Nonce Generation**: The `django-csp` middleware automatically generates a unique cryptographic nonce for each HTTP request when `CSP_INCLUDE_NONCE_IN` is configured

2. **Nonce Distribution**: The nonce is:
   - Added to the `Content-Security-Policy` HTTP header (e.g., `script-src 'nonce-abc123...'`)
   - Made available in templates as `request.csp_nonce`

3. **Script/Style Approval**: Only scripts and styles with a matching nonce attribute are allowed to execute:
   ```html
   <!-- ✅ Allowed - has matching nonce -->
   <script src="/static/app.js" nonce="abc123"></script>
   
   <!-- ❌ Blocked - no nonce -->
   <script src="/static/malicious.js"></script>
   ```

### Template Tag Usage

All template tags now automatically include nonces:

```django
{# CSS with nonce #}
{% css_versioned 'core/css/main.css' %}
{# Outputs: <link rel="stylesheet" href="/static/core/css/main.css?v=123" nonce="abc123"> #}

{# JavaScript with nonce #}
{% js_versioned 'core/js/app.js' %}
{# Outputs: <script src="/static/core/js/app.js?v=123" nonce="abc123"></script> #}

{# JavaScript module with nonce #}
{% js_module_versioned 'core/js/MainEntry.js' %}
{# Outputs: <script type="module" src="/static/core/js/MainEntry.js?v=123" nonce="abc123"></script> #}

{# Django i18n catalog with nonce #}
{% js_catalog_nonce %}
{# Outputs: <script src="/jsi18n/" nonce="abc123"></script> #}
```

### External CDN Scripts

External scripts from trusted CDNs also receive nonces:

```django
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js" 
        crossorigin="anonymous"
        {% if request.csp_nonce %}nonce="{{ request.csp_nonce }}"{% endif %}></script>
```

## CSP Configuration

### Production (`config/settings/production.py`)

```python
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        'script-src': ("'self'", "https://cdn.jsdelivr.net", "https://d3js.org", "https://unpkg.com"),
        'style-src': ("'self'", "https://fonts.googleapis.com", "https://unpkg.com"),
        'style-src-elem': ("'self'", "https://fonts.googleapis.com", "https://unpkg.com"),
        'style-src-attr': ("'self'",),
        'img-src': ("'self'", "data:", "https://*.tile.openstreetmap.org", "https://unpkg.com"),
        'font-src': ("'self'", "data:", "https://fonts.gstatic.com"),
        'connect-src': ("'self'", "https://cdn.jsdelivr.net", "https://d3js.org", "https://raw.githubusercontent.com", "https://unpkg.com", "https://leafletjs.com"),
        'frame-src': ("'none'",),
        'object-src': ("'none'",),
        'base-uri': ("'self'",),
        'form-action': ("'self'",),
        'frame-ancestors': ("'none'",),
    }
}

CSP_INCLUDE_NONCE_IN = ['script-src', 'style-src', 'style-src-elem', 'style-src-attr']
```

### Development (`config/settings/development.py`)

```python
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        'script-src': ("'self'", "https://cdn.jsdelivr.net", "https://d3js.org", "https://unpkg.com"),
        'style-src': ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"),
        # ... other directives
    }
}

CSP_INCLUDE_NONCE_IN = ['script-src']  # Only scripts in development
```

## Testing

### Manual Testing Checklist

1. **Homepage** (`/`)
   - [ ] Page loads without CSP violations
   - [ ] Carousel functionality works
   - [ ] Counter animations work
   - [ ] Language switcher works

2. **Explore Page** (`/explore/`)
   - [ ] Search functionality works
   - [ ] Filters can be applied
   - [ ] Results load correctly
   - [ ] Pagination works

3. **Analysis Dashboard** (`/analysis/`)
   - [ ] Chart.js charts render correctly
   - [ ] Network graph displays
   - [ ] All visualizations are interactive
   - [ ] No CSP violations in console

4. **Document Detail** (`/documents/<id>/`)
   - [ ] Page loads correctly
   - [ ] Related documents display
   - [ ] PDF export works

5. **Language Switching**
   - [ ] Language can be changed
   - [ ] JavaScript catalog loads with correct nonce
   - [ ] Translations work correctly

### Browser Console Checks

Open browser developer tools (F12) and check the Console tab:

**✅ Good - No CSP violations:**
```
No errors related to Content Security Policy
```

**❌ Bad - CSP violation example:**
```
Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self' ...". Either the 'unsafe-inline' keyword, a hash ('sha256-...'), or a nonce ('nonce-...') is required to enable inline execution.
```

### Automated Testing

Check CSP headers using browser developer tools:

1. Open Developer Tools (F12)
2. Go to Network tab
3. Refresh the page
4. Click on the document request
5. Check Response Headers for `Content-Security-Policy`

**Expected header format:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-XYZ123...' https://cdn.jsdelivr.net; ...
```

### Mozilla Observatory

Run a security scan at https://observatory.mozilla.org/

**Expected Results:**
- CSP score: Pass (no longer -20 points)
- No `'unsafe-inline'` in `script-src`
- No `'unsafe-inline'` in `style-src`

## Troubleshooting

### Scripts Not Loading

**Symptom**: JavaScript files don't execute, console shows CSP violation

**Solution**: Ensure template tags use `takes_context=True` and templates pass context:
```django
{# ✅ Correct #}
{% js_module_versioned 'core/js/app.js' %}

{# ❌ Wrong - missing context (old usage) #}
{% load static %}
<script src="{% static 'core/js/app.js' %}"></script>
```

### External Scripts Blocked

**Symptom**: CDN scripts (Chart.js, etc.) don't load

**Solution**: Ensure external scripts have nonce attribute:
```django
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"
        {% if request.csp_nonce %}nonce="{{ request.csp_nonce }}"{% endif %}></script>
```

### Inline Styles Not Working

**Symptom**: Inline `style=""` attributes don't apply

**Solution**: 
- **Development**: `'unsafe-inline'` is allowed for styles
- **Production**: Move styles to external CSS or use `style-src-attr` with specific hashes (not recommended)

### Django Admin Issues

**Symptom**: Django admin panel doesn't load correctly

**Solution**: Django admin has its own CSP considerations. The middleware applies to all pages. You may need to:
1. Add admin-specific CSP exceptions
2. Or exclude admin URLs from CSP (not recommended)

## Best Practices

### Adding New Scripts

When adding new JavaScript:

1. **Use template tags** for local scripts:
   ```django
   {% js_module_versioned 'core/js/new-feature.js' %}
   ```

2. **Add nonce to external scripts**:
   ```django
   <script src="https://cdn.example.com/library.js"
           {% if request.csp_nonce %}nonce="{{ request.csp_nonce }}"{% endif %}></script>
   ```

3. **Update CSP if needed**: If loading from a new CDN, add it to `script-src` in settings

### Adding New Styles

1. **Use template tags** for local styles:
   ```django
   {% css_versioned 'core/css/new-styles.css' %}
   ```

2. **External styles** (fonts, etc.):
   ```django
   <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
   ```

### Inline Scripts (Avoid)

❌ **Don't do this:**
```html
<script>
  console.log('Inline script');
</script>
```

✅ **Do this instead:**
```html
<!-- In template -->
<div id="app" data-config="{{ config|safe }}"></div>

<!-- In external JS file -->
const config = JSON.parse(document.getElementById('app').dataset.config);
```

Or use Django's `json_script` template filter:
```django
{{ data|json_script:"data-id" }}
```

## Monitoring

### CSP Reporting

Enable CSP violation reporting by setting environment variable:

```bash
CSP_REPORT_URI=https://your-reporting-endpoint.com/csp-violations
```

This sends violation reports to your endpoint, allowing you to:
- Monitor CSP violations in production
- Identify compatibility issues
- Detect potential XSS attempts

### Logging

CSP violations appear in browser console. For production monitoring:
1. Use CSP reporting endpoint
2. Monitor application logs for CSP-related errors
3. Use Mozilla Observatory for periodic security audits

## References

- [Content Security Policy (CSP) - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [django-csp Documentation](https://django-csp.readthedocs.io/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

## Migration Notes

### For Developers

When working on this project:
- All scripts must use the `{% js_versioned %}` or `{% js_module_versioned %}` template tags
- External scripts need the nonce conditional
- Inline scripts are not allowed (use external JS files or data attributes)
- Check browser console for CSP violations during development

### For Deployment

No changes needed to deployment process. The CSP is configured in settings and applied automatically by middleware.

### Rollback Plan

If issues arise, you can temporarily revert CSP to a more permissive policy:

1. Re-add `'unsafe-inline'` to `script-src` in production settings
2. Remove `CSP_INCLUDE_NONCE_IN` temporarily
3. Investigate and fix specific CSP violations
4. Re-enable strict CSP

**Not recommended for production**, but useful for emergency debugging.

---

**Document Version:** v1.1  
**Created:** October 15, 2025  
**Last Updated:** October 16, 2025  
**Category:** Security & CSP  
**Related:** CSP_TESTING_GUIDE.md, SECURITY_CSP_QUICKSTART.md

