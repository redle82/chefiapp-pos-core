#!/bin/bash
set -euo pipefail

cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

COMPOSE="docker compose -f docker-core/docker-compose.core.yml"
PSQL_CMD="psql -v ON_ERROR_STOP=1 -P pager=off -U postgres -d chefiapp_core"

echo "=========================================="
echo "  ChefIApp Core — Apply All Migrations"
echo "=========================================="

# Check postgres is running
echo ""
echo ">>> Checking postgres..."
$COMPOSE exec -T postgres $PSQL_CMD -c "SELECT 'CORE_ALIVE' AS status;" || {
    echo "ERROR: postgres not reachable. Is the stack running?"
    echo "Run: docker compose -f docker-core/docker-compose.core.yml up -d"
    exit 1
}

MIGRATIONS=(
    "20260212_auth_roles_jwt.sql"
    "20260212_rls_phase2_tables.sql"
    "20260212_ops_backup_infra.sql"
    "20260212_shift_reconciliation_v2.sql"
    "20260212_audit_mode.sql"
    "20260212_export_jobs.sql"
    "20260212_fiscal_certifications.sql"
)

PASS=0
FAIL=0

for f in "${MIGRATIONS[@]}"; do
    echo ""
    echo ">>> Applying: $f"
    if cat "docker-core/schema/migrations/$f" | $COMPOSE exec -T postgres $PSQL_CMD 2>&1; then
        echo "    ✅ $f applied successfully"
        PASS=$((PASS+1))
    else
        echo "    ❌ $f FAILED"
        FAIL=$((FAIL+1))
    fi
done

echo ""
echo "=========================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "=========================================="

# Run tests
echo ""
echo ">>> Running Phase 4 tests..."
cat tests/phase4_ops_backup_tests.sql | $COMPOSE exec -T postgres $PSQL_CMD 2>&1 || echo "⚠️  Phase 4 tests had errors"

echo ""
echo ">>> Running Phase 6 tests..."
cat tests/phase6_fiscal_cert_tests.sql | $COMPOSE exec -T postgres $PSQL_CMD 2>&1 || echo "⚠️  Phase 6 tests had errors"

echo ""
echo "=========================================="
echo "  ALL DONE"
echo "=========================================="
