#!/usr/bin/env sh
set -e

echo "Waiting for PostgreSQL Database..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT"; do
  sleep 2
done

echo "Aplicando migraciones…"
python manage.py migrate --no-input

echo "Recolectando estáticos…"
python manage.py collectstatic --no-input --clear

exec "$@"