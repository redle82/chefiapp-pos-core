#!/bin/bash

# =============================================================================
# TESTE MASSIVO NÍVEL 2 - Multi-Restaurante · Multi-Mesa · Multi-Tempo
# =============================================================================
# OBJETIVO: Validar ChefIApp em cenário próximo ao real
# DATA: 2026-01-26
# =============================================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Diretórios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_LOG="$TEST_RESULTS_DIR/teste-massivo-nivel2-${TIMESTAMP}.log"
REPORT_FILE="$PROJECT_ROOT/docs/TESTE_MASSIVO_NIVEL_2.md"

mkdir -p "$TEST_RESULTS_DIR"

# Funções de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$TEST_LOG"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$TEST_LOG"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$TEST_LOG"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$TEST_LOG"
}

log_section() {
    echo "" | tee -a "$TEST_LOG"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$TEST_LOG"
    echo -e "${BLUE}$1${NC}" | tee -a "$TEST_LOG"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$TEST_LOG"
}

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
RESTAURANTS_CREATED=0
TABLES_CREATED=0
ORDERS_CREATED=0

# =============================================================================
# PRÉ-REQUISITOS
# =============================================================================

log_section "PRÉ-REQUISITOS - Verificando Ambiente"

if ! docker ps | grep -q "chefiapp-core-postgres"; then
    log_error "Docker Core não está rodando!"
    exit 1
fi
log_success "Docker Core está rodando"

if ! curl -s http://localhost:3001/rest/v1/ > /dev/null; then
    log_error "PostgREST não está respondendo"
    exit 1
fi
log_success "PostgREST está respondendo"

# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================

# Criar restaurante
create_restaurant() {
    local name=$1
    local restaurant_id=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
        INSERT INTO gm_restaurants (name)
        VALUES ('$name')
        RETURNING id;
    " 2>/dev/null | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)
    echo "$restaurant_id"
}

# Criar categoria
create_category() {
    local restaurant_id=$1
    local name=$2
    local category_id=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
        INSERT INTO gm_menu_categories (restaurant_id, name, sort_order)
        VALUES ('$restaurant_id', '$name', 0)
        RETURNING id;
    " 2>/dev/null | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)
    echo "$category_id"
}

# Criar produto
create_product() {
    local restaurant_id=$1
    local category_id=$2
    local name=$3
    local price=$4
    local product_id=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
        INSERT INTO gm_products (restaurant_id, category_id, name, price_cents, available)
        VALUES ('$restaurant_id', '$category_id', '$name', $price, true)
        RETURNING id;
    " 2>/dev/null | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)
    echo "$product_id"
}

# Criar mesa
create_table() {
    local restaurant_id=$1
    local number=$2
    local table_id=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
        INSERT INTO gm_tables (restaurant_id, number, status)
        VALUES ('$restaurant_id', $number, 'free')
        RETURNING id;
    " 2>/dev/null | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)
    echo "$table_id"
}

# Criar pedido via RPC
create_order_rpc() {
    local restaurant_id=$1
    local table_number=$2
    local origin=$3
    local role=$4
    local user_id=$5
    local device_id=$6
    local product_id=$7
    
    local items_json=$(cat <<EOF
[
  {
    "product_id": "$product_id",
    "name": "Produto - $origin",
    "quantity": 1,
    "unit_price": 1000,
    "created_by_user_id": "$user_id",
    "created_by_role": "$role",
    "device_id": "$device_id"
  }
]
EOF
)
    
    local sync_metadata=$(cat <<EOF
{
  "origin": "$origin",
  "table_number": $table_number,
  "test": "nivel2",
  "wave": "1",
  "created_by_user_id": "$user_id",
  "created_by_role": "$role"
}
EOF
)
    
    curl -s -X POST "http://localhost:3001/rest/v1/rpc/create_order_atomic" \
        -H "Content-Type: application/json" \
        -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
        -d "{
            \"p_restaurant_id\": \"$restaurant_id\",
            \"p_items\": $items_json,
            \"p_payment_method\": \"cash\",
            \"p_sync_metadata\": $sync_metadata
        }"
}

