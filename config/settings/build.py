"""
Minimal Django settings for build-time operations like compilemessages.
This configuration only includes what's necessary for translation compilation.
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Minimal secret key for build operations
SECRET_KEY = 'build-time-secret-key-not-for-production'

# Application definition - minimal for translations
# Must include all apps that are referenced in project code to avoid initialization errors
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'apps.core',
    'apps.documents',
    'apps.admin_panel',
    'apps.search',
    'apps.api',  # Required for compilemessages to work during Docker build
]

# Minimal middleware for translations
MIDDLEWARE = [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
]

# Internationalization settings
LANGUAGE_CODE = 'en'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

LANGUAGES = [
    ('en', 'English'),
    ('es', 'Español'),
    # ('pt', 'Português'),  # Desactivado temporalmente - archivos listos en locale/pt/
]

LOCALE_PATHS = [BASE_DIR / 'locale']

# Disable database operations during build
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable logging during build
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
    },
}

# Disable migrations during build
MIGRATION_MODULES = {}

# Static files (minimal)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Disable security checks during build
SILENCED_SYSTEM_CHECKS = [
    'security.W004',  # HSTS
    'security.W019',  # SECURE_SSL_REDIRECT
    'security.W020',  # SECURE_HSTS_SECONDS
    'security.W021',  # SECURE_HSTS_INCLUDE_SUBDOMAINS
    'security.W022',  # SECURE_HSTS_PRELOAD
    'security.W023',  # SECURE_CONTENT_TYPE_NOSNIFF
    'security.W024',  # SECURE_BROWSER_XSS_FILTER
    'security.W025',  # SECURE_REFERRER_POLICY
]

# Disable debug toolbar and other development tools
DEBUG = False

# Required Django settings for app initialization (even if not used by compilemessages)
# Some apps may import these during module loading
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
