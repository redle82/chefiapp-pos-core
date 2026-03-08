#!/bin/bash
# Demo Mode Automático - ChefIApp
# 
# Cria pedidos automaticamente para demonstração visual
# 
# Usage: ./scripts/demo-mode-automatic.sh [--interval=5] [--count=10]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Defaults
INTERVAL=5  # seconds between orders
COUNT=10    # number of orders to create

# Parse arguments
for arg in "$@"; do
    case $arg in
        --interval=*)
            INTERVAL="${arg#*=}"
            shift
            ;;
        --count=*)
            COUNT="${arg#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [--interval=5] [--count=10]"
            echo ""
            echo "Options:"
            echo "  --interval=N  Seconds between orders (default: 5)"
            echo "  --count=N     Number of orders to create (default: 10)"
            exit 0
            ;;
    esac
done

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ChefIApp - Demo Mode Automático                         ║${NC}"
echo -e "${BLUE}║  Criando ${COUNT} pedidos com intervalo de ${INTERVAL}s              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# 1. Obter Restaurant ID
# =============================================================================

echo -e "${YELLOW}1️⃣ Obtendo Restaurant ID...${NC}"
cd "$PROJECT_ROOT"

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

if [ -z "$RESTAURANT_ID" ]; then
    echo -e "${RED}❌ Não foi possível obter Restaurant ID${NC}"
    echo -e "${YELLOW}   Execute: npx ts-node scripts/setup-pilot-restaurant.ts${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Restaurant ID: ${RESTAURANT_ID}${NC}"
echo ""

# =============================================================================
# 2. Obter Mesas e Produtos
# =============================================================================

echo -e "${YELLOW}2️⃣ Obtendo mesas e produtos...${NC}"

DATA=$(npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);

Promise.all([
  supabase.from('gm_tables').select('id, number').eq('restaurant_id', '${RESTAURANT_ID}').order('number'),
  supabase.from('gm_products').select('id, name, price_cents').eq('restaurant_id', '${RESTAURANT_ID}').limit(5)
]).then(([{ data: tables }, { data: products }]) => {
  console.log(JSON.stringify({ tables: tables || [], products: products || [] }));
});
" 2>/dev/null | tail -1)

TABLES_JSON=$(echo "$DATA" | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(JSON.stringify(d.tables));")
PRODUCTS_JSON=$(echo "$DATA" | npx ts-node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(JSON.stringify(d.products));")

TABLE_COUNT=$(echo "$TABLES_JSON" | npx ts-node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).length);" 2>/dev/null)
PRODUCT_COUNT=$(echo "$PRODUCTS_JSON" | npx ts-node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).length);" 2>/dev/null)

if [ "$TABLE_COUNT" -eq 0 ] || [ "$PRODUCT_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Não há mesas ou produtos suficientes${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ${TABLE_COUNT} mesas, ${PRODUCT_COUNT} produtos disponíveis${NC}"
echo ""

# =============================================================================
# 3. Limpar Pedidos Abertos
# =============================================================================

echo -e "${YELLOW}3️⃣ Limpando pedidos abertos...${NC}"

npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);

await supabase
  .from('gm_orders')
  .update({ status: 'CLOSED', payment_status: 'PAID' })
  .eq('restaurant_id', '${RESTAURANT_ID}')
  .eq('status', 'OPEN');
" > /dev/null 2>&1

echo -e "${GREEN}✅ Pedidos abertos limpos${NC}"
echo ""

# =============================================================================
# 4. Criar Pedidos Automaticamente
# =============================================================================

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🎬 Iniciando Demo Mode...                                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📊 Abra estas URLs no navegador:${NC}"
echo -e "${GREEN}   Dashboard: http://localhost:5173/app/dashboard${NC}"
echo -e "${GREEN}   TPV:       http://localhost:5173/app/tpv${NC}"
echo -e "${GREEN}   KDS:       http://localhost:5173/app/kds/${RESTAURANT_ID}${NC}"
echo ""
echo -e "${YELLOW}⏱️  Criando ${COUNT} pedidos (intervalo: ${INTERVAL}s)...${NC}"
echo ""

SUCCESS=0
FAILED=0

for i in $(seq 1 $COUNT); do
    echo -n -e "${BLUE}[${i}/${COUNT}]${NC} Criando pedido... "
    
    # Get random table and products
    RESULT=$(npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);

const tables = ${TABLES_JSON};
const products = ${PRODUCTS_JSON};

// Pick random table (that doesn't have open order)
const availableTables = tables.filter(async (t) => {
  const { data } = await supabase
    .from('gm_orders')
    .select('id')
    .eq('restaurant_id', '${RESTAURANT_ID}')
    .eq('table_id', t.id)
    .eq('status', 'OPEN')
    .limit(1);
  return !data || data.length === 0;
});

const table = tables[Math.floor(Math.random() * tables.length)];
const product1 = products[Math.floor(Math.random() * products.length)];
const product2 = products[Math.floor(Math.random() * products.length)];

// Close any existing order on this table first
await supabase
  .from('gm_orders')
  .update({ status: 'CLOSED', payment_status: 'PAID' })
  .eq('restaurant_id', '${RESTAURANT_ID}')
  .eq('table_id', table.id)
  .eq('status', 'OPEN');

// Create order
const { data, error } = await supabase.rpc('create_order_atomic', {
  p_restaurant_id: '${RESTAURANT_ID}',
  p_items: [
    { product_id: product1.id, name: product1.name, quantity: 1, unit_price: product1.price_cents },
    { product_id: product2.id, name: product2.name, quantity: 1, unit_price: product2.price_cents }
  ],
  p_payment_method: 'cash',
  p_sync_metadata: { origin: 'DEMO', demo_order: ${i} }
});

if (error) {
  console.log('ERROR:' + error.message);
} else {
  console.log('SUCCESS:' + data.id + ':' + table.number);
}
" 2>&1 | tail -1)
    
    if echo "$RESULT" | grep -q "SUCCESS:"; then
        ORDER_ID=$(echo "$RESULT" | cut -d: -f2)
        TABLE_NUM=$(echo "$RESULT" | cut -d: -f3)
        echo -e "${GREEN}✅ Pedido criado (Mesa ${TABLE_NUM}, ID: ${ORDER_ID:0:8}...)${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        ERROR_MSG=$(echo "$RESULT" | sed 's/ERROR://')
        echo -e "${RED}❌ Falhou: ${ERROR_MSG}${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    # Wait before next order (except last)
    if [ $i -lt $COUNT ]; then
        sleep $INTERVAL
    fi
done

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  📊 Resultado do Demo Mode                                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Sucesso: ${SUCCESS}/${COUNT}${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Falhas: ${FAILED}/${COUNT}${NC}"
fi
echo ""
echo -e "${YELLOW}👀 Observe os periféricos:${NC}"
echo -e "   • TPV deve mostrar todos os pedidos"
echo -e "   • KDS deve receber em tempo real"
echo -e "   • Dashboard deve atualizar métricas"
echo ""
echo -e "${BLUE}💡 Dica: Use Ctrl+C para parar a qualquer momento${NC}"
echo ""
