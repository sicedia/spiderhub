"""
Template tags for static files.

Production (ManifestStaticFilesStorage / Whitenoise compressed manifest):
  URLs are content-fingerprinted by Django's {% static %} — no ?v= query string.

Development: ?v=<mtime> so edits refresh without relying on browser cache.
"""
import os
import time
import hashlib
from django import template
from django.conf import settings
from django.contrib.staticfiles.storage import ManifestStaticFilesStorage
from django.contrib.staticfiles.storage import staticfiles_storage
from django.templatetags.static import static
from django.urls import reverse
from django.utils.safestring import mark_safe

register = template.Library()

_file_hash_cache = {}


def _manifest_storage_enabled():
    """True when collectstatic manifest rewrites URLs (fingerprint in path)."""
    try:
        return isinstance(staticfiles_storage, ManifestStaticFilesStorage)
    except Exception:
        return False


def get_file_hash(file_path, use_mtime=False):
    """Content or mtime hash for dev / non-manifest fallback."""
    if not os.path.exists(file_path):
        return str(int(time.time()))

    if use_mtime or settings.DEBUG:
        return str(int(os.path.getmtime(file_path)))

    if file_path in _file_hash_cache:
        cached_hash, cached_mtime = _file_hash_cache[file_path]
        current_mtime = os.path.getmtime(file_path)
        if cached_mtime == current_mtime:
            return cached_hash

    try:
        hasher = hashlib.md5()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                hasher.update(chunk)
        file_hash = hasher.hexdigest()[:12]
        _file_hash_cache[file_path] = (file_hash, os.path.getmtime(file_path))
        return file_hash
    except (OSError, IOError):
        return str(int(time.time()))


def _resolve_static_path_for_dev(path):
    """Locate source file for ?v=mtime in development."""
    for static_dir in settings.STATICFILES_DIRS:
        potential_path = os.path.join(static_dir, path)
        if os.path.exists(potential_path):
            return potential_path
    for app in settings.INSTALLED_APPS:
        if app.startswith('apps.'):
            app_static_path = os.path.join(
                settings.BASE_DIR,
                app.replace('.', '/'),
                'static',
                path,
            )
            if os.path.exists(app_static_path):
                return app_static_path
    return None


def _version_query_for_non_manifest(path):
    """Fallback when manifest storage is not used (tests / misconfiguration)."""
    static_root_path = os.path.join(settings.STATIC_ROOT, path)
    if os.path.isfile(static_root_path):
        return get_file_hash(static_root_path, use_mtime=False)
    for static_dir in getattr(settings, 'STATICFILES_DIRS', []):
        potential_path = os.path.join(static_dir, path)
        if os.path.isfile(potential_path):
            return get_file_hash(potential_path, use_mtime=False)
    bid = getattr(settings, 'BUILD_ID', None) or getattr(
        settings, 'STATIC_VERSION', str(int(time.time()))
    )
    return str(bid)


@register.simple_tag
def static_versioned(path):
    """
    URL for a static file.

    - Manifest production: same as {% static %} (fingerprint in filename).
    - Development: /static/.../file.css?v=<mtime>
    - Else: ?v= content hash or BUILD_ID.
    """
    url = static(path)

    if settings.DEBUG:
        static_path = _resolve_static_path_for_dev(path)
        if static_path:
            version = get_file_hash(static_path, use_mtime=True)
        else:
            version = str(int(time.time()))
        return f"{url}?v={version}"

    if _manifest_storage_enabled():
        return url

    version = _version_query_for_non_manifest(path)
    return f"{url}?v={version}"


@register.simple_tag(takes_context=True)
def css_versioned(context, path):
    """<link rel="stylesheet"> with correct URL and optional CSP nonce."""
    versioned_url = static_versioned(path)
    request = context.get('request')
    nonce = getattr(request, 'csp_nonce', '') if request else ''
    nonce_attr = f' nonce="{nonce}"' if nonce else ''
    return mark_safe(f'<link rel="stylesheet" href="{versioned_url}"{nonce_attr}>')


@register.simple_tag(takes_context=True)
def js_versioned(context, path):
    """<script src=...> with correct URL and optional CSP nonce."""
    versioned_url = static_versioned(path)
    request = context.get('request')
    nonce = getattr(request, 'csp_nonce', '') if request else ''
    nonce_attr = f' nonce="{nonce}"' if nonce else ''
    return mark_safe(f'<script src="{versioned_url}"{nonce_attr}></script>')


@register.simple_tag(takes_context=True)
def js_module_versioned(context, path):
    """<script type="module" src=...> with correct URL and optional CSP nonce."""
    versioned_url = static_versioned(path)
    request = context.get('request')
    nonce = getattr(request, 'csp_nonce', '') if request else ''
    nonce_attr = f' nonce="{nonce}"' if nonce else ''
    return mark_safe(
        f'<script type="module" src="{versioned_url}"{nonce_attr}></script>'
    )


@register.simple_tag(takes_context=True)
def js_catalog_nonce(context):
    """Django JavaScript catalog with CSP nonce."""
    request = context.get('request')
    nonce = getattr(request, 'csp_nonce', '') if request else ''
    nonce_attr = f' nonce="{nonce}"' if nonce else ''
    try:
        url = reverse('javascript-catalog')
    except Exception:
        url = '/jsi18n/'
    return mark_safe(f'<script src="{url}"{nonce_attr}></script>')
