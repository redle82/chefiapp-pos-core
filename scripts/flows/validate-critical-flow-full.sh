#!/usr/bin/env bash
# =============================================================================
# CHEFIAPP — Full critical flow validation (single + load + optional chaos)
# =============================================================================
# Runs: run-critical-flow.sh, then run-critical-flow-load.sh.
# Optionally: run-critical-flow-chaos.sh if CRITICAL_FLOW_CHAOS=1.
#
# Usage:
#   bash scripts/flows/validate-critical-flow-full.sh
#   CRITICAL_FLOW_CHAOS=1 bash scripts/flows/validate-critical-flow-full.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "═══════════════════════════════════════════════════"
echo "  Full Critical Flow Validation"
echo "═══════════════════════════════════════════════════"

echo ""
echo "── 1. Single critical flow ──"
bash scripts/flows/run-critical-flow.sh || { echo "✗ Critical flow failed."; exit 1; }

echo ""
echo "── 2. Load simulation ──"
bash scripts/flows/run-critical-flow-load.sh || { echo "✗ Load failed."; exit 1; }

if [ "${CRITICAL_FLOW_CHAOS:-0}" = "1" ]; then
  echo ""
  echo "── 3. Chaos (network failure) ──"
  bash scripts/flows/run-critical-flow-chaos.sh || { echo "✗ Chaos failed."; exit 1; }
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Full Critical Flow: OK"
echo "═══════════════════════════════════════════════════"
