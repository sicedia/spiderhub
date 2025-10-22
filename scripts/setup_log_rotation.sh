#!/bin/bash

# Script to configure automatic log rotation
# Usage: ./scripts/setup_log_rotation.sh

echo "Configuring automatic log rotation for SpiderHub..."

# Create logs directory if it doesn't exist
mkdir -p /app/logs

# Create logrotate configuration for Django logs
cat > /etc/logrotate.d/spiderhub << EOF
# SpiderHub log rotation
/app/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        # Restart services if necessary
        docker exec spider_web python manage.py cleanup_logs --days=14 --keep=5 >/dev/null 2>&1 || true
    endscript
}

# Application-specific logs
/app/logs/django.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 root root
}

/app/logs/failed_sdg_scores.log {
    weekly
    missingok
    rotate 4
    compress
    delaycompress
    notifempty
    create 644 root root
}

/app/logs/sdg_ingestion.log {
    weekly
    missingok
    rotate 4
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

# Create cron job for automatic cleanup
cat > /etc/cron.d/spiderhub-log-cleanup << EOF
# Automatic log cleanup for SpiderHub
# Run every Sunday at 2:00 AM
0 2 * * 0 root docker exec spider_web python manage.py cleanup_logs --days=14 --keep=5 >> /var/log/spiderhub-cleanup.log 2>&1

# CSP log cleanup every 2 weeks
0 3 * * 0 root docker exec spider_web python manage.py cleanup_logs --days=30 --keep=3 >> /var/log/spiderhub-cleanup.log 2>&1
EOF

echo "Log rotation configuration completed:"
echo "   Logrotate configured in /etc/logrotate.d/spiderhub"
echo "   Cron job configured in /etc/cron.d/spiderhub-log-cleanup"
echo ""
echo "To verify configuration:"
echo "   sudo logrotate -d /etc/logrotate.d/spiderhub"
echo ""
echo "To run manual cleanup:"
echo "   docker exec spider_web python manage.py cleanup_logs --days=14 --keep=5"
echo ""
echo "To simulate cleanup (dry-run):"
echo "   docker exec spider_web python manage.py cleanup_logs --days=14 --keep=5 --dry-run"
