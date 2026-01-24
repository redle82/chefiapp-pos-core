#!/bin/bash
# ==============================================================================
# ChefIApp - Chaos Test Runner
# ==============================================================================
# Uso: ./run-chaos.sh [--full] [--quick]
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Config
MODE=${1:-"quick"}
DURATION=60
ORDER_RATE=30
TASK_RATE=15

if [ "$MODE" == "--full" ]; then
  DURATION=300
  ORDER_RATE=100
  TASK_RATE=50
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}🔥 CHEFIAPP CHAOS TEST RUNNER${NC}"
echo "═══════════════════════════════════════════════════════════"
echo "   Mode: $MODE"
echo "   Duration: ${DURATION}s"
echo "   Order Rate: ${ORDER_RATE}/min"
echo "   Task Rate: ${TASK_RATE}/min"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ==============================================================================
# FASE 1: Verificar infraestrutura
# ==============================================================================

echo -e "${YELLOW}📦 FASE 1: Verificando infraestrutura...${NC}"

# Verificar Docker
if ! docker compose ps postgres | grep -q "running"; then
  echo -e "${RED}   ❌ Postgres não está rodando!${NC}"
  echo "   Execute: make start"
  exit 1
fi

echo -e "${GREEN}   ✅ Infraestrutura OK${NC}"

# ==============================================================================
# FASE 2: Verificar seed
# ==============================================================================

echo ""
echo -e "${YELLOW}🌱 FASE 2: Verificando dados...${NC}"

RESTAURANT_COUNT=$(docker compose exec -T postgres psql -U postgres -d chefiapp_test -t -c "SELECT COUNT(*) FROM gm_restaurants" 2>/dev/null | tr -d ' ')

if [ -z "$RESTAURANT_COUNT" ] || [ "$RESTAURANT_COUNT" -lt 5 ]; then
  echo "   ⚠️  Poucos restaurantes ($RESTAURANT_COUNT). Executando seed..."
  docker compose exec -T postgres psql -U postgres -d chefiapp_test -f /docker-entrypoint-initdb.d/seed-10.sql
  RESTAURANT_COUNT=10
fi

echo -e "${GREEN}   ✅ $RESTAURANT_COUNT restaurantes prontos${NC}"

# ==============================================================================
# FASE 3: Executar testes de integridade
# ==============================================================================

echo ""
echo -e "${YELLOW}🧪 FASE 3: Testes de integridade...${NC}"

cd chaos
npm install --silent 2>/dev/null || true
DATABASE_URL="postgres://postgres:postgres@localhost:54399/chefiapp_test" node chaos-test.js
cd ..

# ==============================================================================
# FASE 4: Simulação de carga
# ==============================================================================

echo ""
echo -e "${YELLOW}🔥 FASE 4: Simulação de carga (${DURATION}s)...${NC}"

cd simulators
npm install --silent 2>/dev/null || true

# Rodar simuladores em paralelo
echo "   Starting order simulator..."
DATABASE_URL="postgres://postgres:postgres@localhost:54399/chefiapp_test" \
  ORDER_RATE=$ORDER_RATE \
  DURATION=$DURATION \
  CONCURRENCY=5 \
  node simulate-orders.js &
ORDER_PID=$!

echo "   Starting task simulator..."
DATABASE_URL="postgres://postgres:postgres@localhost:54399/chefiapp_test" \
  TASK_RATE=$TASK_RATE \
  DURATION=$DURATION \
  node simulate-tasks.js &
TASK_PID=$!

# Aguardar
wait $ORDER_PID
wait $TASK_PID

cd ..

# ==============================================================================
# FASE 5: Verificação final
# ==============================================================================

echo ""
echo -e "${YELLOW}✅ FASE 5: Verificação final...${NC}"

# Contar dados gerados
ORDERS=$(docker compose exec -T postgres psql -U postgres -d chefiapp_test -t -c "SELECT COUNT(*) FROM gm_orders WHERE source = 'simulator'" 2>/dev/null | tr -d ' ')
ITEMS=$(docker compose exec -T postgres psql -U postgres -d chefiapp_test -t -c "SELECT COUNT(*) FROM gm_order_items" 2>/dev/null | tr -d ' ')
TASKS=$(docker compose exec -T postgres psql -U postgres -d chefiapp_test -t -c "SELECT COUNT(*) FROM gm_tasks" 2>/dev/null | tr -d ' ')

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}📊 CHAOS TEST COMPLETO${NC}"
echo "═══════════════════════════════════════════════════════════"
echo "   Restaurantes: $RESTAURANT_COUNT"
echo "   Pedidos criados: $ORDERS"
echo "   Items criados: $ITEMS"
echo "   Tarefas criadas: $TASKS"
echo "═══════════════════════════════════════════════════════════"
echo ""
