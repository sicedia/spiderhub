from .base import *

DEBUG = False

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

# Email: Utiliza un backend en memoria para pruebas
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'