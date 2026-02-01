#!/usr/bin/env bash
# =============================================================================
# open-appstaff-ios-xcode.sh — Abre o AppStaff no Xcode para correr no simulador
# =============================================================================
# Quando "expo run:ios" falha com "Unable to find a destination" / "iOS 26.2 is not installed",
# o Xcode CLI não vê os simuladores. Abrir no Xcode e correr à mão resolve.
#
# USAGE:
#   ./scripts/open-appstaff-ios-xcode.sh
#
# Depois no Xcode:
#   1. No topo, escolher destino: "iPhone 16 Pro" (ou outro simulador)
#   2. Cmd+R (Run)
# =============================================================================

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE="$REPO_ROOT/mobile-app/ios/ChefiAppPOS.xcworkspace"

if [ ! -d "$WORKSPACE" ]; then
  echo "❌ Workspace não encontrado: $WORKSPACE"
  echo "   Corra primeiro: cd mobile-app && npx expo prebuild"
  exit 1
fi

echo "Abrindo AppStaff no Xcode..."
echo "  No Xcode: escolha o simulador (ex: iPhone 16 Pro) e prima Cmd+R"
open "$WORKSPACE"
