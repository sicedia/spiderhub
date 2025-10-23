# PowerShell script to view SDG processing logs in real-time
# Usage: .\scripts\view-sdg-logs.ps1

Write-Host "Monitoring SDG processing logs..." -ForegroundColor Green
Write-Host "Press Ctrl+C to exit" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan

docker exec -it spider_web tail -f /app/logs/sdg_ingestion.log
