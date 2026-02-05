#!/usr/bin/env bash
# ChefIApp OS — Parar o mundo (Core Docker)
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"
echo "🛑 ChefIApp OS — parando o mundo..."
docker compose -f docker-core/docker-compose.core.yml down
echo "✅ Mundo parado."
