from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Cache busting para development - usar DummyCache para evitar cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
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

# Content Security Policy settings for development (django-csp >=4.0 report-only)
CONTENT_SECURITY_POLICY_REPORT_ONLY = {
    'DIRECTIVES': {
        'default-src': ("'self'", "'unsafe-inline'"),
        'script-src': ("'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://d3js.org"),
        'style-src': ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com"),
        'style-src-elem': ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com"),
        'style-src-attr': ("'self'", "'unsafe-inline'"),
        'img-src': ("'self'", "data:"),
        'font-src': ("'self'", "data:", "https://fonts.gstatic.com"),
        'connect-src': ("'self'", "https://cdn.jsdelivr.net", "https://d3js.org", "https://raw.githubusercontent.com"),
        'frame-src': ("'none'",),
        'object-src': ("'none'",),
        'base-uri': ("'self'",),
        # Include report URI if provided
        **({ 'report-uri': (os.getenv('CSP_REPORT_URI'),) } if os.getenv('CSP_REPORT_URI') else {}),
    }
}