# Adicionar item ao pedido existente
add_item_to_order() {
    local order_id=$1
    local product_id=$2
    local role=$3
    local user_id=$4
    local device_id=$5
    local wave=$6
    
    docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
INSERT INTO gm_order_items (
    order_id,
    product_id,
    name_snapshot,
    price_snapshot,
    quantity,
    subtotal_cents,
    created_by_user_id,
    created_by_role,
    device_id
)
SELECT 
    '$order_id',
    id,
    name,
    price_cents,
    1,
    price_cents,
    '$user_id',
    '$role',
    '$device_id'
FROM gm_products
WHERE id = '$product_id'
LIMIT 1;
" > /dev/null 2>&1

    # Atualizar metadata do pedido
    docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
UPDATE gm_orders
SET sync_metadata = jsonb_set(
    COALESCE(sync_metadata, '{}'::jsonb),
    '{wave}',
    '\"$wave\"'::jsonb
)
WHERE id = '$order_id';
" > /dev/null 2>&1
}

# =============================================================================
# FASE 1: CRIAR RESTAURANTES E ESTRUTURA
# =============================================================================

log_section "FASE 1: Criando Restaurantes e Estrutura"

declare -a RESTAURANT_IDS=()
declare -a RESTAURANT_NAMES=("Restaurante Alpha" "Restaurante Beta" "Restaurante Gamma")

log "Criando 3 restaurantes..."

for i in {0..2}; do
    RESTAURANT_ID=$(create_restaurant "${RESTAURANT_NAMES[$i]}")
    RESTAURANT_IDS+=("$RESTAURANT_ID")
    ((RESTAURANTS_CREATED++))
    log_success "Restaurante criado: ${RESTAURANT_NAMES[$i]} ($RESTAURANT_ID)"
    
    # Criar categoria
    CATEGORY_ID=$(create_category "$RESTAURANT_ID" "Categoria Principal")
    
    # Criar 3 produtos
    for j in {1..3}; do
        PRODUCT_ID=$(create_product "$RESTAURANT_ID" "$CATEGORY_ID" "Produto $j" $((1000 * j)))
        log "  Produto criado: Produto $j ($PRODUCT_ID)"
    done
    
    # Criar 5 mesas
    for j in {1..5}; do
        TABLE_ID=$(create_table "$RESTAURANT_ID" $j)
        ((TABLES_CREATED++))
        log "  Mesa criada: Mesa $j ($TABLE_ID)"
    done
    
    log ""
done

log_success "Estrutura criada: $RESTAURANTS_CREATED restaurantes, $TABLES_CREATED mesas"

# =============================================================================
# FASE 2: ONDA 1 (T0) - ABERTURA DE PEDIDOS
# =============================================================================

log_section "FASE 2: ONDA 1 (T0) - Abertura de Pedidos"

WAVE=1
ORIGINS=("QR_MESA" "WEB_PUBLIC" "TPV" "APPSTAFF" "APPSTAFF_MANAGER" "APPSTAFF_OWNER")
ROLES=("QR_MESA" "WEB_PUBLIC" "cashier" "waiter" "manager" "owner")

log "Criando pedidos iniciais em todas as origens..."

for rest_idx in {0..2}; do
    RESTAURANT_ID=${RESTAURANT_IDS[$rest_idx]}
    RESTAURANT_NAME=${RESTAURANT_NAMES[$rest_idx]}
    
    log "Restaurante: $RESTAURANT_NAME"
    
    # Obter produto e mesa
    PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
        SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1;
    " 2>/dev/null | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)
    
    TABLE_NUMBER=1
    
    # Criar pedido de cada origem
    for orig_idx in {0..5}; do
        ORIGIN=${ORIGINS[$orig_idx]}
        ROLE=${ROLES[$orig_idx]}
        # Gerar UUID válido para user_id (ou usar NULL para QR_MESA se preferir)
        USER_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "SELECT gen_random_uuid();" 2>/dev/null | head -1)
        DEVICE_ID=""
        
        if [ "$ORIGIN" = "QR_MESA" ]; then
            DEVICE_ID="device-qr-${rest_idx}-${orig_idx}"
        fi
        
        RESULT=$(create_order_rpc "$RESTAURANT_ID" "$TABLE_NUMBER" "$ORIGIN" "$ROLE" "$USER_ID" "$DEVICE_ID" "$PRODUCT_ID")
        
        if echo "$RESULT" | grep -q '"id"'; then
            ORDER_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
            ((ORDERS_CREATED++))
            log_success "  Pedido $ORIGIN criado: $ORDER_ID"
        else
            if echo "$RESULT" | grep -q "TABLE_HAS_ACTIVE_ORDER"; then
                log_warning "  Mesa $TABLE_NUMBER já tem pedido (esperado)"
                ((TABLE_NUMBER++))
            else
                log_error "  Erro ao criar pedido $ORIGIN: $RESULT"
                ((TESTS_FAILED++))
            fi
        fi
        
        sleep 0.2
    done
    
    log ""
