#!/bin/bash
# Script to clean up old logs
# Usage: ./scripts/cleanup-logs.sh

echo "Cleaning up old logs..."
echo "============================"

# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./logs-backup-$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

# Copy current logs to backup
docker cp spider_web:/app/logs/sdg_ingestion.log "$BACKUP_DIR/" 2>/dev/null || echo "No SDG logs"
docker cp spider_web:/app/logs/failed_sdg_scores.log "$BACKUP_DIR/" 2>/dev/null || echo "No failure logs"
docker cp spider_web:/app/logs/django.log "$BACKUP_DIR/" 2>/dev/null || echo "No Django logs"

echo "Backup created in: $BACKUP_DIR"

# Clean logs inside container
docker exec -it spider_web bash -c "
    echo 'Cleaning logs in container...'
    > /app/logs/sdg_ingestion.log
    > /app/logs/failed_sdg_scores.log
    > /app/logs/django.log
    echo 'Logs cleaned'
"

echo "Cleanup completed"
