#!/usr/bin/env bash
# ============================================================================
# vite-persistent.sh — Inicia o Vite dev server numa sessão tmux persistente.
#
# Funciona de 3 formas:
#   1) ./scripts/vite-persistent.sh          → inicia/retoma sessão tmux "vite"
#   2) ./scripts/vite-persistent.sh stop     → pára a sessão tmux
#   3) ./scripts/vite-persistent.sh status   → verifica se está ativo
#
# A sessão tmux sobrevive ao fecho do terminal. Para ver:
#   tmux attach -t vite
#
# Para parar:
#   tmux kill-session -t vite
# ============================================================================
set -euo pipefail

SESSION_NAME="vite"
PORT=5175
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORTAL_DIR="$ROOT/merchant-portal"
CERT_DIR="$PORTAL_DIR/.certs"
CERT_KEY="$CERT_DIR/localhost-key.pem"
CERT_CERT="$CERT_DIR/localhost.pem"
HTTPS_ENABLED=0

if [[ "${1:-}" == "https" ]] || [[ "${2:-}" == "https" ]]; then
  HTTPS_ENABLED=1
fi

# ── Cores ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

is_running() {
  tmux has-session -t "$SESSION_NAME" 2>/dev/null
}

port_active() {
  lsof -ti:"$PORT" >/dev/null 2>&1
}

get_local_ip() {
  ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"
}

ensure_https_certs() {
  mkdir -p "$CERT_DIR"

  if [[ -f "$CERT_KEY" && -f "$CERT_CERT" ]]; then
    return 0
  fi

  if ! command -v mkcert >/dev/null 2>&1; then
    echo -e "${RED}❌ mkcert não encontrado. Instala com: brew install mkcert nss${NC}"
    return 1
  fi

  local ip
  ip="$(get_local_ip)"
  # Evita falha por trust stores opcionais (ex.: Java keytool ausente).
  if ! TRUST_STORES=system mkcert -key-file "$CERT_KEY" -cert-file "$CERT_CERT" localhost 127.0.0.1 ::1 "$ip"; then
    if [[ -f "$CERT_KEY" && -f "$CERT_CERT" ]]; then
      return 0
    fi
    echo -e "${RED}❌ Falha ao gerar certificados HTTPS com mkcert.${NC}"
    return 1
  fi
}

# ── stop ──
if [[ "${1:-}" == "stop" ]]; then
  if is_running; then
    tmux kill-session -t "$SESSION_NAME"
    echo -e "${YELLOW}⏹  Sessão tmux '$SESSION_NAME' terminada.${NC}"
  else
    echo -e "${YELLOW}⚠  Nenhuma sessão '$SESSION_NAME' ativa.${NC}"
  fi
  # Kill any remaining process on the port
  lsof -ti:"$PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
  exit 0
fi

# ── status ──
if [[ "${1:-}" == "status" ]]; then
  if is_running && port_active; then
    echo -e "${GREEN}✅ Vite ativo — localhost:$PORT${NC}"
    echo "   tmux attach -t $SESSION_NAME  (para ver logs)"
  elif is_running; then
    echo -e "${YELLOW}⚠  Sessão tmux '$SESSION_NAME' existe mas porta $PORT não responde.${NC}"
    echo "   tmux attach -t $SESSION_NAME  (para investigar)"
  else
    echo -e "${RED}❌ Vite não está ativo.${NC}"
    echo "   ./scripts/vite-persistent.sh  (para iniciar)"
  fi
  exit 0
fi

# ── start ──

# Pre-flight: tmux available?
if ! command -v tmux >/dev/null 2>&1; then
  echo -e "${RED}❌ tmux não instalado. Instala com: brew install tmux${NC}"
  exit 1
fi

# Already running?
if is_running; then
  if port_active; then
    echo -e "${GREEN}✅ Vite já está ativo em http://localhost:$PORT${NC}"
    echo "   tmux attach -t $SESSION_NAME  (para ver logs)"
    exit 0
  else
    echo -e "${YELLOW}⚠  Sessão tmux existe mas Vite não responde. A reiniciar...${NC}"
    tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
    sleep 1
  fi
fi

# Kill any orphan process on the port
lsof -ti:"$PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 0.5

PROTO="http"
DEV_CMD="pnpm run dev"

if [[ "$HTTPS_ENABLED" -eq 1 ]]; then
  if ! ensure_https_certs; then
    exit 1
  fi
  PROTO="https"
  DEV_CMD="VITE_DEV_HTTPS=1 VITE_HTTPS_KEY=$CERT_KEY VITE_HTTPS_CERT=$CERT_CERT pnpm run dev"
fi

# Create tmux session with auto-restart loop
tmux new-session -d -s "$SESSION_NAME" -c "$PORTAL_DIR" \
  "while true; do lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true; echo '🚀 Vite a iniciar...'; $DEV_CMD 2>&1; echo ''; echo '⚠️  Vite morreu. A reiniciar em 3s...'; sleep 3; done"

echo -e "${GREEN}🚀 Vite iniciado em sessão tmux persistente!${NC}"
echo ""
echo "   URL:      $PROTO://localhost:$PORT"
if [[ "$HTTPS_ENABLED" -eq 1 ]]; then
  echo "   iPhone:   $PROTO://$(get_local_ip):$PORT"
fi
echo "   Logs:     tmux attach -t $SESSION_NAME"
echo "   Parar:    ./scripts/vite-persistent.sh stop"
echo "   Status:   ./scripts/vite-persistent.sh status"
echo ""

# Wait for port to become active (max 15s)
for i in $(seq 1 15); do
  if port_active; then
    echo -e "${GREEN}✅ Vite pronto em $PROTO://localhost:$PORT (${i}s)${NC}"
    exit 0
  fi
  sleep 1
done

echo -e "${YELLOW}⏳ Vite ainda a arrancar. Verifica: tmux attach -t $SESSION_NAME${NC}"
