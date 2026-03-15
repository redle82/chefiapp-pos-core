#!/usr/bin/env bash
# =============================================================================
# Completar a equipe do Sofia Gastrobar a 5 funcionários (Fase 2 passo 3).
# Insere Bruno e Carla em gm_restaurant_people e gm_staff. Idempotente.
#
# Uso: ./scripts/core/apply-sofia-five-staff.sh
# Pré-requisito: Core no ar; seed Sofia já aplicado (3 pessoas).
# Referência: docs/ops/SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md, §5.1 RESTAURANTE_OFICIAL_VALIDACAO
# =============================================================================

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_CORE="$REPO_ROOT/docker-core"
CONTAINER_PG="chefiapp-core-postgres"
MIGRATION="$DOCKER_CORE/schema/migrations/20260416_sofia_five_staff.sql"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_PG}$"; then
  echo "❌ Container $CONTAINER_PG não está a correr. Suba o Core primeiro."
  exit 1
fi

echo "📦 Aplicando migração 5 funcionários Sofia (Bruno, Carla)..."
sed '/^-- migrate:down$/,$d' "$MIGRATION" | docker exec -i "$CONTAINER_PG" psql -U postgres -d chefiapp_core -f -
echo "✅ Equipe de 5 funcionários garantida. Validar em Admin → Config → Pessoas e no AppStaff (check-in)."
