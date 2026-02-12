#!/usr/bin/env bash
# =============================================================================
# Aplica migrations em falta no Postgres do Docker Core (em execução).
# Elimina 400 em gm_restaurants (receipt_extra_text, google_place_id, etc.)
# e 404 em gm_customers.
#
# Uso: ./scripts/core/apply-missing-migrations.sh
# Pré-requisito: docker compose -f docker-core/docker-compose.core.yml up -d
# =============================================================================

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL_FILE="$REPO_ROOT/docker-core/schema/migrations/apply_missing_for_admin_config.sql"
CONTAINER="chefiapp-core-postgres"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "❌ Ficheiro não encontrado: $SQL_FILE"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "❌ Container $CONTAINER não está a correr. Suba o Core primeiro:"
  echo "   docker compose -f docker-core/docker-compose.core.yml up -d"
  exit 1
fi

echo "📌 Aplicar patch ao Postgres (gm_restaurants + gm_customers)..."
docker exec -i "$CONTAINER" psql -U postgres -d chefiapp_core -f - < "$SQL_FILE"
echo "✅ Patch aplicado. Recarrega a app para os 400/404 desaparecerem."
