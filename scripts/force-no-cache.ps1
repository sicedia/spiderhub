# Script para activar/desactivar el modo de no-cache forzado
# Uso: .\scripts\force-no-cache.ps1 -Hours 24
#      .\scripts\force-no-cache.ps1 -Disable

param(
    [Parameter(Mandatory=$false)]
    [int]$Hours = 24,
    
    [Parameter(Mandatory=$false)]
    [switch]$Disable,
    
    [Parameter(Mandatory=$false)]
    [string]$EnvFile = ".env.production"
)

# Función para obtener la fecha en formato ISO
function Get-ISO8601Date {
    param([int]$HoursFromNow)
    $date = (Get-Date).AddHours($HoursFromNow)
    return $date.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

# Función para leer y actualizar el archivo .env
function Update-EnvFile {
    param(
        [string]$FilePath,
        [string]$Key,
        [string]$Value
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "❌ Archivo $FilePath no encontrado" -ForegroundColor Red
        return $false
    }
    
    $content = Get-Content $FilePath -Raw
    $pattern = "^${Key}=.*$"
    
    if ($content -match $pattern) {
        # Reemplazar la línea existente
        $content = $content -replace $pattern, "${Key}=${Value}"
    } else {
        # Agregar nueva línea al final
        $content += "`n${Key}=${Value}"
    }
    
    Set-Content -Path $FilePath -Value $content -NoNewline
    return $true
}

if ($Disable) {
    Write-Host "🔄 Desactivando modo no-cache forzado..." -ForegroundColor Yellow
    if (Update-EnvFile -FilePath $EnvFile -Key "FORCE_NO_CACHE_UNTIL" -Value "") {
        Write-Host "✅ Variable FORCE_NO_CACHE_UNTIL eliminada del archivo $EnvFile" -ForegroundColor Green
        Write-Host "📝 Para aplicar los cambios, reinicia los contenedores:" -ForegroundColor Cyan
        Write-Host "   docker-compose restart web" -ForegroundColor White
    }
} else {
    $expiryDate = Get-ISO8601Date -HoursFromNow $Hours
    Write-Host "🚀 Activando modo no-cache forzado por $Hours horas..." -ForegroundColor Yellow
    Write-Host "   Expira: $expiryDate" -ForegroundColor Cyan
    
    if (Update-EnvFile -FilePath $EnvFile -Key "FORCE_NO_CACHE_UNTIL" -Value $expiryDate) {
        Write-Host "✅ Variable FORCE_NO_CACHE_UNTIL configurada en $EnvFile" -ForegroundColor Green
        Write-Host "📝 Para aplicar los cambios, reinicia los contenedores:" -ForegroundColor Cyan
        Write-Host "   docker-compose restart web" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 El modo no-cache se desactivará automáticamente después de $Hours horas" -ForegroundColor Magenta
    }
}

