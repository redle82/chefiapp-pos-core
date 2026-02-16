#!/usr/bin/env bash
# =============================================================================
# CHEFIAPP — Demo: Emitir pedidos como vários empregados (mesmo restaurante)
# =============================================================================
# Cria pedidos via create_order_atomic com sync_metadata por “empregado” (Garçom 1,
# Garçom 2, Cozinha, etc.) para ver no KDS e no telemóvel do dono em tempo real.
#
# Pré-requisitos:
#   - Core a correr (Docker): http://localhost:3001/rest/v1/
#   - Seeds carregados (restaurante + produtos)
#   - TPV com turno aberto (opcional; o RPC não exige)
#
# Uso:
#   ./scripts/ops/run-demo-orders.sh
#   NUM_ORDERS=8 ./scripts/ops/run-demo-orders.sh
#   CORE_URL=http://192.168.1.10:3001 ./scripts/ops/run-demo-orders.sh
# =============================================================================
set -euo pipefail

CORE_URL="${CORE_URL:-http://localhost:3001}"
API="${CORE_URL}/rest/v1"
ANON_KEY="${CORE_ANON_KEY:-chefiapp-core-secret-key-min-32-chars-long}"
RESTAURANT_ID="${RESTAURANT_ID:-00000000-0000-0000-0000-000000000100}"
NUM_ORDERS="${NUM_ORDERS:-6}"

# Emuladores de empregados (origin + role para sync_metadata)
ROLES=("waiter" "waiter" "kitchen" "waiter" "kitchen" "waiter")
ORIGINS=("GARÇOM" "GARÇOM" "COZINHA" "GARÇOM" "COZINHA" "GARÇOM")
TABLES=(1 2 3 4 5 6)

api() {
  local method="$1" path="$2" data="${3:-}"
  local args=(-sS -X "$method" -H "apikey: ${ANON_KEY}" -H "Content-Type: application/json" -H "Prefer: return=representation")
  [ -n "$data" ] && args+=(-d "$data")
  curl "${args[@]}" "${API}${path}"
}

echo "═══════════════════════════════════════════════════════════"
echo "  Demo pedidos — mesmo restaurante, vários empregados"
echo "  Core: $CORE_URL | Restaurante: $RESTAURANT_ID | Pedidos: $NUM_ORDERS"
echo "═══════════════════════════════════════════════════════════"

# 1) Health
HTTP=$(curl -sS -o /dev/null -w "%{http_code}" "${API}/" -H "apikey: ${ANON_KEY}" 2>/dev/null) || HTTP="000"
if [ "$HTTP" != "200" ]; then
  echo "❌ Core não responde (HTTP $HTTP). Suba o Docker Core."
  exit 1
fi
echo "✅ Core OK"

# 2) Produtos (primeiros 3 para variar nos pedidos)
PRODUCTS_JSON=$(api GET "/gm_products?restaurant_id=eq.${RESTAURANT_ID}&select=id,name,price_cents&limit=5" 2>/dev/null) || true
if ! echo "$PRODUCTS_JSON" | grep -q '"id"'; then
  echo "❌ Nenhum produto. Execute seeds (docker-core/schema/seeds_dev.sql ou make reset)."
  exit 1
fi
# Extrair primeiro produto para payload (id, name, price_cents)
PRODUCT_ID=$(echo "$PRODUCTS_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
PRODUCT_NAME=$(echo "$PRODUCTS_JSON" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
PRICE=$(echo "$PRODUCTS_JSON" | grep -o '"price_cents":[0-9]*' | head -1 | cut -d: -f2)
[ -z "$PRICE" ] && PRICE=500
echo "✅ Produto: $PRODUCT_NAME (${PRICE}c)"

# 3) (Opcional) Abrir turno para consistência TPV
OPEN_JSON=$(api POST "/rpc/open_cash_register_atomic" "{\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_name\":\"Caixa Demo\",\"p_opened_by\":\"demo-orders\",\"p_opening_balance_cents\":0}" 2>/dev/null) || true
if echo "$OPEN_JSON" | grep -q 'CASH_REGISTER_ALREADY_OPEN'; then
  echo "✅ Turno já aberto"
elif echo "$OPEN_JSON" | grep -q '"id"'; then
  echo "✅ Turno aberto"
else
  echo "⚠️ Turno não aberto (continuando na mesma)"
fi

# 4) Criar N pedidos com “autor” diferente (origem ASCII para evitar problemas de encoding no shell)
echo ""
echo "Criando $NUM_ORDERS pedidos (KDS + telemóvel dono)..."
for i in $(seq 0 $((NUM_ORDERS - 1))); do
  role="${ROLES[$((i % ${#ROLES[@]}))]}"
  origin="${ORIGINS[$((i % ${#ORIGINS[@]}))]}"
  table="${TABLES[$((i % ${#TABLES[@]}))]}"
  qty=$((i % 2 + 1))
  # sync_metadata: origem e “empregado” para relatórios/dono (JSON sem espaços desnecessários)
  SYNC_META="{\"origin\":\"$origin\",\"created_by_role\":\"$role\",\"table_number\":$table}"
  # Escapar nome do produto para JSON (aspas)
  NAME_ESC=$(echo "$PRODUCT_NAME" | sed 's/"/\\"/g')
  ITEMS="[{\"product_id\":\"$PRODUCT_ID\",\"name\":\"$NAME_ESC\",\"quantity\":$qty,\"unit_price\":$PRICE}]"
  PAYLOAD="{\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_items\":$ITEMS,\"p_payment_method\":\"cash\",\"p_sync_metadata\":$SYNC_META}"
  ORDER_JSON=$(api POST "/rpc/create_order_atomic" "$PAYLOAD" 2>&1) || true
  if echo "$ORDER_JSON" | grep -q '"id"'; then
    OID=$(echo "$ORDER_JSON" | grep -o '"id"[^"]*"[^"]*"' | head -1 | sed 's/.*"\([0-9a-f-]*\)".*/\1/')
    [ -z "$OID" ] && OID=$(echo "$ORDER_JSON" | grep -o '[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}' | head -1)
    echo "  ✅ Pedido $((i+1))/$NUM_ORDERS — Mesa $table ($origin / $role) → ${OID:0:8}..."
  else
    echo "  ❌ Pedido $((i+1)) falhou: $ORDER_JSON"
  fi
  sleep 0.5
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Pedidos emitidos. Verifique:"
echo "  - KDS (web /op/kds ou tab Cozinha no AppStaff)"
echo "  - Telemóvel dono (AppStaff — visão em tempo real)"
echo "═══════════════════════════════════════════════════════════"
