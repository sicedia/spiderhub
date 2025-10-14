#!/bin/bash
# Script para construir la imagen Docker con cache busting automático
# Genera versiones únicas basadas en el commit de Git y la fecha de build

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Obtener información de Git
GIT_COMMIT_HASH=$(git rev-parse --short=12 HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

# Obtener versión del proyecto (o usar argumento)
VERSION=${1:-"0.1.0-rc.3"}

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
echo -e "  Git Commit:   ${GIT_COMMIT_HASH}"
echo -e "  Build Date:   ${BUILD_DATE}"
echo ""

# Construir la imagen
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
echo -e "${BLUE}Cache Busting Variables:${NC}"
echo -e "  GIT_COMMIT_HASH=${GIT_COMMIT_HASH}"
echo -e "  BUILD_DATE=${BUILD_DATE}"
echo ""
echo -e "${YELLOW}To push the image, run:${NC}"
echo -e "  docker push ${IMAGE_FULL}"
echo -e "  docker push ${IMAGE_NAME}:latest"
echo ""
echo -e "${YELLOW}To run the container:${NC}"
echo -e "  docker run -d -p 8000:8000 ${IMAGE_FULL}"
echo ""

