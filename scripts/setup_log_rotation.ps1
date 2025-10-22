# PowerShell script to configure log rotation in development
# Usage: .\scripts\setup_log_rotation.ps1

Write-Host "Configuring automatic log cleanup for SpiderHub (Windows)..." -ForegroundColor Green

# Create logs directory if it doesn't exist
$logsDir = "logs"
if (!(Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force
    Write-Host "Logs directory created: $logsDir" -ForegroundColor Yellow
}

# Create cleanup script for Windows
$cleanupScript = @"
@echo off
echo Cleaning old SpiderHub logs...
python manage.py cleanup_logs --days=14 --keep=5
echo Cleanup completed
"@

$cleanupScript | Out-File -FilePath "scripts\cleanup_logs.bat" -Encoding UTF8

# Create scheduled task for Windows
$taskName = "SpiderHub-LogCleanup"
$scriptPath = Join-Path $PWD "scripts\cleanup_logs.bat"

try {
    # Remove existing task if it exists
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    
    # Create new scheduled task
    $action = New-ScheduledTaskAction -Execute $scriptPath
    $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2am
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Automatic log cleanup for SpiderHub"
    
    Write-Host "Scheduled task created: $taskName" -ForegroundColor Green
    Write-Host "   Will run every Sunday at 2:00 AM" -ForegroundColor Cyan
}
catch {
    Write-Host "Error creating scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Run as administrator to create scheduled tasks" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "   Manual cleanup: python manage.py cleanup_logs --days=14 --keep=5" -ForegroundColor White
Write-Host "   Simulation: python manage.py cleanup_logs --days=14 --keep=5 --dry-run" -ForegroundColor White
Write-Host "   View tasks: Get-ScheduledTask -TaskName $taskName" -ForegroundColor White
Write-Host "   Remove task: Unregister-ScheduledTask -TaskName $taskName" -ForegroundColor White
