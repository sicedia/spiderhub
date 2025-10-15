# Script para verificar si hay headers duplicados
# Uso: .\test-header-duplicates.ps1 -Url "https://localhost"

param(
    [string]$Url = "https://localhost"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Verificando headers duplicados en: $Url" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

function Test-DuplicateHeaders {
    param([string]$Endpoint, [string]$Description)
    
    Write-Host "🔍 Probando: $Description" -ForegroundColor Yellow
    Write-Host "Endpoint: $Endpoint" -ForegroundColor Gray
    Write-Host "-------------------------------------------"
    
    try {
        $response = Invoke-WebRequest -Uri $Endpoint -Method Head -SkipCertificateCheck -ErrorAction Stop
        
        # Headers de seguridad a verificar
        $securityHeaders = @(
            'Strict-Transport-Security',
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection',
            'Referrer-Policy',
            'Permissions-Policy'
        )
        
        $hasDuplicates = $false
        
        foreach ($headerName in $securityHeaders) {
            $headerValues = $response.Headers[$headerName]
            
            if ($headerValues) {
                # Contar cuántos valores tiene este header
                $count = if ($headerValues -is [array]) { $headerValues.Count } else { 1 }
                
                if ($count -gt 1) {
                    Write-Host "  ❌ $headerName aparece $count veces:" -ForegroundColor Red
                    foreach ($value in $headerValues) {
                        Write-Host "     - $value" -ForegroundColor Red
                    }
                    $hasDuplicates = $true
                } else {
                    Write-Host "  ✅ $headerName`: $headerValues" -ForegroundColor Green
                }
            } else {
                Write-Host "  ⚠️  $headerName`: (no presente)" -ForegroundColor Yellow
            }
        }
        
        if (-not $hasDuplicates) {
            Write-Host ""
            Write-Host "  ✅ No se detectaron headers duplicados" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Probar diferentes endpoints
Test-DuplicateHeaders "$Url/" "Página principal"
Test-DuplicateHeaders "$Url/static/favicon.ico" "Archivos estáticos"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Verificación completa" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ℹ️  Interpretación de resultados:" -ForegroundColor Cyan
Write-Host "  ✅ = Header presente una sola vez (correcto)"
Write-Host "  ❌ = Header duplicado (problema)"
Write-Host "  ⚠️  = Header no presente (puede ser normal según el contexto)"
Write-Host ""

