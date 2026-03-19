#!/usr/bin/env bash
# Fase 3 conformance probe — verifica evidências automatizáveis (desktop-app, merchant-portal, mobile-app).
# Uso: ./scripts/fase3-conformance-probe.sh   ou   npm run audit:fase3-conformance
# Exit 0 se todos os checks passarem; 1 caso contrário.
# Nota: Em alguns ambientes o Jest do mobile-app pode falhar (ex.: Watchman); correndo fora do sandbox costuma resolver.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0

echo "╔══════════════════════════════════════════════════╗"
echo "║  Fase 3 — Conformance probe                     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# 1. Desktop-app: TerminalConfig + persistence + README flow
echo "▸ desktop-app: TerminalConfig + pairing flow..."
if ! grep -q "TerminalConfig" desktop-app/src/main.ts 2>/dev/null; then
  echo "  ✗ TerminalConfig not found in desktop-app/src/main.ts"
  FAIL=1
fi
if ! grep -q "writeTerminalConfig\|clearTerminalConfig" desktop-app/src/main.ts 2>/dev/null; then
  echo "  ✗ writeTerminalConfig/clearTerminalConfig not found"
  FAIL=1
fi
if ! grep -qi "consume_device_install_token\|consumeInstallToken" desktop-app/README.md 2>/dev/null; then
  echo "  ✗ README does not mention consume token flow"
  FAIL=1
fi
if [ $FAIL -eq 0 ]; then echo "  ✓ desktop-app structure ok"; fi

# 2. Merchant-portal: Fase 3 conformance tests
echo ""
echo "▸ merchant-portal: Fase 3 conformance tests..."
pnpm --filter merchant-portal run test:fase3-conformance || { echo "  ✗ merchant-portal test:fase3-conformance failed"; FAIL=1; }
if [ $FAIL -eq 0 ]; then echo "  ✓ merchant-portal conformance tests passed"; fi

# 3. Mobile-app: mobileActivationApi tests (role from backend)
echo ""
echo "▸ mobile-app: mobileActivationApi tests..."
pnpm --filter mobile-app test -- mobileActivationApi.test.ts || { echo "  ✗ mobile-app mobileActivationApi tests failed"; FAIL=1; }
if [ $FAIL -eq 0 ]; then echo "  ✓ mobile-app mobileActivationApi tests passed"; fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo "audit:fase3-conformance: all probes passed."
  exit 0
else
  echo "audit:fase3-conformance: one or more probes failed."
  exit 1
fi
