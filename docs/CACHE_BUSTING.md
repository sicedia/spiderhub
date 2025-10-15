# Cache Busting for Static Files

## Problem
Browsers cache CSS, JS, and image files. When you modify these files, users need to do Ctrl+Shift+R to see the changes.

### ⚠️ Specific Problem with ES6 Modules
Modern browsers (Chrome, Firefox, Edge) have an **extremely aggressive cache** for ES6 modules (`import`/`export`). This means that:

- The entry point can have versioning: `AnalysisEntry.js?v=123456` ✅
- But internal imports DON'T: `import { darkModeManager } from './darkMode.js'` ❌
- The browser caches `darkMode.js` regardless of whether you change the entry point version
- Result: Users need to do **Ctrl+Shift+R** (hard refresh) to see changes in dark mode, charts, filters, etc.

**Commonly affected files:**
- `darkMode.js` - Dark mode style changes
- `NetworkGraph.js` - Network graph changes
- `ExplorePageManager.js` - Explore filter changes
- `CabinetPageManager.js` - Strategic Cabinet country combo box changes

## Implemented Solution

### For Development
- **Improved anti-cache middleware**: Extra aggressive HTTP headers specifically for `.js` files
- **Automatic versioning**: Uses file modification date as version
- **Custom template tags**: `{% static_versioned %}`, `{% css_versioned %}`, `{% js_versioned %}`
- **Special headers for ES6 modules**: `Clear-Site-Data`, `Vary`, `no-store`, `proxy-revalidate`

### For Production
- **Static version**: Uses `STATIC_VERSION` environment variable
- **Browser cache enabled**: For better performance
- **IMPORTANT**: When deploying, **ALWAYS increment `STATIC_VERSION`** to force reload of all modules

## Usage

### In Templates
```html
{% load static_tags %}

<!-- CSS with versioning -->
{% css_versioned 'core/css/base.css' %}

<!-- Regular JavaScript with versioning -->
{% js_versioned 'core/js/script.js' %}

<!-- Module JavaScript with versioning -->
{% js_module_versioned 'core/js/main.js' %}

<!-- Static files with versioning -->
<img src="{% static_versioned 'images/logo.png' %}" alt="Logo">
```

### Management Commands
```bash
# Generate new version for production
python manage.py update_static_version

# Use specific version
python manage.py update_static_version --version "2.1.0"
```

## Results

### Development
- URL: `/static/core/css/base.css?v=1672854123` (modification timestamp)
- Automatic ultra-aggressive anti-cache headers for `.js` files
- **Should** work without Ctrl+Shift+R in most cases
- If you still see cache: Close and reopen browser, or use incognito mode for testing

### Production
- URL: `/static/core/css/base.css?v=1.0.0` (configured version)
- Browser cache enabled for performance
- Update `STATIC_VERSION` for new versions

## Environment Variable Configuration

### Production
```env
STATIC_VERSION=1.0.0
```

**⚠️ IMPORTANT for deployments:**

When deploying with JavaScript changes (especially dark mode, components, utils), **ALWAYS increment `STATIC_VERSION`**:

```bash
# Version increment example
# Before
STATIC_VERSION=1.0.0

# After (minor changes - bugfixes, dark mode, styles)
STATIC_VERSION=1.0.1

# Or (major changes - new features)
STATIC_VERSION=1.1.0
```

This forces reload of **ALL** static files, including imported ES6 modules.

## Best Practices

### During Development
1. **If you see persistent cache**: Close ALL site tabs and reopen
2. **For clean testing**: Use incognito mode (Ctrl+Shift+N)
3. **DevTools open**: In Chrome DevTools > Network, check "Disable cache" during development
4. **Verify headers**: In Network tab, verify that `.js` files have `Cache-Control: no-store`

### Before Deploying
1. ✅ **ALWAYS increment `STATIC_VERSION`** if you touched JavaScript files
2. ✅ Verify that `config/settings/production.py` uses `STATIC_VERSION` correctly
3. ✅ Test in incognito mode before deploying
4. ✅ Document the version change in commit/PR

### Files that ALWAYS require version increment
- ❗ `darkMode.js` - Affects ALL charts and components
- ❗ `Logger.js` - Used by the entire application
- ❗ Any file in `/core/utils/` - They are shared
- ❗ Chart components (`NetworkGraph.js`, etc.)
- ❗ Page managers (`ExplorePageManager.js`, `CabinetPageManager.js`, `AnalysisPageManager.js`)

## Troubleshooting

### "I updated STATIC_VERSION but still see the old version"
- Verify that production .env has the correct value
- Restart server/container to load the new variable
- Clear nginx/proxy cache if using one
- Verify in HTML source that `?v=` has the new value

