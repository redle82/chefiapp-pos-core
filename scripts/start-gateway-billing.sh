#!/usr/bin/env bash
# Integration gateway para checkout Stripe (página Suscripción → Cambiar plan).
# Uso: pnpm run dev:gateway   (en otro terminal: pnpm -w merchant-portal run dev)
# Con STRIPE_SECRET_KEY=sk_test_... el checkout devuelve URL de Stripe.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PORT="${PORT:-4320}"
export INTERNAL_API_TOKEN="${INTERNAL_API_TOKEN:-chefiapp-internal-token-dev}"

if [ -z "${STRIPE_SECRET_KEY}" ]; then
  echo "⚠️  STRIPE_SECRET_KEY no definida: el checkout devolverá 503."
  echo "   Para probar Stripe: STRIPE_SECRET_KEY=sk_test_... $0"
  echo ""
fi

# Check Stripe price mappings (needed for plan slug → price_xxx resolution)
if [ -z "${STRIPE_PRICE_STARTER}" ] && [ -z "${STRIPE_PRICE_PRO}" ] && [ -z "${STRIPE_PRICE_ENTERPRISE}" ]; then
  echo "⚠️  STRIPE_PRICE_* no definidas: el checkout necesita mapear plan slugs a price IDs."
  echo "   Ejemplo: STRIPE_PRICE_STARTER=price_xxx STRIPE_PRICE_PRO=price_xxx STRIPE_PRICE_ENTERPRISE=price_xxx $0"
  echo ""
fi

echo "=== Integration Gateway (billing) — http://localhost:$PORT ==="
exec pnpm run server:integration-gateway
