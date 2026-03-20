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

# Function to check database status
check_db_status() {
    echo "Checking database status..."
    # Use a more robust pipeline to avoid BrokenPipeError.
    # The `grep` command filters the lines, and `wc -l` counts them.
    # This ensures the entire output of `showmigrations` is processed.
    MIGRATIONS_COUNT=$(python manage.py showmigrations --plan | grep -c "\[X\]" || true)
    
    if [ "$MIGRATIONS_COUNT" -gt 0 ]; then
        echo "Database is already migrated."
        return 0 # Migrated
    else
        echo "Fresh database detected. Running initial setup..."
        return 1 # Not migrated
    fi
}

# Check if this is first deployment
check_db_status
DB_STATUS=$?

if [ "$DB_STATUS" -eq 1 ]; then
    # Fresh database, run migrations and initial setup
    echo "Applying database migrations..."
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

echo "Validating static deploy (manifest + critical paths)..."
python manage.py validate_static_deploy

# Translation messages are now compiled during Docker build
# echo "Compiling translation messages..."
# python manage.py compilemessages --ignore=node_modules --ignore=pyspider

# If Content Security Policy report URI is set, echo it
if [ ! -z "$CSP_REPORT_URI" ]; then
  echo "CSP reporting enabled: $CSP_REPORT_URI"
fi

# Validate Django configuration
echo "Validating Django configuration..."
python manage.py check --deploy

echo "Deployment complete. Starting application..."
exec "$@"