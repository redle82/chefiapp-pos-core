#!/usr/bin/env bash
# =============================================================================
# Validação FASE 5 + FASE 6 — Polimento e Impressão (FASE 2 pós-vendável)
# =============================================================================
# 1. Executa gate automático: build merchant-portal + testes billing.
# 2. Imprime checklist manual para FASE 5 (polimento) e FASE 6 (impressão).
# Uso: bash scripts/flows/validate-fase5-fase6-checklist.sh
# Referência: docs/plans/FASE_2_POS_VENDAVEL_PORTUGAL.md §3–4
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "═══════════════════════════════════════════════════"
echo "  FASE 5 + FASE 6 — Gate automático + Checklist"
echo "═══════════════════════════════════════════════════"
echo ""

echo "── 1. Build merchant-portal ──"
(cd merchant-portal && pnpm run build) || {
  echo "✗ Build falhou"
  exit 1
}
echo "✓ Build OK"
echo ""

echo "── 2. Testes billing (trial/paywall) ──"
(cd merchant-portal && pnpm vitest run src/core/billing/ --reporter=verbose) || {
  echo "✗ Testes billing falharam"
  exit 1
}
echo "✓ Testes billing OK"
echo ""

echo "═══════════════════════════════════════════════════"
echo "  GATE AUTOMÁTICO: OK"
echo "═══════════════════════════════════════════════════"
echo ""
echo "── CHECKLIST MANUAL FASE 5 (Polimento) ──"
echo "  [ ] Abrir merchant-portal em dispositivo móvel (ou DevTools mobile);"
echo "      navegar até TPV; verificar tempo de carregamento e scroll fluido."
echo "  [ ] Executar ação crítica (ex.: adicionar item ao pedido, processar pagamento);"
echo "      verificar toast/feedback visual."
echo "  [ ] Confirmar que RoleSelector (se visível) não parece dev tool."
echo ""
echo "  Referência completa: docs/audit/EXECUTABLE_ROADMAP.md § FASE 5"
echo ""
echo "── CHECKLIST MANUAL FASE 6 (Impressão) ──"
echo "  [ ] Processar um pedido no TPV; imprimir recibo (browser print);"
echo "      verificar que o recibo mostra Nº documento, ATCUD, NIF e QR code AT."
echo "  [ ] Testar impressão em Chrome e Safari (ou Firefox)."
echo "  [ ] Se houver impressoras físicas configuradas, testar impressão térmica."
echo ""
echo "  Referência completa: docs/audit/EXECUTABLE_ROADMAP.md § FASE 6"
echo "═══════════════════════════════════════════════════"
