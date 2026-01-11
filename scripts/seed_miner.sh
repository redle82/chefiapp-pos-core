#!/usr/bin/env bash
# CHEFIAPP POS CORE — Seed Miner
# Varre seeds sequencialmente até encontrar o primeiro que falha
# Uso: ./scripts/seed_miner.sh [START] [END]

set -euo pipefail

START="${1:-1}"
END="${2:-5000}"
LOG_DIR="/tmp/chefiapp_seed_miner"
REPORT_DIR="./audit-reports"

# Criar diretórios necessários
mkdir -p "$LOG_DIR"
mkdir -p "$REPORT_DIR"

echo "================================================"
echo "CHEFIAPP SEED MINER — Caça-Falha"
echo "================================================"
echo "Range: SEED=$START to $END"
echo "Logs: $LOG_DIR/audit_seed_*.log"
echo "Reports: $REPORT_DIR/audit-seed-*.{json,md}"
echo "================================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
FIRST_FAIL=""

for SEED in $(seq "$START" "$END"); do
  echo "==> Testing SEED=$SEED..."
  
  LOG_FILE="$LOG_DIR/audit_seed_$SEED.log"
  REPORT_JSON="$REPORT_DIR/audit-seed-$SEED.json"
  REPORT_MD="$REPORT_DIR/audit-seed-$SEED.md"
  
  # Exportar variáveis para o teste conseguir ler
  export WORLD_SEED="$SEED"
  export AUDIT_REPORT_JSON="$REPORT_JSON"
  export AUDIT_REPORT_MD="$REPORT_MD"
  
  if npm run test:massive >"$LOG_FILE" 2>&1; then
    echo "    ✓ PASS SEED=$SEED"
    PASS_COUNT=$((PASS_COUNT + 1))
    
    # Limpar logs de sucesso (economizar espaço)
    rm -f "$LOG_FILE"
  else
    echo "    ✗ FAIL SEED=$SEED"
    echo ""
    echo "================================================"
    echo "FALHA ENCONTRADA!"
    echo "================================================"
    echo "Seed que falhou: $SEED"
    echo "Log completo: $LOG_FILE"
    echo "Report JSON: $REPORT_JSON"
    echo "Report MD: $REPORT_MD"
    echo ""
    echo "Para reproduzir:"
    echo "  WORLD_SEED=$SEED npm run test:massive"
    echo ""
    echo "Para reduzir escala (minimizar falha):"
    echo "  WORLD_SEED=$SEED WORLD_RESTAURANTS=10 WORLD_ORDERS_PER_RESTAURANT=50 npm run test:massive"
    echo "================================================"
    
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FIRST_FAIL="$SEED"
    
    # Mostrar últimas linhas do log
    echo ""
    echo "Últimas 30 linhas do log:"
    echo "---"
    tail -n 30 "$LOG_FILE"
    echo "---"
    
    # Parar no primeiro fail (comportamento padrão)
    exit 1
  fi
done

echo ""
echo "================================================"
echo "SEED MINER — Resultado Final"
echo "================================================"
echo "Seeds testados: $START-$END"
echo "Passou: $PASS_COUNT"
echo "Falhou: $FAIL_COUNT"
echo "================================================"

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "✓ Nenhuma falha encontrada no range $START-$END"
  exit 0
else
  echo "✗ Primeira falha: SEED=$FIRST_FAIL"
  exit 1
fi
