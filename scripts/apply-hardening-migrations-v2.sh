#!/bin/bash
set -euo pipefail

cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

COMPOSE="docker compose -f docker-core/docker-compose.core.yml"
PSQL_CMD="psql -v ON_ERROR_STOP=1 -P pager=off -U postgres -d chefiapp_core"
PSQL_CMD_NO_STOP="psql -v ON_ERROR_STOP=0 -P pager=off -U postgres -d chefiapp_core"

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
    "20260216_individual_product_photos.sql"
)

PASS=0
FAIL=0

apply_migration() {
    local file="$1"
    local output=""
    local error_lines=""
    local non_policy_errors=""

    if output=$(cat "docker-core/schema/migrations/$file" | $COMPOSE exec -T postgres $PSQL_CMD 2>&1); then
        printf "%s\n" "$output"
        return 0
    fi

    # Retry without ON_ERROR_STOP and tolerate "policy already exists" errors.
    output=$(cat "docker-core/schema/migrations/$file" | $COMPOSE exec -T postgres $PSQL_CMD_NO_STOP 2>&1 || true)
    printf "%s\n" "$output"

    error_lines=$(printf "%s\n" "$output" | grep -E "^ERROR:" || true)
    if [ -z "$error_lines" ]; then
        return 0
    fi

    non_policy_errors=$(printf "%s\n" "$error_lines" | grep -Ev "ERROR:  policy \".*\" for table \".*\" already exists" || true)
    if [ -z "$non_policy_errors" ]; then
        echo "    ⚠️  Only policy already exists errors; treating as success"
        return 0
    fi

    return 1
}

for f in "${MIGRATIONS[@]}"; do
    echo ""
    echo ">>> Applying: $f"
    if apply_migration "$f"; then
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
