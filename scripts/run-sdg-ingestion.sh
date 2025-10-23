#!/bin/bash
# Script to run ingest_sdg_relevance and monitor logs
# Usage: ./scripts/run-sdg-ingestion.sh [--all|--batch N|--doc ID] [--force]

echo "Running SDG relevance ingestion..."
echo "======================================"

# Execute command in background
docker exec -it spider_web python manage.py ingest_sdg_relevance "$@" &

# Get process PID
PID=$!

echo "Monitoring logs in real-time..."
echo "Press Ctrl+C to stop monitoring (process will continue)"
echo "================================================================"

# Monitor logs while executing
docker exec -it spider_web tail -f /app/logs/sdg_ingestion.log

echo ""
echo "To see final results, run:"
echo "   ./scripts/view-failed-scores.sh"
