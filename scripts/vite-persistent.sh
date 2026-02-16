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
    echo -e "${GREEN}✅ Vite ativo — http://localhost:$PORT${NC}"
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

# Create tmux session with auto-restart loop
tmux new-session -d -s "$SESSION_NAME" -c "$PORTAL_DIR" \
  "while true; do echo '🚀 Vite a iniciar...'; pnpm run dev 2>&1; echo ''; echo '⚠️  Vite morreu. A reiniciar em 3s...'; sleep 3; done"

echo -e "${GREEN}🚀 Vite iniciado em sessão tmux persistente!${NC}"
echo ""
echo "   URL:      http://localhost:$PORT"
echo "   Logs:     tmux attach -t $SESSION_NAME"
echo "   Parar:    ./scripts/vite-persistent.sh stop"
echo "   Status:   ./scripts/vite-persistent.sh status"
echo ""

# Wait for port to become active (max 15s)
for i in $(seq 1 15); do
  if port_active; then
    echo -e "${GREEN}✅ Vite pronto em http://localhost:$PORT (${i}s)${NC}"
    exit 0
  fi
  sleep 1
done

echo -e "${YELLOW}⏳ Vite ainda a arrancar. Verifica: tmux attach -t $SESSION_NAME${NC}"
