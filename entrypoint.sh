#!/bin/sh
set -e

# Migraciones Django (no repetirá si ya están aplicadas)
python manage.py migrate --noinput

# Recolectar estáticos (idempotente)
python manage.py collectstatic --noinput

# Ejecutar el comando que se pase como argumento
exec "$@"