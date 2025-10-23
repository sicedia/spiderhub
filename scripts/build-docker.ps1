# Script para construir la imagen Docker con cache busting automatico (Windows PowerShell)
# Genera versiones unicas basadas en el commit de Git y la fecha de build

param(
    [string]$Version = "0.1.0-rc.20"
)

# Configuracion
$ErrorActionPreference = "Stop"

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
Write-Host "  Git Commit:   $GitCommitHash"
Write-Host "  Build Date:   $BuildDate"
Write-Host ""

# Construir la imagen
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build `
  --build-arg BUILD_DATE="$BuildDate" `
  --build-arg GIT_COMMIT_HASH="$GitCommitHash" `
  --build-arg VERSION="$Version" `
  --tag "$ImageFull" `
  --tag "${ImageName}:latest" `
  .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cache Busting Variables:" -ForegroundColor Blue
    Write-Host "  GIT_COMMIT_HASH=$GitCommitHash"
    Write-Host "  BUILD_DATE=$BuildDate"
    Write-Host ""
    Write-Host "To push the image, run:" -ForegroundColor Yellow
    Write-Host "  docker push $ImageFull"
    Write-Host "  docker push ${ImageName}:latest"
    Write-Host ""
    Write-Host "To run the container:" -ForegroundColor Yellow
    Write-Host "  docker run -d -p 8000:8000 $ImageFull"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Build failed!" -ForegroundColor Red
    exit 1
}
