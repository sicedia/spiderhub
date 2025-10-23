# PowerShell script to view SDG failure logs
# Usage: .\scripts\view-failed-scores.ps1

Write-Host "Showing SDG score failures..." -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Cyan

docker exec -it spider_web cat /app/logs/failed_sdg_scores.log
