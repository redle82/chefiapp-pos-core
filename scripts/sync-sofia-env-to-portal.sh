#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_SRC="$ROOT_DIR/.env.sofia"
ENV_DST="$ROOT_DIR/merchant-portal/.env.local"

if [[ ! -f "$ENV_SRC" ]]; then
  echo "ERROR: .env.sofia not found. Run first: bash scripts/sofia-e2e.sh"
  exit 1
fi

echo "Syncing .env.sofia -> merchant-portal/.env.local"

# shellcheck disable=SC1090
source "$ENV_SRC"

cat > "$ENV_DST" <<EOF
# Auto-generated from .env.sofia
VITE_API_BASE=http://localhost:${WEB_MODULE_PORT:-4320}
VITE_INTERNAL_API_TOKEN=${INTERNAL_API_TOKEN:-dev-token}
VITE_RESTAURANT_ID=${WEB_MODULE_RESTAURANT_ID:-}
VITE_DEFAULT_SLUG=${WEB_MODULE_SLUG:-sofia-gastrobar}
VITE_MENU_ITEM_ID=${MENU_ITEM_ID:-}
EOF

echo "Wrote $ENV_DST"
echo "Next: cd merchant-portal && npm run dev"
