from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# In development (without nginx), Django handles security headers
# These are inherited from base.py:
# - SECURE_CONTENT_TYPE_NOSNIFF = True
# - SECURE_BROWSER_XSS_FILTER = True

# Cache busting para development - usar DummyCache para evitar cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Enhanced logging for Development
# Verbose logging - shows all debug information
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} {funcName} {message}',
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
            'formatter': 'verbose',
            'level': 'DEBUG',  # Show all logs in development
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',  # Root logger shows everything
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',  # Django framework logs at INFO level
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',  # Show SQL queries in development
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',  # Show all application logs
            'propagate': False,
        },
    },
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': get_env_variable('POSTGRES_DB'),
        'USER': get_env_variable('POSTGRES_USER'),
        'PASSWORD': get_env_variable('POSTGRES_PASSWORD'),
        'HOST': get_env_variable('POSTGRES_HOST'),
        'PORT': get_env_variable('POSTGRES_PORT'),
        'CONN_MAX_AGE': 600, 
    }
}

# File upload limits (add this near the end of the file)
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50MB  
DATA_UPLOAD_MAX_NUMBER_FIELDS = 20000  # Increase from default 1000

# Content Security Policy settings for development
# Base CSP is strict (no unsafe-inline) for most pages
# RelaxedCSPMiddleware applies relaxed CSP (with unsafe-inline) only to /analysis/ and /admin/
# This matches production behavior for consistency

# Use the new CONTENT_SECURITY_POLICY format as suggested by django-csp
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'base-uri': ["'self'"],
        'connect-src': ["'self'",
                        'https://cdn.jsdelivr.net',
                        'https://d3js.org',
                        'https://raw.githubusercontent.com',
                        'https://unpkg.com',
                        'https://leafletjs.com'],
        'default-src': ["'none'"],  # Deny by default as required by Observatory
        'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
        'form-action': ["'self'"],
        'frame-src': ["'none'"],
        'img-src': ["'self'",
                    'data:',
                    'https://*.tile.openstreetmap.org',
                    'https://unpkg.com',
                    'https://cdn.jsdelivr.net',
                    'https://www.oas.org',
                    'https://www.itu.int',
                    'https://www.caf.com',
                    'https://idrc-crdi.ca',
                    'https://www.iesalc.unesco.org',
                    'https://www.eucelac-platform.eu',
                    'https://events.iadb.org',
                    'https://www.cepal.org'],
        'object-src': ["'none'"],
        'script-src': ["'self'",
                       'https://cdn.jsdelivr.net',
                       'https://d3js.org',
                       'https://unpkg.com'],
        'style-src': ["'self'",
                      'https://fonts.googleapis.com',
                      'https://unpkg.com',
                      'https://cdn.jsdelivr.net'],  # Added for Swagger UI CSS
        'style-src-attr': ["'self'"],  # Removed unsafe-inline - applied only via RelaxedCSPMiddleware
        'style-src-elem': ["'self'",
                           'https://fonts.googleapis.com',
                           'https://unpkg.com',
                           'https://cdn.jsdelivr.net'],  # Added for Swagger UI CSS
        'frame-ancestors': ["'none'"],
    }
}

# Include report URI if provided
if os.getenv('CSP_REPORT_URI'):
    CONTENT_SECURITY_POLICY['DIRECTIVES']['report-uri'] = os.getenv('CSP_REPORT_URI')

# Enable nonce generation for script-src to allow inline scripts with nonces
CSP_INCLUDE_NONCE_IN = ['script-src']


