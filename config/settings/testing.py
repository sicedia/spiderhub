from .base import *

from config.build_id import compute_build_id

DEBUG = False

BUILD_ID = compute_build_id(STATIC_ROOT)

ALLOWED_HOSTS = ['testserver']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Utiliza un hasher rápido para que las pruebas se ejecuten más rápido
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]
