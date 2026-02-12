#!/usr/bin/env bash
# ============================================================================
# validate-tenant-isolation.sh — Phase 4 Data Layer Protection
# ============================================================================
#
# Valida que queries Supabase usam tenant isolation corretamente.
#
# Regras:
# 1. .from('tabela').select() DEVE ter .eq('restaurant_id', ...) ou withTenant()
# 2. .from('tabela').insert() DEVE incluir restaurant_id ou withTenantInsert()
# 3. Exceções: profiles, system_config, feature_flags (tabelas globais)
#
# Uso:
#   ./scripts/validate-tenant-isolation.sh
#   npm run validate:tenant-isolation
#
# ============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating Tenant Isolation..."
echo ""

# Tabelas que requerem isolamento
TENANT_TABLES=(
    "orders"
    "order_items"
    "gm_restaurants"
    "restaurant_members"
    "menu_items"
    "menu_categories"
    "cash_registers"
    "cash_movements"
    "payment_methods"
    "tables"
    "invoices"
    "sessions"
)

# Tabelas globais (não requerem isolamento)
GLOBAL_TABLES=(
    "profiles"
    "system_config"
    "feature_flags"
    "app_versions"
)

ERRORS=0
WARNINGS=0

# Diretório do merchant-portal
PORTAL_DIR="merchant-portal/src"

if [[ ! -d "$PORTAL_DIR" ]]; then
    echo -e "${RED}❌ Directory not found: $PORTAL_DIR${NC}"
    exit 1
fi

# Função para verificar se tabela é global
is_global_table() {
    local table=$1
    for gt in "${GLOBAL_TABLES[@]}"; do
        if [[ "$table" == "$gt" ]]; then
            return 0
        fi
    done
    return 1
}

# Verificar queries .from() sem tenant isolation
echo "📋 Checking .from() queries..."

for table in "${TENANT_TABLES[@]}"; do
    # Buscar .from('tabela') que não têm withTenant ou .eq('restaurant_id'
    matches=$(grep -rn "\.from(['\"]${table}['\"])" "$PORTAL_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null || true)
    
    if [[ -n "$matches" ]]; then
        while IFS= read -r match; do
            file=$(echo "$match" | cut -d: -f1)
            line=$(echo "$match" | cut -d: -f2)
            
            # Pular arquivos de tenant (eles podem fazer queries raw)
            if [[ "$file" == *"/tenant/"* ]]; then
                continue
            fi
            
            # Verificar se a mesma linha ou próximas têm withTenant ou .eq('restaurant_id'
            context=$(sed -n "$((line-2)),$((line+5))p" "$file" 2>/dev/null || echo "")
            
            if ! echo "$context" | grep -q "withTenant\|\.eq(['\"]restaurant_id['\"]" ; then
                echo -e "${YELLOW}⚠️  Potential missing tenant isolation:${NC}"
                echo "   File: $file:$line"
                echo "   Table: $table"
                echo ""
                ((WARNINGS++)) || true
            fi
        done <<< "$matches"
    fi
done

# Verificar inserts sem restaurant_id
echo "📋 Checking .insert() operations..."

for table in "${TENANT_TABLES[@]}"; do
    matches=$(grep -rn "\.from(['\"]${table}['\"]).*\.insert" "$PORTAL_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null || true)
    
    if [[ -n "$matches" ]]; then
        while IFS= read -r match; do
            file=$(echo "$match" | cut -d: -f1)
            line=$(echo "$match" | cut -d: -f2)
            
            # Pular arquivos de tenant
            if [[ "$file" == *"/tenant/"* ]]; then
                continue
            fi
            
            # Verificar se tem withTenantInsert ou restaurant_id no objeto
            context=$(sed -n "$((line-2)),$((line+10))p" "$file" 2>/dev/null || echo "")
            
            if ! echo "$context" | grep -q "withTenantInsert\|restaurant_id" ; then
                echo -e "${YELLOW}⚠️  Potential insert without tenant:${NC}"
                echo "   File: $file:$line"
                echo "   Table: $table"
                echo ""
                ((WARNINGS++)) || true
            fi
        done <<< "$matches"
    fi
done

# Verificar uso direto de localStorage para restaurant_id em queries
echo "📋 Checking direct localStorage usage in queries..."

direct_usage=$(grep -rn "localStorage.getItem(['\"]chefiapp_restaurant_id['\"])" "$PORTAL_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [[ -n "$direct_usage" ]]; then
    while IFS= read -r match; do
        file=$(echo "$match" | cut -d: -f1)
        line=$(echo "$match" | cut -d: -f2)
        
        # Pular TenantContext (ele precisa ler localStorage)
        if [[ "$file" == *"TenantContext"* || "$file" == *"FlowGate"* ]]; then
            continue
        fi
        
        # Verificar se está sendo usado em query
        context=$(sed -n "$((line-5)),$((line+5))p" "$file" 2>/dev/null || echo "")
        
        if echo "$context" | grep -q "supabase\|\.from\|\.select\|\.insert" ; then
            echo -e "${RED}❌ Direct localStorage usage in query context:${NC}"
            echo "   File: $file:$line"
            echo "   Use useTenant() hook instead"
            echo ""
            ((ERRORS++)) || true
        fi
    done <<< "$direct_usage"
fi

# Resumo
echo "============================================"
echo "📊 TENANT ISOLATION VALIDATION SUMMARY"
echo "============================================"
echo ""

if [[ $ERRORS -gt 0 ]]; then
    echo -e "${RED}❌ ERRORS: $ERRORS${NC}"
fi

if [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
fi

if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
    echo -e "${GREEN}✅ All tenant isolation checks passed!${NC}"
fi

echo ""

# Exit code
if [[ $ERRORS -gt 0 ]]; then
    echo -e "${RED}Validation FAILED${NC}"
    exit 1
fi

if [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}Validation PASSED with warnings${NC}"
    exit 0
fi

echo -e "${GREEN}Validation PASSED${NC}"
exit 0
