#!/bin/bash
# =============================================================================
# Executar Consulta SQL no Banco Docker Core
# =============================================================================
# Uso: ./scripts/query-db.sh "SELECT * FROM gm_restaurants LIMIT 5;"
# =============================================================================

set -e

CONTAINER_NAME="chefiapp-core-postgres"
DB_NAME="chefiapp_core"
DB_USER="postgres"

# Verificar se o container está rodando
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Erro: Container ${CONTAINER_NAME} não está rodando"
    exit 1
fi

# Verificar se foi passada uma query
if [ -z "$1" ]; then
    echo "❌ Erro: Forneça uma query SQL"
    echo ""
    echo "Uso: $0 \"SELECT * FROM gm_restaurants LIMIT 5;\""
    echo ""
    echo "Exemplos:"
    echo "  $0 \"SELECT id, name FROM gm_restaurants LIMIT 5;\""
    echo "  $0 \"SELECT COUNT(*) FROM gm_orders;\""
    echo "  $0 \"SELECT * FROM gm_tables WHERE is_active = true;\""
    exit 1
fi

QUERY="$1"

echo "🔍 Executando query..."
echo "   Query: ${QUERY}"
echo ""

# Executar query
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "${QUERY}"