#!/usr/bin/env bash
# ChefIApp OS — Simular caos (restart de um serviço do Core)
# Uso: ./scripts/chef-world-chaos.sh [serviço]
# Serviço default: postgrest (API). Outros: postgres, nginx, realtime.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"
SERVICE="${1:-postgrest}"
echo "💣 ChefIApp OS — chaos: restart de $SERVICE..."
docker compose -f docker-core/docker-compose.core.yml restart "$SERVICE"
echo "✅ $SERVICE reiniciado. Observa KDS/TPV para reconexão."