### "In development I still need Ctrl+Shift+R"
- Close ALL site tabs
- Use incognito mode for testing
- Verify that `DEBUG=True` in settings
- Verify that `NoCacheMiddleware` middleware is in `MIDDLEWARE` in settings
- Check DevTools > Network to confirm headers are `no-store, no-cache`

### "Only some .js files have cache problems"
- It's normal with ES6 modules - Chrome has per-file cache
- Make sure middleware is active
- Try closing the browser completely and reopening
- As a last resort: DevTools > Application > Clear storage > Clear site data

---

## 🚀 Improved Cache Busting System (v2.0)

### ✨ New Features

#### 1. **Content Hash in Production**
The system now generates **MD5 content hashes** for each file in production:

```html
<!-- Before -->
<script src="/static/core/js/ExploreEntry.js?v=1.0.0"></script>

<!-- Now -->
<script src="/static/core/js/ExploreEntry.js?v=a1b2c3d4e5f6"></script>
```

**Advantages:**
- ✅ Each file has its own unique version
- ✅ Only changes when file content changes
- ✅ No need to manually increment `STATIC_VERSION`
- ✅ Works automatically on deploy

#### 2. **Docker Build Integration**
The Dockerfile now captures build information:

```dockerfile
ARG BUILD_DATE          # Build date/time
ARG GIT_COMMIT_HASH    # Git commit hash
ARG VERSION            # Project version
```

These variables are available in the Django application and used as fallback if file hash cannot be generated.

#### 3. **Improved Build Scripts**

**For Windows (PowerShell):**
```powershell
.\scripts\build-docker.ps1 -Version "0.1.0-rc.6"
```

**For Linux/Mac (Bash):**
```bash
./scripts/build-docker.sh 0.1.0-rc.6
```

These scripts automatically:
- Get current Git commit hash
- Capture build date/time
- Pass these values to Docker build
- Generate unique versions for cache busting

### 📋 New Deploy Workflow

#### Step 1: Docker Build
```powershell
# Windows
.\scripts\build-docker.ps1 -Version "0.1.0-rc.6"

# Linux/Mac  
./scripts/build-docker.sh 0.1.0-rc.6
```

#### Step 2: Push to Registry
```bash
docker push sicedia/spiderhub:0.1.0-rc.6
docker push sicedia/spiderhub:latest
```

#### Step 3: Deploy
The container already includes all cache busting information:
- Git hash: `GIT_COMMIT_HASH` env var
- Build date: `BUILD_DATE` env var
- Content hash: calculated automatically

**No more need to manually update `STATIC_VERSION`!**

### 🎯 System Behavior

#### In Development (`DEBUG=True`)
- Uses file **modification timestamp**
- Updates automatically on each save
- Ultra-aggressive anti-cache headers

#### In Production (`DEBUG=False`)
1. **First option**: MD5 hash of file content (12 characters)
2. **Second option**: Git commit hash from `GIT_COMMIT_HASH`
3. **Third option**: Build timestamp from `BUILD_DATE`
4. **Fallback**: Current timestamp

### 📊 Example of Generated Versions

```html
<!-- CSS -->
<link rel="stylesheet" href="/static/core/css/tokens.css?v=f3a1b2c4d5e6">

<!-- JavaScript Modules -->
<script type="module" src="/static/core/js/ExploreEntry.js?v=9d8c7b6a5f4e"></script>

<!-- Hash only changes if file content changes -->
```

### ✅ Advantages of the New System

1. **Automatic**: No manual intervention required
2. **Precise**: Only invalidates cache of modified files
3. **Efficient**: Unchanged files keep their cache
4. **Traceable**: Includes Git information in each build
5. **Reliable**: Multiple fallbacks to ensure unique versions

### 🔧 Recommended Configuration

You no longer need to manually configure `STATIC_VERSION`. The system handles it automatically using:

```python
# config/settings/production.py
STATIC_VERSION = os.getenv(
    'STATIC_VERSION', 
    os.getenv('GIT_COMMIT_HASH', str(int(time.time())))[:12]
)
```

### 📝 Important Notes

1. **After `collectstatic`**: Hashes are calculated from `STATIC_ROOT`
2. **In-memory cache**: Hashes are cached for better performance
3. **Automatic invalidation**: If a file changes, its hash is recalculated
4. **WhiteNoise compatible**: Works with compression system

### 🎉 Result

**You no longer need to:**
- ❌ Manually increment `STATIC_VERSION`
- ❌ Remember to change versions before deploy
- ❌ Worry about old file cache
- ❌ Force users to do Ctrl+Shift+R

**The system guarantees:**
- ✅ Users always see the latest version
- ✅ Efficient cache for unchanged files
- ✅ Complete traceability of each version
- ✅ Simpler and more reliable deploy
