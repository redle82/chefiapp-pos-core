#!/usr/bin/env bash
# ChefIApp OS — Subir o mundo (Core Docker)
# Um comando sobe o planeta: Postgres, PostgREST, Realtime, Keycloak, MinIO, pgAdmin, simulator-orders (build).
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"
echo "🚀 ChefIApp OS — subindo o mundo..."
docker compose -f docker-core/docker-compose.core.yml up -d
echo "✅ Mundo no ar."
echo ""
echo "📊 Endpoints:"
echo "   Postgres:  localhost:54320"
echo "   PostgREST: http://localhost:3001"
echo "   Realtime:  ws://localhost:4000"
echo "   Keycloak:  http://localhost:8080"
echo "   MinIO:     http://localhost:9000 (console: 9001)"
echo "   pgAdmin:   http://localhost:5050"
echo ""
echo "Simulador de pedidos: docker compose -f docker-core/docker-compose.core.yml run --rm -e COUNT=20 simulator-orders"
