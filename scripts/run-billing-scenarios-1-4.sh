#!/usr/bin/env bash
# Lista comandos e passos para cenários 1–4 do Billing Stress Test.
# Runbook completo: docs/ops/BILLING_STRESS_TEST_RUNBOOK_SCENARIOS_1-4.md
# Uso: ./scripts/run-billing-scenarios-1-4.sh [--validate]
#   --validate  executa primeiro scripts/run-billing-pix-sumup-validation.sh

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ "${1:-}" == "--validate" ]]; then
  echo "=== Validação prévia (gateway 4320) ==="
  bash "$REPO_ROOT/scripts/run-billing-pix-sumup-validation.sh"
  echo ""
fi

echo "=== Pré-requisitos ==="
echo "  Portal:    pnpm -w merchant-portal run dev   # porta 5175"
echo "  Gateway:   pnpm run dev:gateway              # porta 4320 (billing)"
echo "  Stripe:    https://dashboard.stripe.com/test/webhooks"
echo "  Stripe:    https://dashboard.stripe.com/test/subscriptions"
echo ""

echo "=== Cenário 1: Trial → Active ==="
echo "  1.1 Stripe: subscription Active para restaurant_id de teste"
echo "  1.2 Stripe: webhook customer.subscription.updated ou invoice.paid recebido"
echo "  1.3 DB:     SELECT id, billing_status FROM gm_restaurants WHERE id = '<restaurant_id>';  # = active"
echo "  1.4 Browser: http://localhost:5175/app/billing  (sessão do restaurante)"
echo "  1.5 Navegar TPV/operação → acesso permitido"
echo ""

echo "=== Cenário 2: Active → Past_due ==="
echo "  2.1 Stripe: enviar evento teste invoice.payment_failed (ou simular falha)"
echo "  2.2 DB:     SELECT billing_status FROM gm_restaurants WHERE id = '<restaurant_id>';  # = past_due"
echo "  2.3 Browser: recarregar portal → banner 'Pagamento pendente' + CTA /app/billing"
echo "  2.4 TPV/operação: aviso ou BlockingScreen → /app/billing"
echo ""

echo "=== Cenário 3: Past_due → Active ==="
echo "  3.1 Stripe: evento invoice.paid (ou resolver falha no Dashboard)"
echo "  3.2 DB:     billing_status = active"
echo "  3.3 Browser: recarregar portal → sem banner dunning"
echo "  3.4 TPV/operação → sem bloqueio"
echo ""

echo "=== Cenário 4: Cancelado ==="
echo "  4.1 Stripe: cancelar subscription ou evento customer.subscription.deleted"
echo "  4.2 DB:     billing_status = canceled"
echo "  4.3 Browser: /app/staff/home ou TPV → GlobalBlockedView + CTA /app/billing"
echo "  4.4 /app/billing → abre (Safe Harbor)"
echo "  4.5 /app/console e /app/setup → acesso permitido (Safe Harbor)"
echo ""

echo "=== Verificação DB (após cada cenário) ==="
echo "  gm_restaurants.billing_status = esperado"
echo "  merchant_subscriptions.status consistente"
echo "  gm_restaurants.trial_ends_at coerente"
echo "  gm_restaurants.last_billing_event_at avança"
echo ""
echo "Registo: preencher tabela em docs/ops/BILLING_STRESS_TEST_CHECKLIST.md"
