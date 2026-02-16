#!/usr/bin/env bash
# =============================================================================
# ChefIApp — Instalar app no emulador Android Medium_Phone
# =============================================================================
# O emulador Medium_Phone_API_36.0 (ou Medium_Phone_API_30) pode não ter o
# ChefIApp instalado. Este script instala via:
#   A) expo run:android com o AVD Medium_Phone selecionado, ou
#   B) adb install do APK debug se já tiver sido construído.
#
# Pré-requisitos:
#   - Metro a correr (ex.: porta 8081) para o bundle carregar
#   - Emulador Medium_Phone ligado, ou selecionar esse AVD antes de correr
#   - Para bundle no dispositivo: adb reverse tcp:8081 tcp:8081
#
# Uso:
#   ./scripts/ops/install-app-android-medium-phone.sh
#   ./scripts/ops/install-app-android-medium-phone.sh apk   # só instalar APK
#   ./scripts/ops/install-app-android-medium-phone.sh run  # expo run:android
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MOBILE_APP="$REPO_ROOT/mobile-app"
APK_PATH="${MOBILE_APP}/android/app/build/outputs/apk/debug/app-debug.apk"

MODE="${1:-run}"

echo "═══════════════════════════════════════════════════════════"
echo "  ChefIApp — Instalar app no Android (Medium_Phone)"
echo "  Modo: $MODE"
echo "═══════════════════════════════════════════════════════════"

list_devices() {
  if command -v adb >/dev/null 2>&1; then
    echo "Dispositivos Android ligados:"
    adb devices -l | sed -n '2,$p' || true
  else
    echo "adb não encontrado. Instale Android SDK / platform-tools."
    exit 1
  fi
}

install_apk() {
  if [ ! -f "$APK_PATH" ]; then
    echo "APK não encontrado em $APK_PATH"
    echo "Construir primeiro: cd mobile-app && pnpm run android (ou npx expo run:android)"
    exit 1
  fi
  echo "A instalar APK em dispositivo(s) Android..."
  adb install -r "$APK_PATH" || {
    echo "Se tiver vários dispositivos, use: adb -s <device_id> install -r $APK_PATH"
    exit 1
  }
  echo "✅ App instalado. Abra o ChefIApp no emulador."
}

run_expo_android() {
  echo "A executar expo run:android (selecionar AVD Medium_Phone se pedido)..."
  cd "$MOBILE_APP"
  pnpm run android || npx expo run:android
  echo "✅ Build e instalação concluídos (ou falha acima)."
}

case "$MODE" in
  apk)
    list_devices
    install_apk
    ;;
  run)
    list_devices
    run_expo_android
    ;;
  *)
    echo "Uso: $0 [run|apk]"
    echo "  run — expo run:android (build + instalação)"
    echo "  apk — instalar apenas app-debug.apk se já existir"
    exit 1
    ;;
esac

echo ""
echo "Para o bundle carregar no emulador: adb reverse tcp:8081 tcp:8081"
echo "Para o Core no emulador: adb reverse tcp:3001 tcp:3001"
echo "═══════════════════════════════════════════════════════════"
