import os

import psycopg2.extensions 
from .base import *

DEBUG = False

# Versión estática para cache busting en producción
# Usa timestamp de build de Docker o hash de commit de Git
import time
STATIC_VERSION = os.getenv('STATIC_VERSION', os.getenv('GIT_COMMIT_HASH', str(int(time.time())))[:12])

# Hosts configuration
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')]
CSRF_TRUSTED_ORIGINS = [f'https://{h}' for h in ALLOWED_HOSTS if h not in ['localhost', '127.0.0.1']]

# Database with connection pooling
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': get_env_variable('POSTGRES_DB'),
        'USER': get_env_variable('POSTGRES_USER'),
        'PASSWORD': get_env_variable('POSTGRES_PASSWORD'),
        'HOST': get_env_variable('POSTGRES_HOST'),
        'PORT': get_env_variable('POSTGRES_PORT'),
        'CONN_MAX_AGE': 600,
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'connect_timeout': 10,
            'isolation_level': psycopg2.extensions.ISOLATION_LEVEL_READ_COMMITTED,
        }
    }
}

# Enhanced Security settings
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "False") == "True"
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "False") == "True"
CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "False") == "True"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Security headers are managed by nginx in production to avoid duplicates
# This is more efficient and ensures consistent headers across all responses
# including static files, media files, and dynamic content
# HSTS is handled by nginx
# SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True
# X-Content-Type-Options is handled by nginx
# SECURE_CONTENT_TYPE_NOSNIFF = True
# X-XSS-Protection is handled by nginx  
# SECURE_BROWSER_XSS_FILTER = True
# Referrer-Policy is handled by nginx
# SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Static files
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_ROOT = BASE_DIR / 'media'

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'spiderhub-cache',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    }
}

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 86400  # 24 hours

# Logging configuration for Production
# Minimized logging - only warnings and errors
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{levelname}] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'level': 'WARNING',  # Only warnings and errors to console
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/django.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
            'level': 'WARNING',  # Only warnings and errors to file
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'WARNING',  # Root logger only logs warnings and errors
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',  # Only critical Django logs
            'propagate': False,
        },
        'gunicorn': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',  # Only gunicorn warnings/errors
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',  # Only app warnings/errors
            'propagate': False,
        },
    },
}

# Add whitenoise to middleware
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# Email configuration (for production notifications)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@spiderhub.com')

# File upload limits
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 20000  # Limit number of fields in a form submission

# Content Security Policy settings (django-csp >=4.0)
# Secure CSP configuration without 'unsafe-inline' - uses nonces instead
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        # Remove 'unsafe-inline', rely on nonces for inline scripts
        'script-src': ("'self'", "https://cdn.jsdelivr.net", "https://d3js.org", "https://unpkg.com"),
        # Remove 'unsafe-inline' from styles, use nonces
        'style-src': ("'self'", "https://fonts.googleapis.com", "https://unpkg.com"),
        'style-src-elem': ("'self'", "https://fonts.googleapis.com", "https://unpkg.com"),
        # Allow style attributes with nonce fallback
        'style-src-attr': ("'self'",),
        'img-src': ("'self'", "data:", "https://*.tile.openstreetmap.org", "https://unpkg.com"),
        'font-src': ("'self'", "data:", "https://fonts.gstatic.com"),
        'connect-src': ("'self'", "https://cdn.jsdelivr.net", "https://d3js.org", "https://raw.githubusercontent.com", "https://unpkg.com", "https://leafletjs.com"),
        'frame-src': ("'none'",),
        'object-src': ("'none'",),
        'base-uri': ("'self'",),
        'form-action': ("'self'",),  # Add form action restriction
        'frame-ancestors': ("'none'",),  # Add frame ancestors restriction
        
        # Include report URI if set
        **({ 'report-uri': (os.getenv('CSP_REPORT_URI'),) } if os.getenv('CSP_REPORT_URI') else {}),
    }
}

# Enable CSP nonces for scripts and styles
# The django-csp middleware will automatically generate a unique nonce per request
# and add it to the CSP header and make it available as request.csp_nonce
CSP_INCLUDE_NONCE_IN = ['script-src', 'style-src', 'style-src-elem', 'style-src-attr']