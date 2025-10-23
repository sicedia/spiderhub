#!/bin/bash
# Script to copy logs from container to host
# Usage: ./scripts/copy-logs.sh

echo "Copying logs from container to host..."
echo "=========================================="

# Create local directory if it doesn't exist
mkdir -p ./logs-backup

# Copy logs from container
docker cp spider_web:/app/logs/sdg_ingestion.log ./logs-backup/
docker cp spider_web:/app/logs/failed_sdg_scores.log ./logs-backup/
docker cp spider_web:/app/logs/django.log ./logs-backup/

echo "Logs copied to ./logs-backup/"
echo "Available files:"
ls -la ./logs-backup/
