#!/usr/bin/env bash
set -euo pipefail

echo "Starting SpiderHub deployment..."

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service ($host:$port)..."
    while ! pg_isready -h "$host" -p "$port" -U "$POSTGRES_USER" -q; do
        if [ $attempt -eq $max_attempts ]; then
            echo "ERROR: $service is not available after $max_attempts attempts"
            exit 1
        fi
        echo "$service is unavailable - attempt $attempt/$max_attempts"
        sleep 2
        ((attempt++))
    done
    echo "$service is ready!"
}

# Wait for PostgreSQL
wait_for_service "$POSTGRES_HOST" "$POSTGRES_PORT" "PostgreSQL"

# Check if this is first deployment
echo "Checking database status..."
if ! python manage.py showmigrations --plan | grep -q '\[X\]'; then
    echo "Fresh database detected. Running initial setup..."
    python manage.py migrate --no-input
    
    # Create superuser if specified
    if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
        echo "Creating superuser..."
        python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '${DJANGO_SUPERUSER_EMAIL:-admin@example.com}', '$DJANGO_SUPERUSER_PASSWORD')
    print('Superuser created successfully')
else:
    print('Superuser already exists')
" || echo "Warning: Superuser creation failed"
    fi
else
    echo "Existing database detected. Running migrations..."
    python manage.py migrate --no-input
fi

echo "Collecting static files..."
python manage.py collectstatic --no-input --clear

# Validate Django configuration
echo "Validating Django configuration..."
python manage.py check --deploy

echo "Deployment complete. Starting application..."
exec "$@"