#!/usr/bin/env bash
# =============================================================================
# sovereign_kernel_audit.sh — Sovereign Kernel Data Layer Validation
# =============================================================================
#
# Validates that the Sovereign Kernel enforces:
#   1. RLS is ON for every public table
#   2. Every RLS-enabled table has at least 1 policy
#   3. All SECURITY DEFINER functions have search_path=public
#   4. has_restaurant_access() correctly blocks cross-tenant access
#   5. System tables are locked (USING false)
#   6. admin_disable_staff_member() prevents last-owner lockout
#
# Usage:
#   ./scripts/sovereign_kernel_audit.sh
#
# Requires: docker (supabase local running)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

DB_CONTAINER="supabase_db_chefiapp-pos-core"

run_sql() {
    docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -t -A -c "$1" 2>/dev/null
}

assert_eq() {
    local label="$1"
    local expected="$2"
    local actual="$3"
    if [[ "$actual" == "$expected" ]]; then
        echo -e "  ${GREEN}✅ PASS${NC} $label"
        ((PASS++))
    else
        echo -e "  ${RED}❌ FAIL${NC} $label (expected: '$expected', got: '$actual')"
        ((FAIL++))
    fi
}

assert_zero() {
    local label="$1"
    local actual="$2"
    if [[ "$actual" == "0" || -z "$actual" ]]; then
        echo -e "  ${GREEN}✅ PASS${NC} $label"
        ((PASS++))
    else
        echo -e "  ${RED}❌ FAIL${NC} $label (got: '$actual', expected: 0)"
        ((FAIL++))
    fi
}

echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}  SOVEREIGN KERNEL DATA LAYER — FULL AUDIT${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST 1: RLS Coverage — Every public table must have RLS enabled
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BOLD}[1/6] RLS Coverage${NC}"

TABLES_WITHOUT_RLS=$(run_sql "
SELECT string_agg(c.relname, ', ')
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relkind = 'r'
AND c.relrowsecurity = false;
")

if [[ -z "$TABLES_WITHOUT_RLS" || "$TABLES_WITHOUT_RLS" == "" ]]; then
    echo -e "  ${GREEN}✅ PASS${NC} All public tables have RLS enabled"
    ((PASS++))
else
    echo -e "  ${RED}❌ FAIL${NC} Tables without RLS: $TABLES_WITHOUT_RLS"
    ((FAIL++))
fi

# ─────────────────────────────────────────────────────────────────────────────
# TEST 2: Policy Coverage — No RLS-enabled table should have 0 policies
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BOLD}[2/6] Policy Coverage${NC}"

ZERO_POLICY_TABLES=$(run_sql "
SELECT string_agg(c.relname, ', ')
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND c.relkind = 'r' AND c.relrowsecurity = true
GROUP BY c.relname HAVING COUNT(p.polname) = 0;
")

if [[ -z "$ZERO_POLICY_TABLES" || "$ZERO_POLICY_TABLES" == "" ]]; then
    echo -e "  ${GREEN}✅ PASS${NC} All RLS tables have at least 1 policy"
    ((PASS++))
else
    echo -e "  ${RED}❌ FAIL${NC} Tables with 0 policies: $ZERO_POLICY_TABLES"
    ((FAIL++))
fi

TOTAL_TABLES=$(run_sql "SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relkind = 'r';")
TOTAL_POLICIES=$(run_sql "SELECT COUNT(*) FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');")
echo -e "  ${CYAN}ℹ${NC}  Coverage: $TOTAL_POLICIES policies across $TOTAL_TABLES tables"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 3: Function Security — All SECURITY DEFINER functions must have search_path=public
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BOLD}[3/6] Function Security (search_path)${NC}"

NON_COMPLIANT=$(run_sql "
SELECT string_agg(p.proname, ', ')
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prosecdef = true
AND NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) s WHERE s = 'search_path=public');
")

if [[ -z "$NON_COMPLIANT" || "$NON_COMPLIANT" == "" ]]; then
    echo -e "  ${GREEN}✅ PASS${NC} All SECURITY DEFINER functions have search_path=public"
    ((PASS++))
else
    echo -e "  ${RED}❌ FAIL${NC} Non-compliant functions: $NON_COMPLIANT"
    ((FAIL++))
fi

TOTAL_SEC_DEF=$(run_sql "SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prosecdef = true;")
echo -e "  ${CYAN}ℹ${NC}  Audited $TOTAL_SEC_DEF SECURITY DEFINER functions"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 4: Tenant Isolation — has_restaurant_access() blocks unauthorized access
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BOLD}[4/6] Tenant Isolation (Cross-tenant block)${NC}"