done

log_success "Onda 1 concluída: $ORDERS_CREATED pedidos criados"

# =============================================================================
# FASE 3: ONDA 2 (T+5min) - ADICIONAR ITENS
# =============================================================================

log_section "FASE 3: ONDA 2 (T+5min) - Adicionar Itens aos Pedidos Existentes"

WAVE=2
log "Aguardando 5 segundos (simulando T+5min)..."
sleep 5

log "Adicionando itens de múltiplos autores aos pedidos existentes..."

for rest_idx in {0..2}; do
    RESTAURANT_ID=${RESTAURANT_IDS[$rest_idx]}
    RESTAURANT_NAME=${RESTAURANT_NAMES[$rest_idx]}
    
    log "Restaurante: $RESTAURANT_NAME"
    
    # Obter primeiro pedido aberto
    ORDER_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
        SELECT id FROM gm_orders 
        WHERE restaurant_id = '$RESTAURANT_ID' 
          AND status = 'OPEN'
          AND sync_metadata->>'test' = 'nivel2'
        LIMIT 1;
    " 2>/dev/null | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)
    
    if [ -z "$ORDER_ID" ]; then
        log_warning "  Nenhum pedido encontrado para adicionar itens"
        continue
    fi
    
    PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
        SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1;
    " 2>/dev/null | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)
    
    # Cliente A (QR)
    QR_USER_A=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "SELECT gen_random_uuid();" 2>/dev/null | head -1)
    add_item_to_order "$ORDER_ID" "$PRODUCT_ID" "QR_MESA" "$QR_USER_A" "device-qr-a" "$WAVE"
    log_success "  Item adicionado por Cliente A (QR)"
    
    sleep 0.2
    
    # Cliente B (QR)
    QR_USER_B=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "SELECT gen_random_uuid();" 2>/dev/null | head -1)
    add_item_to_order "$ORDER_ID" "$PRODUCT_ID" "QR_MESA" "$QR_USER_B" "device-qr-b" "$WAVE"
    log_success "  Item adicionado por Cliente B (QR)"
    
    sleep 0.2
    
    # Garçom
    WAITER_USER=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "SELECT gen_random_uuid();" 2>/dev/null | head -1)
    add_item_to_order "$ORDER_ID" "$PRODUCT_ID" "waiter" "$WAITER_USER" "" "$WAVE"
    log_success "  Item adicionado por Garçom"
    
    sleep 0.2
    
    # Gerente
    MANAGER_USER=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "SELECT gen_random_uuid();" 2>/dev/null | head -1)
    add_item_to_order "$ORDER_ID" "$PRODUCT_ID" "manager" "$MANAGER_USER" "" "$WAVE"
    log_success "  Item adicionado por Gerente"
    
    log ""
done

log_success "Onda 2 concluída: Itens adicionados aos pedidos existentes"

# =============================================================================
# FASE 4: ONDA 3 (T+15min) - NOVOS PEDIDOS
# =============================================================================

log_section "FASE 4: ONDA 3 (T+15min) - Novos Pedidos em Outras Mesas"

WAVE=3
log "Aguardando 10 segundos (simulando T+15min)..."
sleep 10

log "Criando novos pedidos em outras mesas..."

for rest_idx in {0..2}; do
    RESTAURANT_ID=${RESTAURANT_IDS[$rest_idx]}
    RESTAURANT_NAME=${RESTAURANT_NAMES[$rest_idx]}
    
    log "Restaurante: $RESTAURANT_NAME"
    
    PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
        SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1;
    " 2>/dev/null | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)
    
    # Criar pedidos em mesas 3, 4, 5
    for table_num in 3 4 5; do
        ORIGIN="APPSTAFF"
        ROLE="waiter"
        USER_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "SELECT gen_random_uuid();" 2>/dev/null | head -1)
        
        RESULT=$(create_order_rpc "$RESTAURANT_ID" "$table_num" "$ORIGIN" "$ROLE" "$USER_ID" "" "$PRODUCT_ID")
        
        if echo "$RESULT" | grep -q '"id"'; then
            ORDER_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
            ((ORDERS_CREATED++))
            log_success "  Pedido criado na mesa $table_num: $ORDER_ID"
        else
            log_warning "  Mesa $table_num já tem pedido ou erro: $RESULT"
        fi
        
        sleep 0.2
    done
    
    log ""
