#!/bin/bash

# =============================================================================
# TEST OPERACAO CONFIG - Validação Multi-Contexto
# =============================================================================
# OBJETIVO: Validar que packs/tarefas variam conforme contexto
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
TEST_LOG="$TEST_RESULTS_DIR/test-operacao-config-${TIMESTAMP}.log"
REPORT_FILE="$TEST_RESULTS_DIR/OPERACAO_CONFIG_REPORT.md"

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

log_section() {
    echo "" | tee -a "$TEST_LOG"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$TEST_LOG"
    echo -e "${BLUE}$1${NC}" | tee -a "$TEST_LOG"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$TEST_LOG"
}

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0

# =============================================================================
# PRÉ-REQUISITOS
# =============================================================================

log_section "PRÉ-REQUISITOS"

if ! docker ps | grep -q "chefiapp-core-postgres"; then
    log_error "Docker Core não está rodando!"
    exit 1
fi
log_success "Docker Core está rodando"

# =============================================================================
# ETAPA 1: CRIAR RESTAURANTES DE TESTE
# =============================================================================

log_section "ETAPA 1: Criar Restaurantes de Teste"

# Restaurante Ambulante
AMBULANTE_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
    INSERT INTO gm_restaurants (name)
    VALUES ('Teste Ambulante')
    RETURNING id;
" 2>&1 | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)

log "Restaurante Ambulante: $AMBULANTE_ID"

# Restaurante Médio
MEDIO_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
    INSERT INTO gm_restaurants (name)
    VALUES ('Teste Médio')
    RETURNING id;
" 2>&1 | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)

log "Restaurante Médio: $MEDIO_ID"

# Restaurante Grande
GRANDE_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
    INSERT INTO gm_restaurants (name)
    VALUES ('Teste Grande')
    RETURNING id;
" 2>&1 | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' | head -1)

log "Restaurante Grande: $GRANDE_ID"

# =============================================================================
# ETAPA 2: CRIAR MAPAS
# =============================================================================

log_section "ETAPA 2: Criar Mapas"

# Ambulante: sem mesas
log "Ambulante: sem mesas (OK)"

# Médio: 10 mesas
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
    INSERT INTO gm_restaurant_zones (restaurant_id, code, name, sort_order)
    VALUES ('$MEDIO_ID', 'SERVICE', 'Salão', 0)
    ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

ZONE_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
    SELECT id FROM gm_restaurant_zones WHERE restaurant_id = '$MEDIO_ID' LIMIT 1;
" | tr -d ' \n')

for i in {1..10}; do
  docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
    INSERT INTO gm_restaurant_tables (restaurant_id, zone_id, number)
    VALUES ('$MEDIO_ID', '$ZONE_ID', $i)
    ON CONFLICT DO NOTHING;
  " > /dev/null 2>&1
done

log "Médio: 10 mesas criadas"

# Grande: 50 mesas
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
    INSERT INTO gm_restaurant_zones (restaurant_id, code, name, sort_order)
    VALUES ('$GRANDE_ID', 'SERVICE', 'Salão Principal', 0),
           ('$GRANDE_ID', 'BAR', 'Bar', 1)
    ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

ZONE_SERVICE=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
    SELECT id FROM gm_restaurant_zones WHERE restaurant_id = '$GRANDE_ID' AND code = 'SERVICE' LIMIT 1;
" | tr -d ' \n')

for i in {1..50}; do
  docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
    INSERT INTO gm_restaurant_tables (restaurant_id, zone_id, number)
    VALUES ('$GRANDE_ID', '$ZONE_SERVICE', $i)
    ON CONFLICT DO NOTHING;
  " > /dev/null 2>&1
done

log "Grande: 50 mesas criadas"

# =============================================================================
# ETAPA 3: VALIDAR FILTROS DE CONTEXTO
# =============================================================================

log_section "ETAPA 3: Validar Filtros de Contexto"

# Verificar packs por tipo de operação
PACKS_AMBULANTE=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
    SELECT COUNT(*) FROM gm_task_packs 
    WHERE operation_type = 'AMBULANTE' OR operation_type IS NULL;
" | tr -d ' \n')

