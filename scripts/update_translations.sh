#!/bin/bash
# Script para actualizar traducciones en SPIDERHUB (Linux/Mac)
# Ejecuta este script cada vez que agregues nuevo contenido traducible

set -e

EXTRACT=false
COMPILE=false
ALL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --extract)
      EXTRACT=true
      shift
      ;;
    --compile)
      COMPILE=true
      shift
      ;;
    --all)
      ALL=true
      shift
      ;;
    *)
      echo "Uso: $0 [--extract] [--compile] [--all]"
      exit 1
      ;;
  esac
done

# Si no se especifica ningún flag, hacer todo
if [ "$EXTRACT" = false ] && [ "$COMPILE" = false ]; then
    ALL=true
fi

echo "====================================="
echo "  SPIDERHUB - Actualización de      "
echo "       Traducciones                 "
echo "====================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "manage.py" ]; then
    echo "Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# PASO 1: Extraer cadenas
if [ "$EXTRACT" = true ] || [ "$ALL" = true ]; then
    echo "1. Extrayendo cadenas de traducción..."
    echo ""
    
    echo "   → Extrayendo de templates HTML..."
    python manage.py makemessages -l es -l pt --ignore=pyspider
    
    echo "   → Extrayendo de JavaScript..."
    python manage.py makemessages -l es -l pt -d djangojs --ignore=pyspider
    
    echo ""
    echo "   ✓ Cadenas extraídas exitosamente"
    echo ""
    echo "   AHORA:"
    echo "   1. Abre locale/es/LC_MESSAGES/django.po"
    echo "   2. Abre locale/pt/LC_MESSAGES/django.po"
    echo "   3. Busca las nuevas cadenas (msgstr vacíos)"
    echo "   4. Agrega las traducciones"
    echo "   5. Ejecuta este script con --compile para compilar"
    echo ""
fi

# PASO 2: Compilar
if [ "$COMPILE" = true ] || [ "$ALL" = true ]; then
    echo "2. Compilando archivos de traducción..."
    echo ""
    
    python manage.py compilemessages
    
    echo "   ✓ Traducciones compiladas exitosamente"
    echo ""
fi

# Mostrar resumen
echo "====================================="
echo "  ARCHIVOS COMPILADOS               "
echo "====================================="
echo ""

echo "ESPAÑOL:"
ls -lh locale/es/LC_MESSAGES/*.mo | awk '{print "  " $9 ": " $5}'

echo ""
echo "PORTUGUÊS:"
ls -lh locale/pt/LC_MESSAGES/*.mo | awk '{print "  " $9 ": " $5}'

echo ""
echo "====================================="
echo "  ✓ PROCESO COMPLETADO              "
echo "====================================="
echo ""
echo "SIGUIENTE PASO:"
echo "  Reinicia el servidor Django para cargar las traducciones"
echo ""

