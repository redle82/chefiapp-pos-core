#!/usr/bin/env bash
# =============================================================================
# Garante o produto SOFIA E2E PRODUCT no restaurante Sofia (id 100) para o
# smoke do circuito de catálogo (Fase 2). Idempotente.
#
# Uso: ./scripts/core/apply-sofia-e2e-product.sh
# Pré-requisito: Core no ar (docker compose -f docker-core/docker-compose.core.yml up -d)
# Referência: docs/ops/SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md, §5.1 em SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md
# =============================================================================

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_CORE="$REPO_ROOT/docker-core"
CONTAINER_PG="chefiapp-core-postgres"
MIGRATION="$DOCKER_CORE/schema/migrations/20260415_sofia_e2e_product.sql"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_PG}$"; then
  echo "❌ Container $CONTAINER_PG não está a correr. Suba o Core primeiro:"
  echo "   cd docker-core && docker compose -f docker-compose.core.yml up -d"
  exit 1
fi

echo "📦 Aplicando migração SOFIA E2E PRODUCT (idempotente)..."
# Apenas a parte migrate:up (evitar executar o DELETE do migrate:down)
sed '/^-- migrate:down$/,$d' "$MIGRATION" | docker exec -i "$CONTAINER_PG" psql -U postgres -d chefiapp_core -f -
echo "✅ SOFIA E2E PRODUCT garantido. Validar em Admin, TPV, Web, QR Mesa e Comandeiro (recarregar cada superfície)."
