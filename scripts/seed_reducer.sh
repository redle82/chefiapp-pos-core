#!/usr/bin/env bash
# CHEFIAPP POS CORE — Seed Reducer
# Reduz progressivamente a escala mantendo o seed que falhou
# Uso: ./scripts/seed_reducer.sh [SEED]

set -euo pipefail

SEED="${1:-1337}"
LOG_DIR="/tmp/chefiapp_seed_reducer"
REPORT_DIR="./audit-reports"

mkdir -p "$LOG_DIR"
mkdir -p "$REPORT_DIR"

echo "================================================"
echo "CHEFIAPP SEED REDUCER — Minimizador de Falha"
echo "================================================"
echo "Seed: $SEED"
echo "Objetivo: Encontrar o mundo mínimo que ainda falha"
echo "================================================"
echo ""

# Níveis de redução progressiva
declare -a LEVELS=(
  # Level 1: Mundo médio
  "RESTAURANTS=50 TABLES=20 ORDERS=200 CONCURRENCY=20"
  # Level 2: Mundo pequeno
  "RESTAURANTS=20 TABLES=10 ORDERS=100 CONCURRENCY=10"
  # Level 3: Mundo tiny
  "RESTAURANTS=10 TABLES=10 ORDERS=50 CONCURRENCY=10"
  # Level 4: Mundo minimal
  "RESTAURANTS=5 TABLES=5 ORDERS=30 CONCURRENCY=5"
  # Level 5: Mundo micro
  "RESTAURANTS=3 TABLES=5 ORDERS=20 CONCURRENCY=5"
  # Level 6: Mundo nano (quase unitário)
  "RESTAURANTS=1 TABLES=3 ORDERS=10 CONCURRENCY=3"
)

MINIMAL_LEVEL=""
MINIMAL_CONFIG=""

for LEVEL_IDX in "${!LEVELS[@]}"; do
  LEVEL_CONFIG="${LEVELS[$LEVEL_IDX]}"
  
  # Parse config
  eval "$LEVEL_CONFIG"
  
  echo "==> Level $LEVEL_IDX: R=$RESTAURANTS T=$TABLES O=$ORDERS C=$CONCURRENCY"
  
  LOG_FILE="$LOG_DIR/reduce_level${LEVEL_IDX}_seed${SEED}.log"
  
  # Exportar todas as variáveis
  export WORLD_SEED="$SEED"
  export WORLD_RESTAURANTS="$RESTAURANTS"
  export WORLD_TABLES_PER_RESTAURANT="$TABLES"
  export WORLD_ORDERS_PER_RESTAURANT="$ORDERS"
  export WORLD_CONCURRENCY="$CONCURRENCY"
  
  if npm run test:massive >"$LOG_FILE" 2>&1; then
    echo "    ✓ PASSOU neste nível (falha desapareceu)"
    echo "    Nível anterior era o mínimo reproduzível"
    break
  else
    echo "    ✗ FALHOU neste nível"
    MINIMAL_LEVEL="$LEVEL_IDX"
    MINIMAL_CONFIG="$LEVEL_CONFIG"
    
    # Copiar log para fácil acesso
    cp "$LOG_FILE" "$LOG_DIR/minimal_fail_seed${SEED}.log"
  fi
  
  echo ""
done

echo ""
echo "================================================"
echo "SEED REDUCER — Resultado"
echo "================================================"
echo "Seed: $SEED"

if [ -z "$MINIMAL_LEVEL" ]; then
  echo "Status: Bug não reproduzido em nenhum nível"
  echo "Possível falha intermitente ou dependente de timing"
else
  eval "$MINIMAL_CONFIG"
  echo "Status: ✗ Bug reproduzido"
  echo "Nível mínimo: $MINIMAL_LEVEL"
  echo ""
  echo "Configuração mínima que falha:"
  echo "  WORLD_SEED=$SEED"
  echo "  WORLD_RESTAURANTS=$RESTAURANTS"
  echo "  WORLD_TABLES_PER_RESTAURANT=$TABLES"
  echo "  WORLD_ORDERS_PER_RESTAURANT=$ORDERS"
  echo "  WORLD_CONCURRENCY=$CONCURRENCY"
  echo ""
  echo "Comando para reproduzir:"
  echo "  WORLD_SEED=$SEED WORLD_RESTAURANTS=$RESTAURANTS WORLD_TABLES_PER_RESTAURANT=$TABLES WORLD_ORDERS_PER_RESTAURANT=$ORDERS WORLD_CONCURRENCY=$CONCURRENCY npm run test:massive"
  echo ""
  echo "Log: $LOG_DIR/minimal_fail_seed${SEED}.log"
fi

echo "================================================"
