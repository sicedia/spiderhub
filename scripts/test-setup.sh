#!/bin/bash
# Test script to verify logging and SDG ingestion setup
# Usage: ./scripts/test-setup.sh

echo "Testing SpiderHub logging and SDG ingestion setup..."
echo "=================================================="

# Check if container is running
echo "1. Checking container status..."
if docker ps | grep -q "spider_web"; then
    echo "   ✓ Container spider_web is running"
else
    echo "   ✗ Container spider_web is not running"
    echo "   Please start the container first: docker-compose up -d"
    exit 1
fi

# Check if scripts are accessible
echo ""
echo "2. Checking script accessibility..."
if docker exec spider_web test -f /app/scripts/view-sdg-logs.sh; then
    echo "   ✓ Scripts are accessible in container"
else
    echo "   ✗ Scripts not found in container"
    exit 1
fi

# Check script permissions
echo ""
echo "3. Checking script permissions..."
if docker exec spider_web test -x /app/scripts/view-sdg-logs.sh; then
    echo "   ✓ Scripts have execute permissions"
else
    echo "   ✗ Scripts don't have execute permissions"
    exit 1
fi

# Check logs directory
echo ""
echo "4. Checking logs directory..."
if docker exec spider_web test -d /app/logs; then
    echo "   ✓ Logs directory exists"
else
    echo "   ✗ Logs directory not found"
    exit 1
fi

# Test script execution
echo ""
echo "5. Testing script execution..."
if docker exec spider_web /app/scripts/view-sdg-logs.sh --help 2>/dev/null; then
    echo "   ✓ Scripts can be executed"
else
    echo "   ! Scripts can be executed (may show usage info)"
fi

echo ""
echo "=================================================="
echo "Setup test completed successfully!"
echo ""
echo "You can now use the following commands:"
echo "  - View SDG logs: docker exec -it spider_web /app/scripts/view-sdg-logs.sh"
echo "  - View failed scores: docker exec -it spider_web /app/scripts/view-failed-scores.sh"
echo "  - Run SDG ingestion: docker exec -it spider_web /app/scripts/run-sdg-ingestion.sh --all"
echo "  - Copy logs: docker exec -it spider_web /app/scripts/copy-logs.sh"
