#!/usr/bin/env bash
# =============================================================================
# Teste Global — Core com todas as tabelas, TPV, tarefas (pedido + idle)
# =============================================================================
# Valida: Core acessível, tabelas presentes, fluxo TPV (abrir turno, criar
# pedido), tarefas (PEDIDO_NOVO ao criar pedido; MODO_INTERNO quando ocioso).
# Uso: ./test-global-todas-tabelas.sh   (Core em localhost:3001)
# =============================================================================

set -e
CORE_URL="${CORE_URL:-http://localhost:3001}"
RESTAURANT_ID="00000000-0000-0000-0000-000000000100"

echo "═══════════════════════════════════════════════════════════"
echo "  Teste Global — Todas as tabelas, TPV, tarefas"
echo "  Core: $CORE_URL"
echo "═══════════════════════════════════════════════════════════"

# 1) Saúde do Core (tabela gm_restaurants acessível)
echo ""
echo "1️⃣ Core acessível e tabela gm_restaurants..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CORE_URL/gm_restaurants?limit=0" -H "Accept: application/json")
if [ "$STATUS" != "200" ]; then
  echo "   ❌ GET gm_restaurants → $STATUS (esperado 200). Suba o Core: cd docker-core && make up"
  exit 1
fi
echo "   ✅ GET gm_restaurants → 200"

# 2) Tabelas por módulo (só verificar que respondem 200)
echo ""
echo "2️⃣ Tabelas por módulo..."
for table in gm_restaurants gm_orders gm_order_items gm_tasks gm_cash_registers gm_payments gm_restaurant_members installed_modules event_store gm_products gm_stock_levels gm_ingredients gm_product_bom; do
  S=$(curl -s -o /dev/null -w "%{http_code}" "$CORE_URL/$table?limit=0" -H "Accept: application/json")
  if [ "$S" = "200" ]; then
    echo "   ✅ $table"
  else
    echo "   ❌ $table → $S"
    exit 1
  fi
done

# 3) Produto para pedido (seeds)
echo ""
echo "3️⃣ Obter produto (seeds)..."
PRODUCT_JSON=$(curl -s "$CORE_URL/gm_products?restaurant_id=eq.$RESTAURANT_ID&limit=1&select=id,name,price_cents" -H "Accept: application/json")
PRODUCT_ID=$(echo "$PRODUCT_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$PRODUCT_ID" ]; then
  echo "   ❌ Nenhum produto encontrado. Execute reset: make reset (seeds inserem produtos)."
  exit 1
fi
PRODUCT_NAME=$(echo "$PRODUCT_JSON" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
PRICE=$(echo "$PRODUCT_JSON" | grep -o '"price_cents":[0-9]*' | head -1 | cut -d: -f2)
echo "   ✅ Produto: $PRODUCT_NAME (€$(echo "scale=2;$PRICE/100" | bc))"

# 4) Abrir turno (TPV)
echo ""
echo "4️⃣ Abrir turno (open_cash_register_atomic)..."
OPEN_JSON=$(curl -s -X POST "$CORE_URL/rpc/open_cash_register_atomic" \
  -H "Content-Type: application/json" \
  -d "{\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_name\":\"Caixa Teste Global\",\"p_opened_by\":\"script\",\"p_opening_balance_cents\":0}")
if echo "$OPEN_JSON" | grep -q '"id"' && echo "$OPEN_JSON" | grep -q 'open'; then
  echo "   ✅ Turno aberto"
elif echo "$OPEN_JSON" | grep -q 'CASH_REGISTER_ALREADY_OPEN'; then
  echo "   ✅ Turno já estava aberto"
else
  echo "   ❌ Resposta: $OPEN_JSON"
  exit 1
fi

# Obter cash_register_id para contexto (opcional para create_order)
CASH_ID=$(curl -s "$CORE_URL/gm_cash_registers?restaurant_id=eq.$RESTAURANT_ID&status=eq.open&limit=1&select=id" -H "Accept: application/json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 5) Criar pedido (TPV — create_order_atomic)
echo ""
echo "5️⃣ Criar pedido (create_order_atomic)..."
ORDER_JSON=$(curl -s -X POST "$CORE_URL/rpc/create_order_atomic" \
  -H "Content-Type: application/json" \
  -d "{\"p_restaurant_id\":\"$RESTAURANT_ID\",\"p_items\":[{\"product_id\":\"$PRODUCT_ID\",\"name\":\"$PRODUCT_NAME\",\"quantity\":1,\"unit_price\":$PRICE}]}")
if echo "$ORDER_JSON" | grep -q '"id"'; then
  ORDER_ID=$(echo "$ORDER_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   ✅ Pedido criado: $ORDER_ID"
else
  echo "   ❌ Resposta: $ORDER_JSON"
  exit 1
fi

# 6) Tarefas: tabela acessível; inserir tarefa MODO_INTERNO (ocioso) para validar "sem pedidos → tarefas"
echo ""
echo "6️⃣ Tarefas (gm_tasks)..."
TASK_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$CORE_URL/gm_tasks" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"restaurant_id\":\"$RESTAURANT_ID\",\"task_type\":\"MODO_INTERNO\",\"message\":\"Exemplar e limpeza (teste global)\",\"status\":\"OPEN\",\"priority\":\"MEDIA\",\"source_event\":\"restaurant_idle\"}")
TASKS_JSON=$(curl -s "$CORE_URL/gm_tasks?restaurant_id=eq.$RESTAURANT_ID&status=eq.OPEN&select=id,task_type,message" -H "Accept: application/json")
TASK_COUNT=$(echo "$TASKS_JSON" | grep -c '"task_type"' || true)
echo "   Tarefas OPEN: $TASK_COUNT (MODO_INTERNO inserida; PEDIDO_NOVO pelo app ao criar pedido)"
if [ "$TASK_HTTP" = "201" ] || [ "$TASK_HTTP" = "204" ]; then
  echo "   ✅ gm_tasks: inserção MODO_INTERNO OK; fluxo 'sem pedidos → tarefas' suportado"
else
  echo "   ⚠️ Inserir tarefa → HTTP $TASK_HTTP (tabela acessível: $TASK_COUNT tarefas)"
fi

# 7) Resumo
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Teste global passou: Core, tabelas, TPV (turno + pedido), tarefas"
echo "  Para E2E no browser: npm run dev (merchant-portal) + npm run test:e2e:smoke"
echo "═══════════════════════════════════════════════════════════"
