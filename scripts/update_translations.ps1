# Script para actualizar traducciones en SPIDERHUB
# Ejecuta este script cada vez que agregues nuevo contenido traducible

param(
    [switch]$Extract,     # Solo extraer cadenas
    [switch]$Compile,     # Solo compilar
    [switch]$All          # Extraer y compilar (por defecto)
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SPIDERHUB - Actualización de      " -ForegroundColor Cyan
Write-Host "       Traducciones                 " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Si no se especifica ningún flag, hacer todo
if (-not $Extract -and -not $Compile) {
    $All = $true
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "manage.py")) {
    Write-Host "Error: Ejecuta este script desde el directorio raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Verificar entorno virtual
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Advertencia: No detecté un entorno virtual activo" -ForegroundColor Yellow
    Write-Host "Asegúrate de activar pyspider antes de continuar" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "¿Continuar de todas formas? (s/n)"
    if ($continue -ne "s") {
        exit 0
    }
}

# PASO 1: Extraer cadenas
if ($Extract -or $All) {
    Write-Host "1. Extrayendo cadenas de traducción..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "   → Extrayendo de templates HTML..." -ForegroundColor Gray
    python manage.py makemessages -l es -l pt --ignore=pyspider
    
    Write-Host "   → Extrayendo de JavaScript..." -ForegroundColor Gray
    python manage.py makemessages -l es -l pt -d djangojs --ignore=pyspider
    
    Write-Host ""
    Write-Host "   ✓ Cadenas extraídas exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "   AHORA:" -ForegroundColor Cyan
    Write-Host "   1. Abre locale/es/LC_MESSAGES/django.po" -ForegroundColor White
    Write-Host "   2. Abre locale/pt/LC_MESSAGES/django.po" -ForegroundColor White
    Write-Host "   3. Busca las nuevas cadenas (msgstr vacíos)" -ForegroundColor White
    Write-Host "   4. Agrega las traducciones" -ForegroundColor White
    Write-Host "   5. Ejecuta este script con -Compile para compilar" -ForegroundColor White
    Write-Host ""
}

# PASO 2: Compilar
if ($Compile -or $All) {
    Write-Host "2. Compilando archivos de traducción..." -ForegroundColor Yellow
    Write-Host ""
    
    # Intentar usar compilemessages
    try {
        python manage.py compilemessages 2>&1 | Out-Null
        Write-Host "   ✓ Traducciones compiladas con compilemessages" -ForegroundColor Green
    }
    catch {
        Write-Host "   Compilemessages falló, usando msgfmt directo..." -ForegroundColor Yellow
        
        # Usar msgfmt directamente
        $msgfmt = "C:\Program Files\gettext-iconv\bin\msgfmt.exe"
        
        if (Test-Path $msgfmt) {
            Write-Host "   → Compilando español..." -ForegroundColor Gray
            & $msgfmt -o locale\es\LC_MESSAGES\django.mo locale\es\LC_MESSAGES\django.po
            & $msgfmt -o locale\es\LC_MESSAGES\djangojs.mo locale\es\LC_MESSAGES\djangojs.po
            
            Write-Host "   → Compilando portugués..." -ForegroundColor Gray
            & $msgfmt -o locale\pt\LC_MESSAGES\django.mo locale\pt\LC_MESSAGES\django.po
            & $msgfmt -o locale\pt\LC_MESSAGES\djangojs.mo locale\pt\LC_MESSAGES\djangojs.po
            
            Write-Host "   ✓ Traducciones compiladas con msgfmt" -ForegroundColor Green
        }
        else {
            Write-Host "   Error: No se encontró msgfmt.exe" -ForegroundColor Red
            Write-Host "   Instala gettext desde: https://mlocati.github.io/articles/gettext-iconv-windows.html" -ForegroundColor Yellow
            exit 1
        }
    }
    
    Write-Host ""
}

# Mostrar resumen
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  ARCHIVOS COMPILADOS               " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ESPAÑOL:" -ForegroundColor Yellow
Get-ChildItem locale\es\LC_MESSAGES\*.mo | ForEach-Object {
    $size = [math]::Round($_.Length/1KB, 2)
    $time = Get-Date $_.LastWriteTime -Format "HH:mm:ss"
    Write-Host "  $($_.Name): $size KB ($time)" -ForegroundColor White
}

Write-Host ""
Write-Host "PORTUGUÊS:" -ForegroundColor Yellow
Get-ChildItem locale\pt\LC_MESSAGES\*.mo | ForEach-Object {
    $size = [math]::Round($_.Length/1KB, 2)
    $time = Get-Date $_.LastWriteTime -Format "HH:mm:ss"
    Write-Host "  $($_.Name): $size KB ($time)" -ForegroundColor White
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  ✓ PROCESO COMPLETADO              " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "SIGUIENTE PASO:" -ForegroundColor Cyan
Write-Host "  Reinicia el servidor Django para cargar las traducciones" -ForegroundColor White
Write-Host ""

