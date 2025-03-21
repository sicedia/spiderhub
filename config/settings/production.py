import os
import dj_database_url
from .base import *

# Production-specific settings
DEBUG = False

# Use PostgreSQL for production
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}

# Security settings
ALLOWED_HOSTS = ['sitest.cedia.org.ec', 'spiderhub.cedia.org.ec']  # Update with your domain
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True