from .base import *
import os

# Debug settings
DEBUG = True

# Database settings
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'spider',
        'USER': 'user',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Static and media files
STATIC_URL = '/static/'
MEDIA_URL = '/media/'