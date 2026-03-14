#!/usr/bin/env bash
# =============================================================================
# Aplica migrações de device pairing (Admin > TPVs > "Gerar código").
# Cria create_device_pairing_code e consume_device_pairing_code no Core e
# reinicia o PostgREST para recarregar o schema (evita 404 PGRST202).
#
# Uso: ./scripts/core/apply-device-pairing-migrations.sh
# Pré-requisito: Core no ar (docker compose -f docker-core/docker-compose.core.yml up -d)
# =============================================================================

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_CORE="$REPO_ROOT/docker-core"
COMPOSE_FILE="$DOCKER_CORE/docker-compose.core.yml"
CONTAINER_PG="chefiapp-core-postgres"
CONTAINER_PGREST="chefiapp-core-postgrest"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_PG}$"; then
  echo "❌ Container $CONTAINER_PG não está a correr. Suba o Core primeiro:"
  echo "   cd docker-core && make up"
  exit 1
fi

echo "📦 1/2 Aplicando device_install_tokens..."
docker exec -i "$CONTAINER_PG" psql -U postgres -d chefiapp_core -f - < "$DOCKER_CORE/schema/migrations/20260303_device_install_tokens.sql"
echo "✅ device_install_tokens aplicado."

echo "📦 2/2 Aplicando device_pairing_code RPCs..."
docker exec -i "$CONTAINER_PG" psql -U postgres -d chefiapp_core -f - < "$DOCKER_CORE/schema/migrations/20260410_device_pairing_code_rpcs.sql"
echo "✅ device_pairing_code RPCs aplicados."

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_PGREST}$"; then
  echo "🔄 Reiniciando PostgREST para recarregar o schema..."
  docker compose -f "$COMPOSE_FILE" restart postgrest
  echo "✅ PostgREST reiniciado. Testa novamente «Gerar código» em Admin > TPVs."
else
  echo "⚠️  PostgREST não está a correr; inicia o Core (make up) para o schema ser usado."
fi
