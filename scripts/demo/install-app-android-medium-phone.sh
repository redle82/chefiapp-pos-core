#!/usr/bin/env bash
# Instala o ChefIApp (mobile-app) no emulador Android Medium_Phone.
# Pré-requisitos: Android SDK, AVD Medium_Phone (ou similar), Metro opcional na 8081.
# Uso: ./scripts/demo/install-app-android-medium-phone.sh
# Ou, com APK já construído: adb -s <device_id> install -r android/app/build/outputs/apk/debug/app-debug.apk

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "ChefIApp — Instalar app no Android (Medium_Phone ou dispositivo ligado)"
echo "Directório: $REPO_ROOT"
echo ""

# Opção 1: Instalar APK se já existir (mais rápido para repetir a demo)
APK_PATH="mobile-app/android/app/build/outputs/apk/debug/app-debug.apk"
if [[ -f "$APK_PATH" ]]; then
  echo "APK encontrado: $APK_PATH"
  DEVICES=$(adb devices -l | grep -v "List" | grep "device$" | awk '{print $1}')
  if [[ -z "$DEVICES" ]]; then
    echo "Nenhum dispositivo/emulador ligado. Inicie o AVD Medium_Phone e execute novamente."
    echo "Alternativa: cd mobile-app && pnpm android  # compila e instala com Expo"
    exit 1
  fi
  # Se houver só um dispositivo, usa-o; senão lista para o utilizador escolher
  COUNT=$(echo "$DEVICES" | wc -l | tr -d ' ')
  if [[ "$COUNT" -eq 1 ]]; then
    adb -s "$DEVICES" install -r "$APK_PATH"
    echo "App instalado no dispositivo $DEVICES"
  else
    echo "Dispositivos ligados:"
    echo "$DEVICES"
    echo "Para instalar num dispositivo específico: adb -s <device_id> install -r $APK_PATH"
    adb install -r "$APK_PATH"
  fi
  exit 0
fi

# Opção 2: Compilar e instalar com Expo (selecionar AVD Medium_Phone quando pedido)
echo "APK não encontrado. A compilar e instalar com Expo (mobile-app)..."
echo "Certifique-se de que o emulador Medium_Phone está a correr ou selecione-o quando o Expo pedir."
cd mobile-app
pnpm android
