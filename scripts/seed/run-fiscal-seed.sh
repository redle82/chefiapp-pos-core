#!/usr/bin/env bash
# scripts/seed/run-fiscal-seed.sh
# Popula dados de teste para reconciliação fiscal.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/seed-fiscal-reconciliation.sql"

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5433}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-postgres}"

echo "🌱 Populando dados de reconciliação fiscal..."
echo "   Host: $PGHOST:$PGPORT"
echo "   Database: $PGDATABASE"
echo ""

if ! psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$SQL_FILE"; then
    echo "❌ Erro ao executar seed. Verifique se o Core está a correr:"
    echo "   docker-compose -f docker-core/docker-compose.core.yml ps"
    exit 1
fi

echo ""
echo "✅ Seed concluído! Aceda ao portal em http://localhost:5175 para testar."
echo "   Navegue para Relatórios → Fecho Diário e veja a secção de Reconciliação Fiscal."
