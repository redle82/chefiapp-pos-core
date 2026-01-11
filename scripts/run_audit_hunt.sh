#!/usr/bin/env bash
# CHEFIAPP POS CORE — Execute Massive Audit Hunt
# Executa o protocolo completo de caça-falha

set -euo pipefail

PROJECT_ROOT="/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core"
cd "$PROJECT_ROOT"

echo "================================================"
echo "CHEFIAPP MASSIVE AUDIT HUNT"
echo "Protocolo Caça-Falha Completo"
echo "================================================"
echo ""

# Criar diretórios necessários
mkdir -p audit-reports
mkdir -p /tmp/chefiapp_seed_miner

# Função para rodar e capturar resultado
run_test() {
    local name="$1"
    local cmd="$2"
    
    echo ""
    echo "================================================"
    echo "EXECUTANDO: $name"
    echo "================================================"
    echo "Comando: $cmd"
    echo ""
    
    if eval "$cmd"; then
        echo "✓ PASSOU: $name"
        return 0
    else
        echo "✗ FALHOU: $name"
        return 1
    fi
}

# 1. PILOT (Sanity Check)
echo "[1/3] PILOT TEST — Sanity Check"
run_test "PILOT" "WORLD_SEED=1337 \
WORLD_RESTAURANTS=5 \
WORLD_TABLES_PER_RESTAURANT=10 \
WORLD_ORDERS_PER_RESTAURANT=50 \
WORLD_CONCURRENCY=5 \
WORLD_DUPLICATE_WEBHOOK_PROB=0.10 \
WORLD_FISCAL_OFFLINE_PROB=0.20 \
npm run test:massive" || {
    echo ""
    echo "PILOT falhou! Verifique a configuração básica antes de continuar."
    exit 1
}

# 2. MASSIVE (World Simulation)
echo ""
echo "[2/3] MASSIVE TEST — World Simulation"
run_test "MASSIVE" "WORLD_SEED=20251222 \
WORLD_RESTAURANTS=50 \
WORLD_TABLES_PER_RESTAURANT=20 \
WORLD_ORDERS_PER_RESTAURANT=200 \
WORLD_CONCURRENCY=20 \
WORLD_BATCH_SIZE=200 \
WORLD_TIMEOUT_MS=300000 \
WORLD_DUPLICATE_WEBHOOK_PROB=0.05 \
WORLD_DELAYED_WEBHOOK_MAX_MS=5000 \
WORLD_FISCAL_OFFLINE_PROB=0.10 \
npm run test:massive" || {
    echo ""
    echo "MASSIVE falhou! Seed: 20251222"
    echo "Reduza a escala:"
    echo "  ./scripts/seed_reducer.sh 20251222"
    exit 1
}

# 3. STRESS (Extreme Load)
echo ""
echo "[3/3] STRESS TEST — Extreme Load"
run_test "STRESS" "WORLD_SEED=999001 \
WORLD_RESTAURANTS=100 \
WORLD_TABLES_PER_RESTAURANT=30 \
WORLD_ORDERS_PER_RESTAURANT=500 \
WORLD_CONCURRENCY=50 \
WORLD_TIMEOUT_MS=600000 \
WORLD_DUPLICATE_WEBHOOK_PROB=0.20 \
WORLD_DELAYED_WEBHOOK_MAX_MS=10000 \
WORLD_FISCAL_OFFLINE_PROB=0.30 \
npm run test:massive" || {
    echo ""
    echo "STRESS falhou! (Esperado sob carga extrema)"
    echo "Seed: 999001"
    echo "Reduza a escala:"
    echo "  ./scripts/seed_reducer.sh 999001"
}

echo ""
echo "================================================"
echo "AUDIT COMPLETO"
echo "================================================"
echo ""
echo "Relatórios gerados em: ./audit-reports/"
echo ""
echo "Próximos passos:"
echo ""
echo "1. Verificar relatório principal:"
echo "   cat audit-reports/audit-report.md"
echo ""
echo "2. Rodar Seed Miner (caça-falha):"
echo "   ./scripts/seed_miner.sh 1 1000"
echo ""
echo "3. Testar com Failpoints (injeção de falhas):"
echo "   FAILPOINT_ENABLED=true FAILPOINT_PROB=0.01 WORLD_SEED=1337 npm run test:massive"
echo ""
echo "================================================"
