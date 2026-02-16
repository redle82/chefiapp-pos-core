#!/usr/bin/env bash
# Abre o AppStaff no emulador Android apontando ao Metro na porta indicada.
# Uso: ./scripts/open-android-with-bundler.sh [porta]
# Ex.: ./scripts/open-android-with-bundler.sh 8082

set -e
PORT="${1:-8082}"
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"

# 10.0.2.2 = host machine a partir do emulador Android
BUNDLER_URL="http://10.0.2.2:${PORT}"

echo "Metro na porta ${PORT} -> Bundler URL: ${BUNDLER_URL}"

"$ADB" reverse "tcp:${PORT}" "tcp:${PORT}"
"$ADB" shell am force-stop com.goldmonkey.chefiapp
"$ADB" shell am start -a android.intent.action.VIEW \
  -d "chefiapp-pos://expo-development-client/?url=${BUNDLER_URL}" \
  -n com.goldmonkey.chefiapp/.MainActivity

echo "App aberto. Se não carregar, confirma que o Metro está a correr: npx expo start --port ${PORT}"
