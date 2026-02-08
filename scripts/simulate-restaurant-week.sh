#!/usr/bin/env bash
# =============================================================================
# Simulação de 7 dias de restaurante só com o Core (PostgREST). Sem UI.
# Por dia: abrir caixa → N pedidos (create → pagar → IN_PREP → READY → CLOSED) → tarefas → fechar caixa.
# Uso: ./scripts/simulate-restaurant-week.sh [--days 7] [--orders-per-day 50] [--restaurant-id UUID] [--core-url URL]
# Ver: docs/contracts/WEEKLY_RESTAURANT_SIMULATION_CONTRACT.md
# =============================================================================

set -euo pipefail

CORE_URL="${CORE_URL:-http://localhost:3001}"
DAYS=7
ORDERS_PER_DAY=50
RESTAURANT_ID="${RESTAURANT_ID:-00000000-0000-0000-0000-000000000100}"
CORE_ANON_KEY="${CORE_ANON_KEY:-}"
AUTH_BEARER="${AUTH_BEARER:-}"

while [ $# -gt 0 ]; do
  case "$1" in
    --core-url) CORE_URL="$2"; shift 2 ;;
    --days) DAYS="$2"; shift 2 ;;
    --orders-per-day) ORDERS_PER_DAY="$2"; shift 2 ;;
    --restaurant-id) RESTAURANT_ID="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Headers: apikey e Authorization opcionais
CURL_HEADERS=(-H "Accept: application/json" -H "Content-Type: application/json")
[ -n "$CORE_ANON_KEY" ] && CURL_HEADERS+=(-H "apikey: $CORE_ANON_KEY")
[ -n "$AUTH_BEARER" ] && CURL_HEADERS+=(-H "Authorization: Bearer $AUTH_BEARER")

# Helper: curl que falha em non-2xx e imprime corpo
curl_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local tmp
  tmp=$(mktemp)
  local code
  if [ -n "$body" ]; then
    code=$(curl -s -w "%{http_code}" -o "$tmp" -X "$method" "$url" "${CURL_HEADERS[@]}" -d "$body")
  else
    code=$(curl -s -w "%{http_code}" -o "$tmp" -X "$method" "$url" "${CURL_HEADERS[@]}")
  fi
  if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
    echo "HTTP $code — $(cat "$tmp")"
    rm -f "$tmp"
    return 1
  fi
  cat "$tmp"
  rm -f "$tmp"
}

TOTAL_ORDERS=0
TOTAL_SHIFTS_OPENED=0
TOTAL_SHIFTS_CLOSED=0
TOTAL_TASKS=0
TOTAL_FAILED=0

echo "═══════════════════════════════════════════════════════════"
echo "  Simulação $DAYS dias — $ORDERS_PER_DAY pedidos/dia"
echo "  Restaurant: $RESTAURANT_ID | Core: $CORE_URL"
echo "═══════════════════════════════════════════════════════════"

# Verificar Core acessível
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CORE_URL/gm_restaurants?limit=0" "${CURL_HEADERS[@]}")
if [ "$STATUS" != "200" ]; then
  echo "❌ Core inacessível (GET gm_restaurants → $STATUS). Suba o Core: cd docker-core && make up"
  exit 1
fi

