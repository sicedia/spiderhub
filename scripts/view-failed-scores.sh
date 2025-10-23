#!/bin/bash
# Script to view SDG failure logs
# Usage: ./scripts/view-failed-scores.sh

echo "Showing SDG score failures..."
echo "=================================="

docker exec -it spider_web cat /app/logs/failed_sdg_scores.log