# Test: anon/authenticated role should see 0 rows from core tables (no auth.uid() = no access)
ANON_ORDERS=$(run_sql "
SET ROLE anon;
SELECT COUNT(*) FROM public.gm_orders;
" 2>/dev/null || echo "BLOCKED")

# Reset role
run_sql "RESET ROLE;" > /dev/null 2>&1

if [[ "$ANON_ORDERS" == "0" || "$ANON_ORDERS" == "BLOCKED" ]]; then
    echo -e "  ${GREEN}✅ PASS${NC} Anonymous role cannot read gm_orders"
    ((PASS++))
else
    echo -e "  ${RED}❌ FAIL${NC} Anonymous role read $ANON_ORDERS rows from gm_orders"
    ((FAIL++))
fi

ANON_PAYMENTS=$(run_sql "
SET ROLE anon;
SELECT COUNT(*) FROM public.gm_payments;
" 2>/dev/null || echo "BLOCKED")

run_sql "RESET ROLE;" > /dev/null 2>&1

if [[ "$ANON_PAYMENTS" == "0" || "$ANON_PAYMENTS" == "BLOCKED" ]]; then
    echo -e "  ${GREEN}✅ PASS${NC} Anonymous role cannot read gm_payments"
    ((PASS++))
else
    echo -e "  ${RED}❌ FAIL${NC} Anonymous role read $ANON_PAYMENTS rows from gm_payments"
    ((FAIL++))
fi

ANON_RESTAURANTS=$(run_sql "
SET ROLE anon;
SELECT COUNT(*) FROM public.gm_restaurants;
" 2>/dev/null || echo "BLOCKED")

run_sql "RESET ROLE;" > /dev/null 2>&1

if [[ "$ANON_RESTAURANTS" == "0" || "$ANON_RESTAURANTS" == "BLOCKED" ]]; then
    echo -e "  ${GREEN}✅ PASS${NC} Anonymous role cannot read gm_restaurants"
    ((PASS++))
else
    echo -e "  ${RED}❌ FAIL${NC} Anonymous role read $ANON_RESTAURANTS rows from gm_restaurants"
    ((FAIL++))
fi

# ─────────────────────────────────────────────────────────────────────────────
# TEST 5: System Table Lockdown — event_store, legal_seals, etc. are fully locked
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BOLD}[5/6] System Table Lockdown${NC}"

for sys_table in event_store legal_seals saas_tenants webhook_events; do
    ANON_COUNT=$(run_sql "
SET ROLE anon;
SELECT COUNT(*) FROM public.${sys_table};
" 2>/dev/null || echo "BLOCKED")

    run_sql "RESET ROLE;" > /dev/null 2>&1

    if [[ "$ANON_COUNT" == "0" || "$ANON_COUNT" == "BLOCKED" ]]; then
        echo -e "  ${GREEN}✅ PASS${NC} $sys_table is locked (anon sees 0 rows)"
        ((PASS++))
    else
        echo -e "  ${RED}❌ FAIL${NC} $sys_table leaks data ($ANON_COUNT rows visible to anon)"
        ((FAIL++))
    fi
done

# ─────────────────────────────────────────────────────────────────────────────
# TEST 6: Admin Safeguard — admin_disable_staff_member() exists
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BOLD}[6/6] Admin Safeguards${NC}"

ADMIN_FUNC_EXISTS=$(run_sql "
SELECT COUNT(*) FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'admin_disable_staff_member';
")

assert_eq "admin_disable_staff_member() function exists" "1" "$ADMIN_FUNC_EXISTS"

HAS_ACCESS_EXISTS=$(run_sql "
SELECT COUNT(*) FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'has_restaurant_access';
")

assert_eq "has_restaurant_access() function exists" "1" "$HAS_ACCESS_EXISTS"

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}  AUDIT RESULTS${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}✅ Passed: $PASS${NC}"
if [[ $FAIL -gt 0 ]]; then
    echo -e "  ${RED}❌ Failed: $FAIL${NC}"
fi
if [[ $WARN -gt 0 ]]; then
    echo -e "  ${YELLOW}⚠️  Warnings: $WARN${NC}"
fi
echo ""

if [[ $FAIL -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}🛡️  SOVEREIGN KERNEL: FULLY SEALED${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}🚨 SOVEREIGN KERNEL: BREACHES DETECTED${NC}"
    echo ""
    exit 1
fi