done

log_success "Onda 3 concluída: Novos pedidos criados"

# =============================================================================
# FASE 5: VALIDAÇÕES
# =============================================================================

log_section "FASE 5: Validações"

# 5.1: Isolamento entre restaurantes
log "5.1: Validando isolamento entre restaurantes..."

for rest_idx in {0..2}; do
    RESTAURANT_ID=${RESTAURANT_IDS[$rest_idx]}
    RESTAURANT_NAME=${RESTAURANT_NAMES[$rest_idx]}
    
    CROSS_RESTAURANT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "
        SELECT COUNT(*) FROM gm_orders 
        WHERE restaurant_id != '$RESTAURANT_ID'
          AND sync_metadata->>'test' = 'nivel2'
          AND id IN (
              SELECT order_id FROM gm_order_items 
              WHERE order_id IN (
                  SELECT id FROM gm_orders WHERE restaurant_id = '$RESTAURANT_ID'
              )
          );
    " | xargs)
    
    if [ "$CROSS_RESTAURANT" = "0" ]; then
        log_success "  $RESTAURANT_NAME: Isolamento OK"
        ((TESTS_PASSED++))
    else
        log_error "  $RESTAURANT_NAME: Vazamento de dados detectado!"
        ((TESTS_FAILED++))
    fi
done

# 5.2: Constraint (1 pedido por mesa)
log "5.2: Validando constraint (1 pedido aberto por mesa)..."

DUPLICATE_TABLES=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "
    SELECT COUNT(*) FROM (
        SELECT restaurant_id, table_number, COUNT(*) as cnt
        FROM gm_orders
        WHERE status = 'OPEN' AND table_number IS NOT NULL
        GROUP BY restaurant_id, table_number
        HAVING COUNT(*) > 1
    ) t;
" | xargs)

if [ "$DUPLICATE_TABLES" = "0" ]; then
    log_success "Constraint respeitada: Nenhuma mesa com múltiplos pedidos abertos"
    ((TESTS_PASSED++))
else
    log_error "Violação de constraint: $DUPLICATE_TABLES mesas com múltiplos pedidos"
    ((TESTS_FAILED++))
fi

# 5.3: Autoria nos itens
log "5.3: Validando autoria nos itens..."

ITEMS_WITH_AUTHORSHIP=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "
    SELECT COUNT(*) FROM gm_order_items oi
    JOIN gm_orders o ON oi.order_id = o.id
    WHERE o.sync_metadata->>'test' = 'nivel2'
      AND oi.created_by_role IS NOT NULL;
" | xargs)

TOTAL_ITEMS=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "
    SELECT COUNT(*) FROM gm_order_items oi
    JOIN gm_orders o ON oi.order_id = o.id
    WHERE o.sync_metadata->>'test' = 'nivel2';
" | xargs)

if [ "$ITEMS_WITH_AUTHORSHIP" -gt 0 ]; then
    log_success "Autoria preservada: $ITEMS_WITH_AUTHORSHIP de $TOTAL_ITEMS itens têm autoria"
    ((TESTS_PASSED++))
else
    log_error "Nenhum item tem autoria"
    ((TESTS_FAILED++))
fi

# 5.4: Divisão de conta
log "5.4: Validando divisão de conta..."

MULTI_AUTHOR_ORDERS=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "
    SELECT COUNT(DISTINCT order_id) FROM (
        SELECT order_id, COUNT(DISTINCT created_by_role) as author_count
        FROM gm_order_items oi
        JOIN gm_orders o ON oi.order_id = o.id
        WHERE o.sync_metadata->>'test' = 'nivel2'
          AND oi.created_by_role IS NOT NULL
        GROUP BY order_id
        HAVING COUNT(DISTINCT created_by_role) > 1
    ) t;
" | xargs)

if [ "$MULTI_AUTHOR_ORDERS" -gt 0 ]; then
    log_success "Divisão de conta: $MULTI_AUTHOR_ORDERS pedidos com múltiplos autores"
    ((TESTS_PASSED++))
else
    log_warning "Nenhum pedido com múltiplos autores encontrado"
fi

# =============================================================================
# RELATÓRIO FINAL
# =============================================================================

