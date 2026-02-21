#!/bin/bash
# Vite Persistent Server - Auto-restart on crash

cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

PID_FILE="/tmp/vite-server.pid"
LOG_FILE="/tmp/vite-server.log"

start_vite() {
    echo "[$(date)] 🚀 Iniciando Vite..." | tee -a "$LOG_FILE"
    pnpm --filter merchant-portal run dev > "$LOG_FILE" 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"
    echo "[$(date)] ✅ Vite iniciado com PID $PID" | tee -a "$LOG_FILE"
}

check_vite() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ! kill -0 $PID 2>/dev/null; then
            echo "[$(date)] ⚠️ Vite caiu (PID $PID não existe). Reiniciando..." | tee -a "$LOG_FILE"
            return 1
        fi
    else
        return 1
    fi
    return 0
}

# Iniciar Vite
start_vite

# Loop de vigilância - verificar a cada 5 segundos
while true; do
    sleep 5
    if ! check_vite; then
        start_vite
    fi
done
