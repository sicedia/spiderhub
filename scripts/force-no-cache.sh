#!/bin/bash
# Script para activar/desactivar el modo de no-cache forzado
# Uso: ./scripts/force-no-cache.sh 24
#      ./scripts/force-no-cache.sh --disable

ENV_FILE="${ENV_FILE:-.env.production}"
HOURS="${1:-24}"

# Función para obtener la fecha en formato ISO
get_iso8601_date() {
    local hours_from_now=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        date -u -v+${hours_from_now}H +"%Y-%m-%dT%H:%M:%SZ"
    else
        # Linux
        date -u -d "+${hours_from_now} hours" +"%Y-%m-%dT%H:%M:%SZ"
    fi
}

# Función para actualizar el archivo .env
update_env_file() {
    local file_path=$1
    local key=$2
    local value=$3
    
    if [ ! -f "$file_path" ]; then
        echo "❌ Archivo $file_path no encontrado" >&2
        return 1
    fi
    
    # Si el valor está vacío, eliminar la línea
    if [ -z "$value" ]; then
        sed -i.bak "/^${key}=/d" "$file_path"
        rm -f "${file_path}.bak"
    else
        # Reemplazar o agregar la línea
        if grep -q "^${key}=" "$file_path"; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i.bak "s|^${key}=.*|${key}=${value}|" "$file_path"
            else
                sed -i "s|^${key}=.*|${key}=${value}|" "$file_path"
            fi
            rm -f "${file_path}.bak"
        else
            echo "${key}=${value}" >> "$file_path"
        fi
    fi
    
    return 0
}

if [ "$1" == "--disable" ]; then
    echo "🔄 Desactivando modo no-cache forzado..."
    if update_env_file "$ENV_FILE" "FORCE_NO_CACHE_UNTIL" ""; then
        echo "✅ Variable FORCE_NO_CACHE_UNTIL eliminada del archivo $ENV_FILE"
        echo "📝 Para aplicar los cambios, reinicia los contenedores:"
        echo "   docker-compose restart web"
    fi
else
    EXPIRY_DATE=$(get_iso8601_date "$HOURS")
    echo "🚀 Activando modo no-cache forzado por $HOURS horas..."
    echo "   Expira: $EXPIRY_DATE"
    
    if update_env_file "$ENV_FILE" "FORCE_NO_CACHE_UNTIL" "$EXPIRY_DATE"; then
        echo "✅ Variable FORCE_NO_CACHE_UNTIL configurada en $ENV_FILE"
        echo "📝 Para aplicar los cambios, reinicia los contenedores:"
        echo "   docker-compose restart web"
        echo ""
        echo "💡 El modo no-cache se desactivará automáticamente después de $HOURS horas"
    fi
fi

