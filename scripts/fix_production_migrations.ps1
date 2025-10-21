# Script de PowerShell para sincronizar migraciones en producción
# Uso: .\scripts\fix_production_migrations.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Sincronización de Migraciones - SpiderHub" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si estamos usando Docker o local
$useDocker = Read-Host "¿Ejecutar en contenedor Docker? (s/n)"

if ($useDocker -eq "s" -or $useDocker -eq "S") {
    Write-Host "Ejecutando en contenedor Docker..." -ForegroundColor Yellow
    docker-compose exec spider_web python manage.py shell -c "exec(open('scripts/fix_production_migrations.py').read())"
} else {
    Write-Host "Ejecutando localmente..." -ForegroundColor Yellow
    
    # Activar entorno virtual si existe
    if (Test-Path ".\pyspider\Scripts\Activate.ps1") {
        Write-Host "Activando entorno virtual..." -ForegroundColor Gray
        & .\pyspider\Scripts\Activate.ps1
    }
    
    # Ejecutar script
    python manage.py shell -c "exec(open('scripts/fix_production_migrations.py').read())"
}

Write-Host ""
Write-Host "Presione cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

