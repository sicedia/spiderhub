#!/bin/bash
# Script para sincronizar migraciones en producción
# Uso: ./scripts/fix_production_migrations.sh

echo "========================================="
echo "Sincronización de Migraciones - SpiderHub"
echo "========================================="
echo ""

# Verificar si estamos usando Docker o local
read -p "¿Ejecutar en contenedor Docker? (s/n): " use_docker

if [ "$use_docker" = "s" ] || [ "$use_docker" = "S" ]; then
    echo "Ejecutando en contenedor Docker..."
    docker-compose exec spider_web python manage.py shell -c "exec(open('scripts/fix_production_migrations.py').read())"
else
    echo "Ejecutando localmente..."
    
    # Activar entorno virtual si existe
    if [ -f "./pyspider/bin/activate" ]; then
        echo "Activando entorno virtual..."
        source ./pyspider/bin/activate
    fi
    
    # Ejecutar script
    python manage.py shell -c "exec(open('scripts/fix_production_migrations.py').read())"
fi

echo ""
echo "Script completado."

