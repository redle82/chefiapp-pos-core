#!/usr/bin/env bash
# =============================================================================
# Validação FASE 2 — Pós-Vendável Portugal
# =============================================================================
# Executa: testes billing (trial/paywall) + fluxo crítico Core.
# Uso: bash scripts/flows/validate-fase2.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "═══════════════════════════════════════════════════"
echo "  FASE 2 — Validação (billing + Core)"
echo "═══════════════════════════════════════════════════"
echo ""

echo "── 1. Testes billing (trial_ends_at + paywall) ──"
(cd merchant-portal && pnpm vitest run src/core/billing/ --reporter=verbose) || {
  echo "✗ Testes billing falharam"
  exit 1
}
echo "✓ Testes billing passaram"
echo ""

echo "── 2. Fluxo crítico (Core health + seed) ──"
bash scripts/flows/run-critical-flow.sh || {
  echo "✗ Fluxo crítico falhou (subir Core: cd docker-core && make up)"
  exit 1
}
echo ""

echo "═══════════════════════════════════════════════════"
echo "  FASE 2 VALIDAÇÃO: OK"
echo "═══════════════════════════════════════════════════"
