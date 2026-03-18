#!/usr/bin/env bash
# Script de despliegue en producción (Ubuntu Linux).
# Usa docker-compose.yml y .env.production en la raíz del proyecto.
#
# Uso en el servidor:
#   cd ~/spiderhub
#   ./scripts/deploy-production.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Directorio donde está este script (p. ej. ~/spiderhub o ~/spiderhub/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Raíz del proyecto: si docker-compose.yml está junto al script, es SCRIPT_DIR; si no, un nivel arriba
if [[ -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
  PROJECT_ROOT="$SCRIPT_DIR"
else
  PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
ENV_FILE="$PROJECT_ROOT/.env.production"

cd "$PROJECT_ROOT"

echo -e "${BLUE}===============================================================${NC}"
echo -e "${BLUE}          SpiderHub - Despliegue en producción                 ${NC}"
echo -e "${BLUE}===============================================================${NC}"
echo ""

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo -e "${RED}Error: No se encuentra docker-compose.yml en $PROJECT_ROOT${NC}"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${RED}Error: No se encuentra .env.production. Crea el archivo con las variables necesarias.${NC}"
  exit 1
fi

echo -e "${YELLOW}Pull de la imagen latest desde Docker Hub...${NC}"
docker compose -f "$COMPOSE_FILE" pull

echo ""
echo -e "${YELLOW}Levantando servicios (migrate y collectstatic se ejecutan en el entrypoint)...${NC}"
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo -e "${GREEN}Despliegue completado.${NC}"
echo ""
echo -e "${BLUE}Estado de los contenedores:${NC}"
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo -e "Para ver logs: docker compose logs -f web"
echo ""
