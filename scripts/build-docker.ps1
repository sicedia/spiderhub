# Script para construir la imagen Docker con cache busting automatico (Windows PowerShell)
# La version se lee del archivo VERSION en la raiz del repo; opcional -Version para sobreescribir.
# Siempre etiqueta como <version> y latest; opcionalmente sube a Docker Hub con -Push.

param(
    [string]$Version = "",
    [switch]$Push
)

# Configuracion
$ErrorActionPreference = "Stop"

# Detectar version: parametro -Version, o archivo VERSION en raiz del repo
if (-not $Version) {
    $VersionFile = Join-Path (Split-Path $PSScriptRoot -Parent) "VERSION"
    if (Test-Path $VersionFile) {
        $Version = (Get-Content $VersionFile -Raw).Trim()
    }
    if (-not $Version) { $Version = "0.1.0-rc.27" }
}

# Obtener informacion de Git
try {
    $GitCommitHash = (git rev-parse --short=12 HEAD 2>$null)
} catch {
    $GitCommitHash = "unknown"
}

$BuildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Nombre de la imagen
$ImageName = "sicedia/spiderhub"
$ImageTag = $Version
$ImageFull = "${ImageName}:${ImageTag}"

# Mostrar informacion
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Blue
Write-Host "          SpiderHub Docker Build Script                       " -ForegroundColor Blue
Write-Host "===============================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Build Information:" -ForegroundColor Green
Write-Host "  Image:        $ImageFull"
Write-Host "  Also tag:     ${ImageName}:latest"
Write-Host "  Git Commit:   $GitCommitHash"
Write-Host "  Build Date:   $BuildDate"
Write-Host ""

# Construir la imagen (siempre con tag version + latest)
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build `
  --build-arg BUILD_DATE="$BuildDate" `
  --build-arg GIT_COMMIT_HASH="$GitCommitHash" `
  --build-arg VERSION="$Version" `
  --tag "$ImageFull" `
  --tag "${ImageName}:latest" `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[SUCCESS] Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Push a Docker Hub si se paso -Push
if ($Push) {
    Write-Host "Pushing to Docker Hub..." -ForegroundColor Yellow
    docker push $ImageFull
    if ($LASTEXITCODE -ne 0) { exit 1 }
    docker push "${ImageName}:latest"
    if ($LASTEXITCODE -ne 0) { exit 1 }
    Write-Host ""
    Write-Host "[SUCCESS] Pushed $ImageFull and ${ImageName}:latest" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "To push to Docker Hub, run:" -ForegroundColor Yellow
    Write-Host "  .\scripts\build-docker.ps1 -Push"
    Write-Host "  or: docker push $ImageFull ; docker push ${ImageName}:latest"
    Write-Host ""
}

Write-Host "To run the container:" -ForegroundColor Yellow
Write-Host "  docker run -d -p 8000:8000 $ImageFull"
Write-Host ""