# Obter um produto válido (uma vez)
PRODUCT_JSON=$(curl_json GET "$CORE_URL/gm_products?restaurant_id=eq.$RESTAURANT_ID&limit=1&select=id,name,price_cents")
PRODUCT_ID=$(echo "$PRODUCT_JSON" | grep -oE '"id"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
PRODUCT_NAME=$(echo "$PRODUCT_JSON" | grep -oE '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"name"[[:space:]]*:[[:space:]]*"//;s/"$//')
PRICE=$(echo "$PRODUCT_JSON" | grep -oE '"price_cents"[[:space:]]*:[[:space:]]*[0-9]+' | head -1 | grep -oE '[0-9]+')

if [ -z "${PRODUCT_ID:-}" ] || [ -z "${PRICE:-}" ]; then
  echo "❌ Nenhum produto encontrado para restaurante $RESTAURANT_ID. Execute seeds (ex.: make reset no docker-core)."
  exit 1
fi
echo "✅ Produto: $PRODUCT_NAME (id=$PRODUCT_ID, price_cents=$PRICE)"
echo ""

for DAY in $(seq 1 "$DAYS"); do
  echo "────────────────── Dia $DAY / $DAYS ──────────────────"
  DAY_START=$(date +%s)
  DAY_ORDERS=0
  DAY_FAILED=0

  # 1) Abrir caixa via RPC
  OPEN_JSON=$(curl -s -X POST "$CORE_URL/rpc/open_cash_register_atomic" "${CURL_HEADERS[@]}" \
    -d "{\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_name\":\"Caixa Simulação D$DAY\",\"p_opened_by\":\"Simulação Core D$DAY\",\"p_opening_balance_cents\":0}" || true)

  if echo "${OPEN_JSON:-}" | grep -q 'CASH_REGISTER_ALREADY_OPEN'; then
    CASH_JSON=$(curl_json GET "$CORE_URL/gm_cash_registers?restaurant_id=eq.$RESTAURANT_ID&status=eq.open&order=opened_at.desc&limit=1&select=id")
    CASH_REGISTER_ID=$(echo "$CASH_JSON" | grep -oE '"id"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
    if [ -z "${CASH_REGISTER_ID:-}" ]; then
      echo "❌ Dia $DAY: CASH_REGISTER_ALREADY_OPEN mas não foi possível obter id da caixa aberta"
      TOTAL_FAILED=$((TOTAL_FAILED + 1))
      continue
    fi
    echo "   Turno já aberto, a usar caixa $CASH_REGISTER_ID"
  elif echo "${OPEN_JSON:-}" | grep -q '"id"' && echo "${OPEN_JSON:-}" | grep -q 'open'; then
    CASH_REGISTER_ID=$(echo "$OPEN_JSON" | grep -oE '"id"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
    TOTAL_SHIFTS_OPENED=$((TOTAL_SHIFTS_OPENED + 1))
    echo "   Turno aberto: $CASH_REGISTER_ID"
  else
    echo "❌ Dia $DAY: Falha ao abrir turno — $OPEN_JSON"
    TOTAL_FAILED=$((TOTAL_FAILED + 1))
    continue
  fi

  # 2) Obter opening_balance_cents para fecho depois
  CR_META=$(curl_json GET "$CORE_URL/gm_cash_registers?id=eq.$CASH_REGISTER_ID&restaurant_id=eq.$RESTAURANT_ID&select=opening_balance_cents")
  OPENING_CENTS=$(echo "$CR_META" | grep -oE '"opening_balance_cents"[[:space:]]*:[[:space:]]*[0-9]+' | head -1 | grep -oE '[0-9]+' || echo "0")

  # 3) Pedidos
  for i in $(seq 1 "$ORDERS_PER_DAY"); do
    METHOD="cash"
    [ $((i % 2)) -eq 0 ] && METHOD="card"

    ORDER_JSON=$(curl_json POST "$CORE_URL/rpc/create_order_atomic" \
      "{\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_items\":[{\"product_id\":\"$PRODUCT_ID\",\"name\":\"$PRODUCT_NAME\",\"quantity\":1,\"unit_price\":$PRICE}],\"p_payment_method\":\"$METHOD\"}") || {
      echo "   ❌ Pedido $i: create_order_atomic falhou"
      DAY_FAILED=$((DAY_FAILED + 1))
      continue
    }

    ORDER_ID=$(echo "$ORDER_JSON" | grep -oE '"id"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
    TOTAL_CENTS=$(echo "$ORDER_JSON" | grep -oE '"total_cents"[[:space:]]*:[[:space:]]*[0-9]+' | head -1 | grep -oE '[0-9]+')
    if [ -z "${TOTAL_CENTS:-}" ]; then
      ORD_ROW=$(curl_json GET "$CORE_URL/gm_orders?id=eq.$ORDER_ID&restaurant_id=eq.$RESTAURANT_ID&select=total_cents")
      TOTAL_CENTS=$(echo "$ORD_ROW" | grep -oE '"total_cents"[[:space:]]*:[[:space:]]*[0-9]+' | head -1 | grep -oE '[0-9]+')
    fi
    [ -z "${TOTAL_CENTS:-}" ] && TOTAL_CENTS=$PRICE

    # Associar pedido à caixa
    curl_json PATCH "$CORE_URL/gm_orders?id=eq.$ORDER_ID&restaurant_id=eq.$RESTAURANT_ID" "{\"cash_register_id\":\"$CASH_REGISTER_ID\"}" >/dev/null || true

    # Pagamento (RPC aceita p_idempotency_key)
    IDEM_KEY="sim-week-$ORDER_ID-$i"
    PAY_JSON=$(curl_json POST "$CORE_URL/rpc/process_order_payment" \
      "{\"p_order_id\":\"$ORDER_ID\",\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_cash_register_id\":\"$CASH_REGISTER_ID\",\"p_method\":\"$METHOD\",\"p_amount_cents\":${TOTAL_CENTS},\"p_idempotency_key\":\"$IDEM_KEY\"}") || {
      echo "   ❌ Pedido $i ($ORDER_ID): process_order_payment falhou"
      DAY_FAILED=$((DAY_FAILED + 1))
      continue
    }

    # IN_PREP → READY → CLOSED
    curl_json POST "$CORE_URL/rpc/update_order_status" "{\"p_order_id\":\"$ORDER_ID\",\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_new_status\":\"IN_PREP\"}" >/dev/null || { DAY_FAILED=$((DAY_FAILED + 1)); continue; }
    curl_json POST "$CORE_URL/rpc/update_order_status" "{\"p_order_id\":\"$ORDER_ID\",\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_new_status\":\"READY\"}" >/dev/null || { DAY_FAILED=$((DAY_FAILED + 1)); continue; }
    curl_json POST "$CORE_URL/rpc/update_order_status" "{\"p_order_id\":\"$ORDER_ID\",\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_new_status\":\"CLOSED\"}" >/dev/null || { DAY_FAILED=$((DAY_FAILED + 1)); continue; }

    DAY_ORDERS=$((DAY_ORDERS + 1))
    TOTAL_ORDERS=$((TOTAL_ORDERS + 1))
  done

  echo "   Pedidos dia $DAY: $DAY_ORDERS / $ORDERS_PER_DAY OK"

  # 4) Tarefas: criar 2–4, transição OPEN → ACKNOWLEDGED → RESOLVED (schema gm_tasks)
  for TASK_MSG in "Mise en place (sim D$DAY)" "Limpeza cozinha (sim D$DAY)" "Fecho caixa (sim D$DAY)"; do
    TASK_TMP=$(mktemp)
    TASK_CODE=$(curl -s -w "%{http_code}" -o "$TASK_TMP" -X POST "$CORE_URL/gm_tasks" "${CURL_HEADERS[@]}" -H "Prefer: return=representation" -H "Content-Type: application/json" \
      -d "{\"restaurant_id\":\"$RESTAURANT_ID\",\"task_type\":\"MODO_INTERNO\",\"message\":\"$TASK_MSG\",\"status\":\"OPEN\",\"priority\":\"MEDIA\",\"source_event\":\"simulate_week\"}")
    TASK_JSON=$(cat "$TASK_TMP")
    rm -f "$TASK_TMP"
    if [ "$TASK_CODE" -lt 200 ] || [ "$TASK_CODE" -ge 300 ]; then
      echo "   ❌ Dia $DAY: Falha ao criar tarefa — HTTP $TASK_CODE $TASK_JSON"
      DAY_FAILED=$((DAY_FAILED + 1))
      continue
    fi
    TASK_ID=$(echo "$TASK_JSON" | grep -oE '"id"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' || true)
    if [ -n "${TASK_ID:-}" ]; then
      curl_json PATCH "$CORE_URL/gm_tasks?id=eq.$TASK_ID&restaurant_id=eq.$RESTAURANT_ID" "{\"status\":\"ACKNOWLEDGED\",\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >/dev/null || true
      curl_json PATCH "$CORE_URL/gm_tasks?id=eq.$TASK_ID&restaurant_id=eq.$RESTAURANT_ID" "{\"status\":\"RESOLVED\",\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >/dev/null || true
      TOTAL_TASKS=$((TOTAL_TASKS + 1))
    fi
  done
  echo "   Tarefas dia $DAY: OK"

  # 5) Fechar caixa: closing_balance_cents = opening_balance_cents + soma gm_payments (cash_register_id)
  PAYMENTS_JSON=$(curl_json GET "$CORE_URL/gm_payments?cash_register_id=eq.$CASH_REGISTER_ID&select=amount_cents")
  SUM_CENTS=0
  while read -r val; do
    [ -n "$val" ] && SUM_CENTS=$((SUM_CENTS + val))
  done < <(echo "$PAYMENTS_JSON" | grep -oE '"amount_cents"[[:space:]]*:[[:space:]]*[0-9]+' | grep -oE '[0-9]+')
  CLOSING_CENTS=$((OPENING_CENTS + SUM_CENTS))
  NOW_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  curl_json PATCH "$CORE_URL/gm_cash_registers?id=eq.$CASH_REGISTER_ID&restaurant_id=eq.$RESTAURANT_ID" \
    "{\"status\":\"closed\",\"closing_balance_cents\":$CLOSING_CENTS,\"closed_at\":\"$NOW_ISO\",\"closed_by\":\"simulate-restaurant-week\",\"updated_at\":\"$NOW_ISO\"}" >/dev/null || {
    echo "   ❌ Dia $DAY: Falha ao fechar caixa"
    DAY_FAILED=$((DAY_FAILED + 1))
    TOTAL_FAILED=$((TOTAL_FAILED + 1))
    DAY_END=$(date +%s)
    echo "   Tempo dia $DAY: $((DAY_END - DAY_START))s"
    echo ""
    continue
  }
  TOTAL_SHIFTS_CLOSED=$((TOTAL_SHIFTS_CLOSED + 1))
  echo "   Caixa fechada (closing_balance_cents=$CLOSING_CENTS)"

  TOTAL_FAILED=$((TOTAL_FAILED + DAY_FAILED))
  DAY_END=$(date +%s)
  echo "   Tempo dia $DAY: $((DAY_END - DAY_START))s"
  echo ""
done

echo "═══════════════════════════════════════════════════════════"
echo "  Resumo: $TOTAL_ORDERS pedidos | $TOTAL_SHIFTS_OPENED turnos abertos | $TOTAL_SHIFTS_CLOSED turnos fechados | $TOTAL_TASKS tarefas | falhas: $TOTAL_FAILED"
echo "═══════════════════════════════════════════════════════════"

if [ "$TOTAL_FAILED" -gt 0 ]; then
  echo "FALHOU — houve $TOTAL_FAILED falhas estruturais."
  exit 1
fi

echo "PASSOU — simulação concluída sem erros estruturais. Execute scripts/validate-week-simulation.sh para validar."
exit 0
