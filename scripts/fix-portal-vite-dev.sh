#!/usr/bin/env bash
# Fix merchant-portal dev server when Vite fails with:
#   "Cannot find module '.../vite/dist/node/chunks/dist.js'"
# Run from repo root. Ensures Vite 6 (override), clears caches, reinstalls.
#
# Usage:
#   pnpm run fix:portal-dev          # clear Vite cache + pnpm install
#   DEEP=1 pnpm run fix:portal-dev   # also remove node_modules (clean reinstall)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -n "${DEEP}" ]; then
  echo "0/5 — Modo DEEP: a remover node_modules (raiz + merchant-portal)..."
  rm -rf node_modules merchant-portal/node_modules
fi

echo "1/4 — Limpando cache do Vite em merchant-portal..."
rm -rf merchant-portal/node_modules/.vite 2>/dev/null || true

echo "2/4 — Aplicando overrides (Vite 6) e reinstalando dependências..."
pnpm install

echo "3/4 — Verificando versão do Vite resolvida..."
if command -v pnpm >/dev/null 2>&1; then
  (cd merchant-portal && pnpm list vite 2>/dev/null | head -5) || true
fi

echo "4/4 — Pronto. Para iniciar o dev server:"
echo "      pnpm --filter merchant-portal run dev"
echo ""
echo "Se o erro continuar, corre: DEEP=1 pnpm run fix:portal-dev"