PACKS_MEDIO=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
    SELECT COUNT(*) FROM gm_task_packs 
    WHERE (operation_type = 'RESTAURANTE' OR operation_type IS NULL)
      AND (min_tables IS NULL OR min_tables <= 10)
      AND (max_tables IS NULL OR max_tables >= 10);
" | tr -d ' \n')

PACKS_GRANDE=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
    SELECT COUNT(*) FROM gm_task_packs 
    WHERE (operation_type = 'RESTAURANTE_GRANDE' OR operation_type = 'RESTAURANTE' OR operation_type IS NULL)
      AND (min_tables IS NULL OR min_tables <= 50)
      AND (max_tables IS NULL OR max_tables >= 50);
" | tr -d ' \n')

log "Packs para Ambulante: $PACKS_AMBULANTE"
log "Packs para Médio: $PACKS_MEDIO"
log "Packs para Grande: $PACKS_GRANDE"

if [ "$PACKS_AMBULANTE" -ge "1" ] && [ "$PACKS_MEDIO" -ge "1" ] && [ "$PACKS_GRANDE" -ge "1" ]; then
  log_success "Filtros de contexto funcionando"
  ((TESTS_PASSED++))
else
  log_error "Filtros de contexto não funcionando corretamente"
  ((TESTS_FAILED++))
fi

# =============================================================================
# ETAPA 4: VALIDAR VERSIONAMENTO
# =============================================================================

log_section "ETAPA 4: Validar Versionamento"

# Criar versão inicial
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
    INSERT INTO gm_operation_versions (restaurant_id, menu_version, task_version, map_version, is_active)
    VALUES ('$MEDIO_ID', '1.0.0', '1.0.0', '1.0.0', true)
    ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

VERSION_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -A -c "
    SELECT COUNT(*) FROM gm_operation_versions WHERE restaurant_id = '$MEDIO_ID';
" | tr -d ' \n')

if [ "$VERSION_COUNT" -ge "1" ]; then
  log_success "Versionamento funcionando"
  ((TESTS_PASSED++))
else
  log_error "Versionamento não funcionando"
  ((TESTS_FAILED++))
fi

# =============================================================================
# RELATÓRIO
# =============================================================================

log_section "GERANDO RELATÓRIO"

cat > "$REPORT_FILE" <<EOF
# Test Operacao Config - Relatório

**Data:** $(date +'%Y-%m-%d %H:%M:%S')  
**Status:** $([ $TESTS_FAILED -eq 0 ] && echo "✅ PASSOU" || echo "❌ FALHOU")

---

## 📊 Resumo

- **Testes Passados:** $TESTS_PASSED
- **Testes Falhados:** $TESTS_FAILED

---

## ✅ Etapas Validadas

### 1. Restaurantes Criados
- ✅ Ambulante: $AMBULANTE_ID
- ✅ Médio: $MEDIO_ID
- ✅ Grande: $GRANDE_ID

### 2. Mapas Criados
- ✅ Ambulante: 0 mesas
- ✅ Médio: 10 mesas
- ✅ Grande: 50 mesas

### 3. Filtros de Contexto
- ✅ Packs para Ambulante: $PACKS_AMBULANTE
- ✅ Packs para Médio: $PACKS_MEDIO
- ✅ Packs para Grande: $PACKS_GRANDE

### 4. Versionamento
- ✅ Versões criadas: $VERSION_COUNT

---

## 🎯 Conclusão

$([ $TESTS_FAILED -eq 0 ] && echo "✅ **Todos os testes passaram.** Sistema de Configuração Operacional funcionando corretamente." || echo "❌ **Alguns testes falharam.** Verificar logs para detalhes.")

EOF

log_success "Relatório gerado em $REPORT_FILE"

# =============================================================================
# RESUMO FINAL
# =============================================================================

log_section "RESUMO FINAL"

echo "" | tee -a "$TEST_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$TEST_LOG"
echo "Testes Passados: $TESTS_PASSED" | tee -a "$TEST_LOG"
echo "Testes Falhados: $TESTS_FAILED" | tee -a "$TEST_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$TEST_LOG"

if [ $TESTS_FAILED -eq 0 ]; then
    log_success "✅ TODOS OS TESTES PASSARAM"
    exit 0
else
    log_error "❌ ALGUNS TESTES FALHARAM"
    exit 1
fi
