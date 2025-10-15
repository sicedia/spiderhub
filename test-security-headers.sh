#!/bin/bash

# Script para verificar los headers de seguridad HSTS
# Uso: ./test-security-headers.sh https://tu-dominio.com

URL="${1:-https://localhost}"

echo "=========================================="
echo "Probando headers de seguridad en: $URL"
echo "=========================================="
echo ""

echo "1️⃣  Testing ROOT endpoint (/):"
echo "-------------------------------------------"
curl -I -k "$URL/" 2>/dev/null | grep -i "strict-transport-security\|x-content-type\|x-frame-options\|x-xss"
echo ""

echo "2️⃣  Testing STATIC files (/static/favicon.ico):"
echo "-------------------------------------------"
curl -I -k "$URL/static/favicon.ico" 2>/dev/null | grep -i "strict-transport-security\|x-content-type\|x-frame-options\|x-xss"
echo ""

echo "3️⃣  Testing API endpoint (example):"
echo "-------------------------------------------"
curl -I -k "$URL/api/" 2>/dev/null | grep -i "strict-transport-security\|x-content-type\|x-frame-options\|x-xss"
echo ""

echo "4️⃣  Full headers from root:"
echo "-------------------------------------------"
curl -I -k "$URL/" 2>/dev/null
echo ""

echo "=========================================="
echo "Verificación completa"
echo "=========================================="
echo ""
echo "✅ El header DEBE incluir:"
echo "   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload"
echo ""
echo "Si no ves estos headers, el problema puede ser:"
echo "  1. Nginx no se reinició correctamente"
echo "  2. El archivo nginx.conf no se montó correctamente"
echo "  3. Estás probando con HTTP en lugar de HTTPS"
echo ""

