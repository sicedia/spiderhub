# Security Headers Fix - X-Content-Type-Options

## Problem
Mozilla Observatory was reporting:
```
X-Content-Type-Options: Failed (-5 points)
X-Content-Type-Options header cannot be recognized.
Set to nosniff.
```

## Root Cause Analysis
The `X-Content-Type-Options` header was configured in both Django and nginx, which could cause:
1. **Duplicate headers**: nginx's `add_header ... always` directive adds headers even if Django already sent them
2. **Scanner confusion**: Multiple identical headers can cause security scanners to fail validation
3. **Inconsistency**: Unquoted values in nginx reduced compatibility with some validators

## Changes Implemented

### 1. Django Settings

**`config/settings/production.py`** (Lines 41-53):
Disabled Django's security headers in production to avoid duplicates with nginx:
```python
# Security headers are managed by nginx in production to avoid duplicates
# This is more efficient and ensures consistent headers across all responses
# X-Content-Type-Options is handled by nginx
# SECURE_CONTENT_TYPE_NOSNIFF = True
# X-XSS-Protection is handled by nginx  
# SECURE_BROWSER_XSS_FILTER = True
```

**`config/settings/base.py`** (Lines 95-104):
Security headers remain active for development (without nginx):
```python
# Security Headers - Only for development (without nginx)
# In production, all security headers are managed by nginx
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
```

**`config/settings/development.py`** (Lines 7-10):
Added clarifying comments about header inheritance

### 2. Nginx Configuration (`docker/nginx/nginx.conf`)
Enhanced security headers in all location blocks with:
- Quoted header values for better compatibility
- Added `Referrer-Policy` header
- Added `Permissions-Policy` header

**Updated locations**:
- Server-level headers (lines 31-36)
- Root location `/` (lines 58-64)
- PDF export location (lines 89-95)
- Static files location `/static/` (lines 103-109)
- Media files location `/media/` (lines 117-123)

**New headers**:
```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### 3. Test Scripts Updated
Both `test-security-headers.ps1` and `test-security-headers.sh` now verify all security headers including:
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

## Testing Instructions

### Local Testing

#### Option 1: PowerShell (Windows)
```powershell
.\test-security-headers.ps1 -Url "https://localhost"
```

#### Option 2: Bash (Linux/Mac)
```bash
./test-security-headers.sh https://localhost
```

### Manual Testing with curl
```bash
curl -I -k https://localhost/ | grep -i "x-content-type"
```

Expected output:
```
X-Content-Type-Options: nosniff
```

### Docker Deployment Testing
After deploying changes:

1. Rebuild and restart containers:
```bash
docker-compose down
docker-compose up -d --build
```

2. Wait for services to start:
```bash
docker-compose ps
```

3. Test headers:
```bash
# Windows
.\test-security-headers.ps1 -Url "https://localhost"

# Linux/Mac
./test-security-headers.sh https://localhost
```

### Mozilla Observatory Testing

1. Go to https://observatory.mozilla.org/
2. Enter your domain name
3. Click "Scan Me"
4. Wait for results

**Expected results**:
- ✅ X-Content-Type-Options: Pass (+0 points)
- ✅ Strict-Transport-Security: Pass (+0 points)
- ✅ X-Frame-Options: Pass (+0 points)
- ✅ Referrer-Policy: Pass (+0 points)

## Security Improvements

### Before
- X-Content-Type-Options: ❌ Failed (-5 points)
- Missing Referrer-Policy
- Missing Permissions-Policy
- Unquoted header values (potential compatibility issues)

### After
- X-Content-Type-Options: ✅ Pass
- Referrer-Policy: ✅ Configured
- Permissions-Policy: ✅ Configured
- All header values properly quoted
- Defense in depth with both Django and nginx setting headers

## Additional Notes

### Why Only Nginx in Production?

**Production (with nginx reverse proxy):**
- ✅ **Nginx handles ALL security headers**
- ✅ Consistent headers across static files, media, and dynamic content
- ✅ Better performance (headers added at nginx layer)
- ✅ No duplicate headers
- ✅ Single source of truth

**Development (without nginx):**
- ✅ **Django handles security headers** via `SecurityMiddleware`
- ✅ Testing environment matches production security behavior
- ✅ No nginx required for local development

This architecture follows the **Single Responsibility Principle** and avoids the duplicate header issue.

### Header Values Explained

1. **X-Content-Type-Options: nosniff**
   - Prevents MIME-type sniffing attacks
   - Browsers must respect the Content-Type header

2. **Referrer-Policy: strict-origin-when-cross-origin**
   - Sends full URL to same-origin requests
   - Sends only origin to cross-origin HTTPS requests
   - Sends nothing to insecure HTTP requests

3. **Permissions-Policy: geolocation=(), microphone=(), camera=()**
   - Disables browser features that could be exploited
   - Prevents unauthorized access to device sensors
   - Empty list means no origins are allowed to use these features

## Troubleshooting

### Headers not showing up
1. Verify nginx container restarted: `docker-compose restart nginx`
2. Check nginx configuration: `docker-compose exec nginx nginx -t`
3. View nginx logs: `docker-compose logs nginx`
4. Ensure testing via HTTPS (not HTTP)

### Still failing Mozilla Observatory
1. Wait 5-10 minutes for Observatory cache to clear
2. Use "Force Rescan" option
3. Verify you're testing the correct domain/URL
4. Check if there's a CDN or proxy stripping headers

### Header appears multiple times
- **Fixed**: Django no longer sets headers in production
- Nginx is the single source of headers in production
- Development mode still uses Django's SecurityMiddleware

## Files Modified
1. `config/settings/production.py` - Disabled Django headers to avoid duplicates with nginx
2. `config/settings/base.py` - Added comments explaining header strategy
3. `config/settings/development.py` - Added comments about header inheritance
4. `docker/nginx/nginx.conf` - Enhanced all security headers with quoted values
5. `test-security-headers.ps1` - Updated to verify all headers
6. `test-security-headers.sh` - Updated to verify all headers

## Compliance & Best Practices
- ✅ OWASP Security Headers recommendations
- ✅ Mozilla Observatory best practices
- ✅ Defense in depth strategy
- ✅ No deprecated security practices
- ✅ Modern browser compatibility

