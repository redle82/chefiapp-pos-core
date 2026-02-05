#!/usr/bin/env bash
# =============================================================================
# Execução em massa do fluxo canónico: criar N pedidos e percorrer OPEN → IN_PREP → READY (→ CLOSED).
# Simula TPV (create_order_atomic) + KDS (update_order_status) sem UI.
# Uso: ./scripts/run-canonical-orders-bulk.sh [N]   (default N=200)
# Core: CORE_URL (default http://localhost:3001)
# =============================================================================

set -e
N="${1:-200}"
CORE_URL="${CORE_URL:-http://localhost:3001}"
RESTAURANT_ID="00000000-0000-0000-0000-000000000100"

echo "═══════════════════════════════════════════════════════════"
echo "  Fluxo canónico em massa: $N pedidos (TPV → Core → KDS)"
echo "  Core: $CORE_URL"
echo "═══════════════════════════════════════════════════════════"

# 1) Obter um produto válido
PRODUCT_JSON=$(curl -s "$CORE_URL/gm_products?restaurant_id=eq.$RESTAURANT_ID&limit=1&select=id,name,price_cents" -H "Accept: application/json")
PRODUCT_ID=$(echo "$PRODUCT_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
PRODUCT_NAME=$(echo "$PRODUCT_JSON" | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//;s/"$//')
PRICE=$(echo "$PRODUCT_JSON" | grep -o '"price_cents":[0-9]*' | head -1 | cut -d: -f2)

if [ -z "$PRODUCT_ID" ] || [ -z "$PRICE" ]; then
  echo "❌ Nenhum produto encontrado para restaurante $RESTAURANT_ID"
  exit 1
fi
echo "✅ Produto: $PRODUCT_NAME (id=$PRODUCT_ID, price_cents=$PRICE)"
echo ""

CREATED=0
FAILED=0
FAIL_MSG=""

for i in $(seq 1 "$N"); do
  # 1. Criar pedido (TPV)
  ORDER_JSON=$(curl -s -X POST "$CORE_URL/rpc/create_order_atomic" \
    -H "Content-Type: application/json" \
    -d "{\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_items\":[{\"product_id\":\"$PRODUCT_ID\",\"name\":\"$PRODUCT_NAME\",\"quantity\":1,\"unit_price\":$PRICE}],\"p_payment_method\":\"cash\"}")

  if ! echo "$ORDER_JSON" | grep -q '"id"'; then
    FAILED=$((FAILED + 1))
    FAIL_MSG="create_order_atomic (pedido $i): $ORDER_JSON"
    echo "❌ Pedido $i: falha ao criar — $ORDER_JSON"
    continue
  fi

  # PostgREST pode devolver "id":"uuid" ou "id": "uuid"
  ORDER_ID=$(echo "$ORDER_JSON" | grep -oE '"id"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
  if [ -z "$ORDER_ID" ]; then
    FAILED=$((FAILED + 1))
    FAIL_MSG="create_order_atomic (pedido $i): id não encontrado em $ORDER_JSON"
    echo "❌ Pedido $i: id não extraído"
    continue
  fi

  # 2. IN_PREP (KDS)
  UPD1=$(curl -s -X POST "$CORE_URL/rpc/update_order_status" \
    -H "Content-Type: application/json" \
    -d "{\"p_order_id\":\"$ORDER_ID\",\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_new_status\":\"IN_PREP\"}")
  if ! echo "$UPD1" | grep -q '"success"' && ! echo "$UPD1" | grep -q 'true'; then
    FAILED=$((FAILED + 1))
    FAIL_MSG="update_order_status IN_PREP (pedido $i, order_id=$ORDER_ID): $UPD1"
    echo "❌ Pedido $i ($ORDER_ID): falha IN_PREP — $UPD1"
    continue
  fi

  # 3. READY (KDS)
  UPD2=$(curl -s -X POST "$CORE_URL/rpc/update_order_status" \
    -H "Content-Type: application/json" \
    -d "{\"p_order_id\":\"$ORDER_ID\",\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_new_status\":\"READY\"}")
  if ! echo "$UPD2" | grep -q '"success"' && ! echo "$UPD2" | grep -q 'true'; then
    FAILED=$((FAILED + 1))
    FAIL_MSG="update_order_status READY (pedido $i, order_id=$ORDER_ID): $UPD2"
    echo "❌ Pedido $i ($ORDER_ID): falha READY — $UPD2"
    continue
  fi

  # 4. CLOSED (opcional — pedido entregue)
  UPD3=$(curl -s -X POST "$CORE_URL/rpc/update_order_status" \
    -H "Content-Type: application/json" \
    -d "{\"p_order_id\":\"$ORDER_ID\",\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_new_status\":\"CLOSED\"}")
  if ! echo "$UPD3" | grep -q '"success"' && ! echo "$UPD3" | grep -q 'true'; then
    FAILED=$((FAILED + 1))
    FAIL_MSG="update_order_status CLOSED (pedido $i, order_id=$ORDER_ID): $UPD3"
    echo "❌ Pedido $i ($ORDER_ID): falha CLOSED — $UPD3"
    continue
  fi

  CREATED=$((CREATED + 1))
  if [ $((i % 50)) -eq 0 ]; then
    echo "   … $i/$N pedidos (OPEN→IN_PREP→READY→CLOSED)"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Resultado: $CREATED pedidos completos, $FAILED falhas"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAILED" -gt 0 ]; then
  echo "FASE 1 FALHOU — quebrou aqui:"
  echo "  rota: rpc/create_order_atomic ou rpc/update_order_status"
  echo "  acção: pedido #$i (order_id=$ORDER_ID)"
  echo "  erro: $FAIL_MSG"
  exit 1
fi

echo "FASE 1 PASSOU."
exit 0
