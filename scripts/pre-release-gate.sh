#!/usr/bin/env bash
# Pre-release gate — sequência mínima para evidência inter-app antes de release.
# Obrigatório: audit:fase3-conformance.
# Opcional: health Core (se CORE_URL definido); audit:billing-core (se DATABASE_URL definido).
# Uso: ./scripts/pre-release-gate.sh   ou   npm run audit:pre-release
# Ref: docs/roadmap/F53_GOLDEN_PATH_EVIDENCE.md

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0

echo "╔══════════════════════════════════════════════════╗"
echo "║  Pre-release gate (F5.3)                        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Opcional: health Core (só se CORE_URL definido)
if [[ -n "${CORE_URL:-}" ]]; then
  echo "▸ Core health (CORE_URL=$CORE_URL)..."
  if bash scripts/core/health-check-core.sh; then
    echo "  ✓ Core health ok"
  else
    echo "  ✗ Core health failed"
    FAIL=1
  fi
  echo ""
else
  echo "▸ Core health: skipped (CORE_URL not set)"
  echo ""
fi

# Obrigatório: Fase 3 conformance (portal + desktop structure + mobile)
echo "▸ Fase 3 conformance (required)..."
if npm run audit:fase3-conformance; then
  echo "  ✓ audit:fase3-conformance passed"
else
  echo "  ✗ audit:fase3-conformance failed"
  FAIL=1
fi
echo ""

# Opcional: billing Core (só se DATABASE_URL definido)
if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "▸ Billing Core audit..."
  if npm run audit:billing-core; then
    echo "  ✓ audit:billing-core passed"
  else
    echo "  ✗ audit:billing-core failed"
    FAIL=1
  fi
  echo ""
else
  echo "▸ Billing Core audit: skipped (DATABASE_URL not set)"
  echo ""
fi

if [[ $FAIL -eq 0 ]]; then
  echo "audit:pre-release: all steps passed."
  exit 0
else
  echo "audit:pre-release: one or more steps failed."
  exit 1
fi
