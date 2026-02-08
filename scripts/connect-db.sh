#!/bin/bash
# =============================================================================
# Conectar ao Banco de Dados Docker Core
# =============================================================================
# Script para conectar facilmente ao banco principal (Docker Core)
# =============================================================================

set -e

CONTAINER_NAME="chefiapp-core-postgres"
DB_NAME="chefiapp_core"
DB_USER="postgres"

# Verificar se o container está rodando
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Erro: Container ${CONTAINER_NAME} não está rodando"
    echo ""
    echo "Para subir o Docker Core:"
    echo "  cd docker-core"
    echo "  docker compose -f docker-compose.core.yml up -d"
    exit 1
fi

echo "🔌 Conectando ao banco ${DB_NAME}..."
echo "   Container: ${CONTAINER_NAME}"
echo "   Usuário: ${DB_USER}"
echo ""

# Conectar ao banco
docker exec -it ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}