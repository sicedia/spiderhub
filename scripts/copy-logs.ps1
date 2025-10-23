# PowerShell script to copy logs from container to host
# Usage: .\scripts\copy-logs.ps1

Write-Host "Copying logs from container to host..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Create local directory if it doesn't exist
if (!(Test-Path ".\logs-backup")) {
    New-Item -ItemType Directory -Path ".\logs-backup"
}

# Copy logs from container
docker cp spider_web:/app/logs/sdg_ingestion.log .\logs-backup\
docker cp spider_web:/app/logs/failed_sdg_scores.log .\logs-backup\
docker cp spider_web:/app/logs/django.log .\logs-backup\

Write-Host "Logs copied to .\logs-backup\" -ForegroundColor Green
Write-Host "Available files:" -ForegroundColor Yellow
Get-ChildItem .\logs-backup\
