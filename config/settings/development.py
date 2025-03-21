from .base import *
import os

# Debug settings
DEBUG = True

# Database settings
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
# Other development settings
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
# Static and media files
STATIC_URL = '/static/'
MEDIA_URL = '/media/'