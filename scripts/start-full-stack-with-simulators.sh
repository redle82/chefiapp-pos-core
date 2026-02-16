#!/usr/bin/env bash
#
# Inicializa o sistema completo:
# - Servidor web (merchant-portal) na porta 5175
# - Core Docker (opcional)
# - Metro Expo (mobile-app) na porta 8081
# - Simulador iOS com AppStaff (Expo)
# - Simulador Android com AppStaff (Expo), se disponível
# - Navegador: marketing (/) e web de configuração (/app/dashboard)
#
# Uso: bash scripts/start-full-stack-with-simulators.sh
# Ou:  pnpm run start:full (se adicionado ao package.json)
#

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT_WEB="${PORT:-5175}"
PORT_METRO="8081"
BASE_URL="http://localhost:${PORT_WEB}"

echo "=============================================="
echo "  ChefIApp — Inicializar sistema completo"
echo "=============================================="
echo ""

# 1) Opcional: Core Docker
if command -v docker >/dev/null 2>&1 && [ -f "docker-core/docker-compose.core.yml" ]; then
  echo "[1/6] Core Docker..."
  (cd docker-core && docker compose -f docker-compose.core.yml up -d 2>/dev/null) || true
  sleep 2
else
  echo "[1/6] Core Docker: ignorado (docker não encontrado ou ficheiro inexistente)"
fi

# 2) Libertar portas se em uso
echo "[2/6] Portas ${PORT_WEB} e ${PORT_METRO}..."
lsof -ti:${PORT_WEB} | xargs kill -9 2>/dev/null || true
lsof -ti:${PORT_METRO} | xargs kill -9 2>/dev/null || true
sleep 2

# 3) Servidor web (merchant-portal)
echo "[3/6] Servidor web (merchant-portal) em ${BASE_URL}..."
pnpm --filter merchant-portal run dev &
WEB_PID=$!
echo "      PID: $WEB_PID"

# Esperar o servidor web estar pronto
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" --max-time 2 "${BASE_URL}/" 2>/dev/null | grep -q "200\|304"; then
    echo "      Servidor web pronto."
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "      Aviso: timeout à espera do servidor web; continuando."
  fi
done

# 4) Metro Expo (mobile-app) — um único Metro para iOS e Android
echo "[4/6] Metro Expo (mobile-app) na porta ${PORT_METRO}..."
(cd mobile-app && CI=1 npx expo start --port ${PORT_METRO} 2>/dev/null) &
METRO_PID=$!
echo "      PID: $METRO_PID"

# Esperar Metro estar a escutar
for i in $(seq 1 25); do
  if (curl -s -o /dev/null --max-time 1 "http://localhost:${PORT_METRO}/" 2>/dev/null) || (command -v nc >/dev/null 2>&1 && nc -z localhost ${PORT_METRO} 2>/dev/null); then
    echo "      Metro pronto."
    break
  fi
  sleep 1
  if [ "$i" -eq 25 ]; then
    echo "      Aviso: timeout à espera do Metro; continuando."
  fi
done

# 5) Simuladores iOS e Android (conectam ao Metro já em execução)
echo "[5/6] Simuladores iOS e Android com AppStaff..."

# iOS: abre simulador e carrega o app (usa Metro em localhost:8081)
(cd mobile-app && npx expo run:ios --no-build-cache 2>/dev/null) &
IOS_PID=$!
echo "      iOS: iniciado (PID: $IOS_PID). O simulador pode demorar a abrir."

# Android: tenta abrir emulador; falha silenciosa se não houver SDK/emulador
(sleep 20 && cd mobile-app && npx expo run:android 2>/dev/null) &
ANDROID_PID=$!
echo "      Android: em segundo plano (pode falhar se não houver emulador)."

# 6) Navegador: marketing + configuração
echo "[6/6] Navegador: marketing e web de configuração..."
sleep 2
if command -v open >/dev/null 2>&1; then
  open "${BASE_URL}/"
  sleep 0.8
  open "${BASE_URL}/app/dashboard"
  echo "      Abriu: ${BASE_URL}/ (marketing) e ${BASE_URL}/app/dashboard (configuração)"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${BASE_URL}/" &
  sleep 0.8
  xdg-open "${BASE_URL}/app/dashboard" &
  echo "      Abriu: ${BASE_URL}/ e ${BASE_URL}/app/dashboard"
else
  echo "      Abra manualmente: ${BASE_URL}/ e ${BASE_URL}/app/dashboard"
fi

echo ""
echo "=============================================="
echo "  Sistema em execução"
echo "=============================================="
echo "  Web (marketing + config): ${BASE_URL}/ e ${BASE_URL}/app/dashboard"
echo "  AppStaff web:            ${BASE_URL}/app/staff/home"
echo "  Metro Expo:              http://localhost:${PORT_METRO}"
echo "  iOS:                     simulador deve abrir com o app"
echo "  Android:                 emulador (se disponível)"
echo ""
echo "  Para parar: pkill -f 'vite' 2>/dev/null; pkill -f 'expo start' 2>/dev/null; pkill -f 'expo run' 2>/dev/null"
echo ""
