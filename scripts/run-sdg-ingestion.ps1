# PowerShell script to run ingest_sdg_relevance and monitor logs
# Usage: .\scripts\run-sdg-ingestion.ps1 [--all|--batch N|--doc ID] [--force]

Write-Host "Running SDG relevance ingestion..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan

# Execute command
$command = "python manage.py ingest_sdg_relevance " + ($args -join " ")
Write-Host "Command: $command" -ForegroundColor Yellow

# Execute in background and monitor logs
Start-Job -ScriptBlock {
    param($cmd)
    docker exec -it spider_web $cmd
} -ArgumentList $command

Write-Host "Monitoring logs in real-time..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan

# Monitor logs
docker exec -it spider_web tail -f /app/logs/sdg_ingestion.log