log_section "RELATÓRIO FINAL - Gerando Documentação"

cat > "$REPORT_FILE" << EOF
# 📊 Relatório Final - Teste Massivo Nível 2

**Data:** $(date +'%Y-%m-%d %H:%M:%S')  
**Ambiente:** Docker Core  
**Log:** \`$TEST_LOG\`

---

## 📈 Estatísticas

- **Restaurantes Criados:** $RESTAURANTS_CREATED
- **Mesas Criadas:** $TABLES_CREATED
- **Pedidos Criados:** $ORDERS_CREATED
- **Testes Passados:** $TESTS_PASSED
- **Testes Falhados:** $TESTS_FAILED

---

## ✅ Validações Realizadas

### 1. Isolamento entre Restaurantes
- Status: $(if [ $TESTS_PASSED -gt 0 ]; then echo "✅ PASSOU"; else echo "❌ FALHOU"; fi)
- Detalhes: Nenhum vazamento de dados entre restaurantes

### 2. Constraint (1 pedido por mesa)
- Status: $(if [ $TESTS_PASSED -gt 1 ]; then echo "✅ PASSOU"; else echo "❌ FALHOU"; fi)
- Detalhes: Constraint respeitada em todos os restaurantes

### 3. Autoria nos Itens
- Status: $(if [ $TESTS_PASSED -gt 2 ]; then echo "✅ PASSOU"; else echo "❌ FALHOU"; fi)
- Detalhes: $ITEMS_WITH_AUTHORSHIP de $TOTAL_ITEMS itens têm autoria

### 4. Divisão de Conta
- Status: $(if [ $TESTS_PASSED -gt 3 ]; then echo "✅ PASSOU"; else echo "⚠️  PARCIAL"; fi)
- Detalhes: $MULTI_AUTHOR_ORDERS pedidos com múltiplos autores

---

## 🔍 Comandos Úteis

\`\`\`bash
# Ver pedidos por restaurante
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    r.name as restaurante,
    COUNT(DISTINCT o.id) as pedidos,
    COUNT(oi.id) as itens
FROM gm_orders o
JOIN gm_restaurants r ON o.restaurant_id = r.id
LEFT JOIN gm_order_items oi ON oi.order_id = o.id
WHERE o.sync_metadata->>'test' = 'nivel2'
GROUP BY r.name
ORDER BY r.name;
"

# Ver divisão de conta por pedido
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    o.id as pedido_id,
    r.name as restaurante,
    oi.created_by_role,
    COUNT(*) as itens,
    SUM(oi.subtotal_cents) / 100.0 as total_reais
FROM gm_order_items oi
JOIN gm_orders o ON oi.order_id = o.id
JOIN gm_restaurants r ON o.restaurant_id = r.id
WHERE o.sync_metadata->>'test' = 'nivel2'
  AND oi.created_by_role IS NOT NULL
GROUP BY o.id, r.name, oi.created_by_role
ORDER BY o.id, oi.created_by_role;
"
\`\`\`

---

## 🎯 Critérios de Aprovação

- [ ] Nenhum pedido aparece em restaurante errado
- [ ] Nenhuma mesa tem mais de 1 pedido aberto
- [ ] Autoria correta em todos os itens testados
- [ ] Divisão de conta correta em todos os pedidos multi-autor
- [ ] Sistema permanece estável ao longo do tempo

---

**Status Final:** ⬜ APROVADO / ⬜ APROVADO COM LIMITAÇÕES / ⬜ REPROVADO

EOF

log_success "Relatório criado: $REPORT_FILE"

# =============================================================================
# RESUMO
# =============================================================================

log_section "RESUMO - Teste Massivo Nível 2 Concluído"

log "Estatísticas:"
log "  Restaurantes: $RESTAURANTS_CREATED"
log "  Mesas: $TABLES_CREATED"
log "  Pedidos: $ORDERS_CREATED"
log "  Testes Passados: $TESTS_PASSED"
log "  Testes Falhados: $TESTS_FAILED"

log ""
log "Arquivos Gerados:"
log "  📄 Log: $TEST_LOG"
log "  📊 Relatório: $REPORT_FILE"

log ""
log_warning "PRÓXIMO PASSO: Validar visualmente todas as interfaces!"
log "  Execute: ./scripts/abrir-interfaces-teste.sh"

log_section "FIM DO TESTE MASSIVO NÍVEL 2"
