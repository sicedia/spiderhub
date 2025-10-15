# Script para verificar los headers de seguridad HSTS
# Uso: .\test-security-headers.ps1 -Url "https://tu-dominio.com"

param(
    [string]$Url = "https://localhost"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Probando headers de seguridad en: $Url" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Testing ROOT endpoint (/):" -ForegroundColor Yellow
Write-Host "-------------------------------------------"
try {
    $response = Invoke-WebRequest -Uri "$Url/" -Method Head -SkipCertificateCheck -ErrorAction Stop
    $response.Headers['Strict-Transport-Security']
    $response.Headers['X-Content-Type-Options']
    $response.Headers['X-Frame-Options']
    $response.Headers['X-XSS-Protection']
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "2️⃣  Testing STATIC files (/static/favicon.ico):" -ForegroundColor Yellow
Write-Host "-------------------------------------------"
try {
    $response = Invoke-WebRequest -Uri "$Url/static/favicon.ico" -Method Head -SkipCertificateCheck -ErrorAction Stop
    $response.Headers['Strict-Transport-Security']
    $response.Headers['X-Content-Type-Options']
    $response.Headers['X-Frame-Options']
    $response.Headers['X-XSS-Protection']
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "3️⃣  Full headers from root:" -ForegroundColor Yellow
Write-Host "-------------------------------------------"
try {
    $response = Invoke-WebRequest -Uri "$Url/" -Method Head -SkipCertificateCheck -ErrorAction Stop
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    $response.Headers | Format-Table -AutoSize
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Verificación completa" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ El header DEBE incluir:" -ForegroundColor Green
Write-Host "   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload"
Write-Host ""
Write-Host "Si no ves estos headers, el problema puede ser:" -ForegroundColor Yellow
Write-Host "  1. Nginx no se reinició correctamente"
Write-Host "  2. El archivo nginx.conf no se montó correctamente en el contenedor"
Write-Host "  3. Estás probando con HTTP en lugar de HTTPS"
Write-Host "  4. Hay un proxy o CDN que está quitando los headers"
Write-Host ""

