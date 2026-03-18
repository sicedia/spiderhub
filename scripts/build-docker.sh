#!/bin/bash
# Script para construir la imagen Docker con cache busting automático
# La versión se lee del archivo VERSION en la raíz del repo; primer argumento opcional para sobreescribir.
# Siempre etiqueta como <version> y latest; opcionalmente sube a Docker Hub con --push.
# Uso: ./scripts/build-docker.sh [--push]   o   ./scripts/build-docker.sh [VERSION] [--push]

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION_FILE="$REPO_ROOT/VERSION"

# Detectar versión: archivo VERSION o primer arg si no es --push
VERSION=""
PUSH=false
for arg in "$@"; do
  if [[ "$arg" == "--push" ]]; then
    PUSH=true
  elif [[ -z "$VERSION" && "$arg" != "--push" ]]; then
    VERSION="$arg"
  fi
done
if [[ -z "$VERSION" && -f "$VERSION_FILE" ]]; then
  VERSION=$(cat "$VERSION_FILE" | tr -d '\r\n' | xargs)
fi
[[ -z "$VERSION" ]] && VERSION="0.1.0-rc.27"

# Obtener información de Git
GIT_COMMIT_HASH=$(git rev-parse --short=12 HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

# Nombre de la imagen
IMAGE_NAME="sicedia/spiderhub"
IMAGE_TAG="${VERSION}"
IMAGE_FULL="${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          SpiderHub Docker Build Script                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Build Information:${NC}"
echo -e "  Image:        ${IMAGE_FULL}"
echo -e "  Also tag:     ${IMAGE_NAME}:latest"
echo -e "  Git Commit:   ${GIT_COMMIT_HASH}"
echo -e "  Build Date:   ${BUILD_DATE}"
echo ""

# Construir la imagen (siempre version + latest)
echo -e "${YELLOW}Building Docker image...${NC}"
docker build \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --build-arg GIT_COMMIT_HASH="${GIT_COMMIT_HASH}" \
  --build-arg VERSION="${VERSION}" \
  --tag "${IMAGE_FULL}" \
  --tag "${IMAGE_NAME}:latest" \
  .

echo ""
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""

# Push a Docker Hub si se pasó --push
if [[ "$PUSH" == "true" ]]; then
  echo -e "${YELLOW}Pushing to Docker Hub...${NC}"
  docker push "${IMAGE_FULL}"
  docker push "${IMAGE_NAME}:latest"
  echo ""
  echo -e "${GREEN}✅ Pushed ${IMAGE_FULL} and ${IMAGE_NAME}:latest${NC}"
  echo ""
else
  echo -e "${YELLOW}To push to Docker Hub, run:${NC}"
  echo -e "  ./scripts/build-docker.sh --push"
  echo -e "  or: docker push ${IMAGE_FULL} && docker push ${IMAGE_NAME}:latest"
  echo ""
fi

echo -e "${YELLOW}To run the container:${NC}"
echo -e "  docker run -d -p 8000:8000 ${IMAGE_FULL}"
echo ""

