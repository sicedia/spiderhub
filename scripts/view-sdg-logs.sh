#!/bin/bash
# Script to view SDG processing logs in real-time
# Usage: ./scripts/view-sdg-logs.sh

echo "Monitoring SDG processing logs..."
echo "Press Ctrl+C to exit"
echo "=================================="

docker exec -it spider_web tail -f /app/logs/sdg_ingestion.log
