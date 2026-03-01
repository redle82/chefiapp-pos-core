#!/bin/bash
# Visual Validation Test - ChefIApp
# 
# Executa cenário único de teste e valida visualmente todos os pontos
# 
# Usage: ./scripts/visual-validation-test.sh [restaurant-id]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ChefIApp - Visual Validation Test                        ║${NC}"
echo -e "${BLUE}║  Cenário Único: Criar Pedido → Validar Todos os Pontos   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# 1. Obter Restaurant ID
# =============================================================================

if [ -n "$1" ]; then
    RESTAURANT_ID="$1"
else
    echo -e "${YELLOW}1️⃣ Obtendo Restaurant ID...${NC}"
    RESTAURANT_ID=$(npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);
supabase.from('gm_restaurants').select('id').limit(1).single().then(({ data }) => {
  if (data) console.log(data.id);
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
" 2>/dev/null | tail -1)
fi

if [ -z "$RESTAURANT_ID" ]; then
    echo -e "${RED}❌ Não foi possível obter Restaurant ID${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Restaurant ID: ${RESTAURANT_ID}${NC}"
echo ""

# =============================================================================
# 2. Obter Mesa e Produtos
# =============================================================================

echo -e "${YELLOW}2️⃣ Obtendo mesa livre e produtos...${NC}"

cd "$PROJECT_ROOT"

TABLE_DATA=$(npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);
const restaurantId = '${RESTAURANT_ID}';

// Get first available table
supabase.from('gm_tables').select('id, number').eq('restaurant_id', restaurantId).limit(1).single().then(({ data: table }) => {
  if (!table) {
    console.log('NO_TABLE');
    process.exit(1);
  }
  
  // Get first 2 products
  supabase.from('gm_products').select('id, name, price_cents').eq('restaurant_id', restaurantId).limit(2).then(({ data: products }) => {
    if (!products || products.length < 2) {
      console.log('NO_PRODUCTS');
      process.exit(1);
    }
    
    console.log(JSON.stringify({
      tableId: table.id,
      tableNumber: table.number,
      products: products.map(p => ({ id: p.id, name: p.name, price: p.price_cents }))
    }));
    process.exit(0);
  });
});
" 2>/dev/null | tail -1)

if [ -z "$TABLE_DATA" ] || [ "$TABLE_DATA" = "NO_TABLE" ] || [ "$TABLE_DATA" = "NO_PRODUCTS" ]; then
    echo -e "${RED}❌ Não foi possível obter mesa ou produtos${NC}"
    echo -e "${YELLOW}   Execute: npx ts-node scripts/setup-pilot-restaurant.ts${NC}"
    exit 1
fi

TABLE_ID=$(echo "$TABLE_DATA" | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(d.tableId);")
TABLE_NUMBER=$(echo "$TABLE_DATA" | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(d.tableNumber);")
PRODUCT1_ID=$(echo "$TABLE_DATA" | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(d.products[0].id);")
PRODUCT1_NAME=$(echo "$TABLE_DATA" | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(d.products[0].name);")
PRODUCT2_ID=$(echo "$TABLE_DATA" | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(d.products[1].id);")
PRODUCT2_NAME=$(echo "$TABLE_DATA" | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(d.products[1].name);")

echo -e "${GREEN}✅ Mesa: ${TABLE_NUMBER} (${TABLE_ID:0:8}...)${NC}"
echo -e "${GREEN}✅ Produtos: ${PRODUCT1_NAME}, ${PRODUCT2_NAME}${NC}"
echo ""

# =============================================================================
# 3. Fechar Pedidos Abertos na Mesa (Limpeza)
# =============================================================================

echo -e "${YELLOW}3️⃣ Limpando pedidos abertos na mesa ${TABLE_NUMBER}...${NC}"

npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);

const { error } = await supabase
  .from('gm_orders')
  .update({ status: 'CLOSED', payment_status: 'PAID' })
  .eq('restaurant_id', '${RESTAURANT_ID}')
  .eq('table_id', '${TABLE_ID}')
  .eq('status', 'OPEN');

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
console.log('OK');
" > /dev/null 2>&1

echo -e "${GREEN}✅ Mesa limpa${NC}"
echo ""

# =============================================================================
# 4. Criar Pedido via RPC
# =============================================================================

echo -e "${YELLOW}4️⃣ Criando pedido via RPC create_order_atomic...${NC}"

ORDER_RESULT=$(npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);

const { data, error } = await supabase.rpc('create_order_atomic', {
  p_restaurant_id: '${RESTAURANT_ID}',
  p_items: [
    { product_id: '${PRODUCT1_ID}', name: '${PRODUCT1_NAME}', quantity: 1, unit_price: 1000 },
    { product_id: '${PRODUCT2_ID}', name: '${PRODUCT2_NAME}', quantity: 1, unit_price: 1500 }
  ],
  p_payment_method: 'cash',
  p_sync_metadata: { origin: 'TEST' }
});

if (error) {
  console.error('ERROR:', JSON.stringify({ code: error.code, message: error.message }));
  process.exit(1);
}

console.log(JSON.stringify({ id: data.id, tableId: data.table_id || '${TABLE_ID}' }));
" 2>&1)

if echo "$ORDER_RESULT" | grep -q "ERROR:"; then
    ERROR_MSG=$(echo "$ORDER_RESULT" | grep "ERROR:" | sed 's/ERROR: //')
    echo -e "${RED}❌ Erro ao criar pedido:${NC}"
    echo -e "${RED}   $ERROR_MSG${NC}"
    exit 1
fi

ORDER_ID=$(echo "$ORDER_RESULT" | tail -1 | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(d.id);" 2>/dev/null)

if [ -z "$ORDER_ID" ]; then
    echo -e "${RED}❌ Não foi possível obter ID do pedido criado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pedido criado: ${ORDER_ID:0:8}...${NC}"
echo ""

# =============================================================================
# 5. Validar Pedido no Banco
# =============================================================================

echo -e "${YELLOW}5️⃣ Validando pedido no banco de dados...${NC}"

ORDER_STATUS=$(npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);

const { data, error } = await supabase
  .from('gm_orders')
  .select('id, status, table_id, total_cents')
  .eq('id', '${ORDER_ID}')
  .single();

if (error) {
  console.error('ERROR:', error.message);
  process.exit(1);
}

console.log(JSON.stringify(data));
" 2>&1 | tail -1)

if echo "$ORDER_STATUS" | grep -q "ERROR:"; then
    echo -e "${RED}❌ Erro ao validar pedido no banco${NC}"
    exit 1
fi

ORDER_STATUS_VALUE=$(echo "$ORDER_STATUS" | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(d.status);" 2>/dev/null)

if [ -z "$ORDER_STATUS_VALUE" ]; then
    echo -e "${RED}❌ Pedido não encontrado no banco${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pedido no banco: status=${ORDER_STATUS_VALUE}${NC}"
echo ""

# =============================================================================
# 6. Teste de Constraint (Tentar Criar Segundo Pedido)
# =============================================================================

echo -e "${YELLOW}6️⃣ Testando regra constitucional (uma mesa = um pedido aberto)...${NC}"

CONSTRAINT_TEST=$(npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);

// Try to create another order on the same table
const { data, error } = await supabase.rpc('create_order_atomic', {
  p_restaurant_id: '${RESTAURANT_ID}',
  p_items: [{ product_id: '${PRODUCT1_ID}', name: '${PRODUCT1_NAME}', quantity: 1, unit_price: 1000 }],
  p_payment_method: 'cash'
});

if (error) {
  if (error.code === '23505' || error.message.includes('idx_one_open_order_per_table')) {
    console.log('CONSTRAINT_WORKED');
  } else {
    console.log('ERROR:', error.message);
  }
} else {
  console.log('CONSTRAINT_FAILED');
}
" 2>&1 | tail -1)

if [ "$CONSTRAINT_TEST" = "CONSTRAINT_WORKED" ]; then
    echo -e "${GREEN}✅ Constraint funcionou: segundo pedido foi bloqueado corretamente${NC}"
else
    echo -e "${RED}❌ Constraint falhou: segundo pedido foi criado (NÃO DEVERIA)${NC}"
    exit 1
fi

echo ""

# =============================================================================
# 7. Resumo e Instruções Visuais
# =============================================================================

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ Teste Concluído - Validação Visual Necessária         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Pedido Criado:${NC}"
echo -e "   ID: ${ORDER_ID}"
echo -e "   Mesa: ${TABLE_NUMBER}"
echo -e "   Status: ${ORDER_STATUS_VALUE}"
echo ""
echo -e "${YELLOW}🔍 VALIDAÇÃO VISUAL NECESSÁRIA:${NC}"
echo ""
echo -e "${BLUE}1. TPV (http://localhost:5175/app/tpv)${NC}"
echo -e "   ✅ Pedido deve aparecer como ativo"
echo -e "   ✅ Mesa ${TABLE_NUMBER} deve estar marcada como ocupada"
echo ""
echo -e "${BLUE}2. KDS (http://localhost:5175/app/kds/${RESTAURANT_ID})${NC}"
echo -e "   ✅ Pedido deve aparecer em < 2 segundos"
echo -e "   ✅ Status inicial deve ser correto"
echo ""
echo -e "${BLUE}3. Dashboard (http://localhost:5175/app/dashboard)${NC}"
echo -e "   ✅ Nenhum erro ativo"
echo -e "   ✅ ActiveIssuesWidget deve mostrar estado saudável"
echo ""
echo -e "${BLUE}4. Mobile Apps (se rodando)${NC}"
echo -e "   ✅ Pedido deve estar visível"
echo -e "   ✅ Não deve permitir novo pedido na mesma mesa"
echo ""
echo -e "${GREEN}✅ Constraint testada: segundo pedido foi bloqueado corretamente${NC}"
echo ""
