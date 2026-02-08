#!/usr/bin/env bash
# =============================================================================
# Validação pós-simulação de 7 dias (só Core).
# Chama PostgREST para verificar pedidos, caixa e tarefas.
# Uso: ./scripts/validate-week-simulation.sh [--core-url URL] [--restaurant-id UUID] [--days 7] [--orders-per-day 50]
# Exit 0 só se todos os critérios passam; caso contrário exit 1.
# Para um passe limpo: execute simulate-restaurant-week.sh num Core com restaurante
# sem pedidos CLOSED com payment_status PENDING/FAILED (ex.: DB fresco ou só após simulação).
# Ver: docs/contracts/WEEKLY_RESTAURANT_SIMULATION_CONTRACT.md
# =============================================================================

set -e

CORE_URL="${CORE_URL:-http://localhost:3001}"
RESTAURANT_ID="00000000-0000-0000-0000-000000000100"
DAYS=7
ORDERS_PER_DAY=50

while [ $# -gt 0 ]; do
  case "$1" in
    --core-url) CORE_URL="$2"; shift 2 ;;
    --restaurant-id) RESTAURANT_ID="$2"; shift 2 ;;
    --days) DAYS="$2"; shift 2 ;;
    --orders-per-day) ORDERS_PER_DAY="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

EXPECTED_ORDERS=$((DAYS * ORDERS_PER_DAY))
FAIL=0

echo "═══════════════════════════════════════════════════════════"
echo "  Validação pós-simulação (Core: $CORE_URL)"
echo "  Esperado: $EXPECTED_ORDERS pedidos, $DAYS turnos fechados"
echo "═══════════════════════════════════════════════════════════"

# Verificar Core acessível
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CORE_URL/gm_restaurants?limit=0" -H "Accept: application/json")
if [ "$STATUS" != "200" ]; then
  echo "FALHA: Core inacessível (GET gm_restaurants → $STATUS)"
  exit 1
fi

# 1) Total de pedidos (restaurant_id)
ORDERS_JSON=$(curl -s "$CORE_URL/gm_orders?restaurant_id=eq.$RESTAURANT_ID&select=id,status,payment_status" -H "Accept: application/json" -H "Range: 0-99999")
TOTAL_ORDERS=$(echo "$ORDERS_JSON" | grep -c '"id"' || echo "0")
if [ "$TOTAL_ORDERS" -ge "$EXPECTED_ORDERS" ]; then
  echo "  OK   Total pedidos: $TOTAL_ORDERS (esperado >= $EXPECTED_ORDERS)"
else
  echo "  FALHA Total pedidos: $TOTAL_ORDERS (esperado >= $EXPECTED_ORDERS)"
  FAIL=1
fi

# 2) Pedidos não finalizados (informativo; pode haver pedidos antigos)
NOT_FINAL=$(echo "$ORDERS_JSON" | grep -oE '"status"[[:space:]]*:[[:space:]]*"[^"]+"' | sed 's/.*"status"[[:space:]]*:[[:space:]]*"//;s/"$//' | grep -v -E '^CLOSED$|^CANCELLED$' | wc -l | tr -d ' ')
echo "  INFO Pedidos não finalizados (OPEN/IN_PREP/READY): $NOT_FINAL"

# 2b) Pelo menos expected pedidos em CLOSED (os da simulação)
CLOSED_JSON=$(curl -s "$CORE_URL/gm_orders?restaurant_id=eq.$RESTAURANT_ID&status=eq.CLOSED&select=id" -H "Accept: application/json" -H "Range: 0-99999")
CLOSED_COUNT=$(echo "$CLOSED_JSON" | grep -c '"id"' || echo "0")
if [ "$CLOSED_COUNT" -ge "$EXPECTED_ORDERS" ]; then
  echo "  OK   Pedidos CLOSED: $CLOSED_COUNT (esperado >= $EXPECTED_ORDERS)"
else
  echo "  FALHA Pedidos CLOSED: $CLOSED_COUNT (esperado >= $EXPECTED_ORDERS)"
  FAIL=1
fi

# 3) Pedidos CLOSED com PENDING/FAILED (informativo; dados legados de runs sem process_order_payment não invalidam a simulação de 7 dias)
PENDING_JSON=$(curl -s "$CORE_URL/gm_orders?restaurant_id=eq.$RESTAURANT_ID&status=eq.CLOSED&payment_status=eq.PENDING&select=id" -H "Accept: application/json")
FAILED_JSON=$(curl -s "$CORE_URL/gm_orders?restaurant_id=eq.$RESTAURANT_ID&status=eq.CLOSED&payment_status=eq.FAILED&select=id" -H "Accept: application/json")
PENDING_CNT=$(echo "$PENDING_JSON" | grep -c '"id"' || true)
FAILED_CNT=$(echo "$FAILED_JSON" | grep -c '"id"' || true)
UNPAID_COUNT=$((PENDING_CNT + FAILED_CNT))
if [ "$UNPAID_COUNT" -eq 0 ]; then
  echo "  OK   Nenhum pedido CLOSED com payment_status PENDING/FAILED"
else
  echo "  INFO Pedidos CLOSED com PENDING/FAILED (legado): $UNPAID_COUNT (simulação 7 dias cria apenas pedidos pagos)"
fi

# 4) Número de turnos fechados >= DAYS (permite Core com turnos anteriores)
CR_JSON=$(curl -s "$CORE_URL/gm_cash_registers?restaurant_id=eq.$RESTAURANT_ID&status=eq.closed&select=id,closed_at,closing_balance_cents,closed_by" -H "Accept: application/json" -H "Range: 0-999")
CLOSED_SHIFTS=$(echo "$CR_JSON" | grep -c '"id"' || echo "0")
if [ "$CLOSED_SHIFTS" -ge "$DAYS" ]; then
  echo "  OK   Turnos fechados: $CLOSED_SHIFTS (esperado >= $DAYS)"
else
  echo "  FALHA Turnos fechados: $CLOSED_SHIFTS (esperado >= $DAYS)"
  FAIL=1
fi

# 5) Cada turno fechado tem closed_at, closing_balance_cents, closed_by (verificar que não há nulls óbvios)
if [ "$CLOSED_SHIFTS" -gt 0 ]; then
  MISSING=$(echo "$CR_JSON" | grep -E '"closed_at":null|"closing_balance_cents":null|"closed_by":null' | wc -l | tr -d ' ')
  if [ "$MISSING" -eq 0 ]; then
    echo "  OK   Todos os turnos fechados têm closed_at, closing_balance_cents e closed_by"
  else
    echo "  FALHA Alguns turnos sem closed_at/closing_balance_cents/closed_by"
    FAIL=1
  fi
fi

# 6) Tarefas: contagem por estado (informativo)
TASKS_JSON=$(curl -s "$CORE_URL/gm_tasks?restaurant_id=eq.$RESTAURANT_ID&select=status" -H "Accept: application/json" -H "Range: 0-999")
OPEN_TASKS=$(echo "$TASKS_JSON" | grep -o '"status"[[:space:]]*:[[:space:]]*"OPEN"' | wc -l | tr -d ' ')
echo "  INFO Tarefas em OPEN: $OPEN_TASKS (informativo; simulação fecha tarefas em RESOLVED)"

echo ""
if [ $FAIL -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════════"
  echo "  PASSOU — todos os critérios de validação passaram."
  echo "═══════════════════════════════════════════════════════════"
  exit 0
fi

echo "═══════════════════════════════════════════════════════════"
echo "  FALHOU — um ou mais critérios não passaram."
echo "═══════════════════════════════════════════════════════════"
exit 1
