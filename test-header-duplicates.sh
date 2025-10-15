#!/bin/bash

# Script para verificar si hay headers duplicados
# Uso: ./test-header-duplicates.sh https://localhost

URL="${1:-https://localhost}"

echo "========================================="
echo "Verificando headers duplicados en: $URL"
echo "========================================="
echo ""

test_duplicates() {
    local endpoint="$1"
    local description="$2"
    
    echo "🔍 Probando: $description"
    echo "Endpoint: $endpoint"
    echo "-------------------------------------------"
    
    # Obtener headers completos
    headers=$(curl -I -k "$endpoint" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "  ❌ Error al conectar con el endpoint"
        echo ""
        return
    fi
    
    # Array de headers a verificar
    security_headers=(
        "strict-transport-security"
        "x-content-type-options"
        "x-frame-options"
        "x-xss-protection"
        "referrer-policy"
        "permissions-policy"
    )
    
    has_duplicates=false
    
    for header in "${security_headers[@]}"; do
        # Contar cuántas veces aparece el header (case-insensitive)
        count=$(echo "$headers" | grep -i "^$header:" | wc -l)
        
        if [ "$count" -gt 1 ]; then
            echo "  ❌ $header aparece $count veces:"
            echo "$headers" | grep -i "^$header:" | sed 's/^/     - /'
            has_duplicates=true
        elif [ "$count" -eq 1 ]; then
            value=$(echo "$headers" | grep -i "^$header:" | head -n1)
            echo "  ✅ $value"
        else
            echo "  ⚠️  $header: (no presente)"
        fi
    done
    
    if [ "$has_duplicates" = false ]; then
        echo ""
        echo "  ✅ No se detectaron headers duplicados"
    fi
    
    echo ""
}

# Probar diferentes endpoints
test_duplicates "$URL/" "Página principal"
test_duplicates "$URL/static/favicon.ico" "Archivos estáticos"

echo "========================================="
echo "Verificación completa"
echo "========================================="
echo ""
echo "ℹ️  Interpretación de resultados:"
echo "  ✅ = Header presente una sola vez (correcto)"
echo "  ❌ = Header duplicado (problema)"
echo "  ⚠️  = Header no presente (puede ser normal según el contexto)"
echo ""

