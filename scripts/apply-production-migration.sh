#!/bin/bash
# Script: apply-production-migration.sh
# Purpose: Apply SumUp payment integration migration to production Supabase

set -e

echo "=========================================="
echo "SumUp Payment Integration - Production DB Migration"
echo "=========================================="
echo ""

# Production Supabase credentials
PROD_SUPABASE_URL="https://kwgsmbrxfcezuvkwgvuf.supabase.co"
PROD_PROJECT_REF="kwgsmbrxfcezuvkwgvuf"

# Migration file
MIGRATION_FILE="docker-core/schema/migrations/20260221_sumup_payment_integration.sql"

echo "[1/3] Checking migration file..."
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi
echo "✅ Migration file found"
echo ""

echo "[2/3] Applying migration to production database..."
echo "Database: $PROD_SUPABASE_URL"
echo ""

# Option 1: Using Supabase CLI (recommended)
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    supabase db push --db-url "postgresql://postgres.[PASSWORD]@db.${PROD_PROJECT_REF}.supabase.co:5432/postgres" --file "$MIGRATION_FILE"
else
    # Option 2: Manual instructions
    echo "⚠️  Supabase CLI not found. Please apply migration manually:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/${PROD_PROJECT_REF}/sql/new"
    echo "2. Copy the contents of: $MIGRATION_FILE"
    echo "3. Paste and run the SQL"
    echo ""
    echo "Or install Supabase CLI: npm install -g supabase"
    echo ""
    read -p "Have you applied the migration manually? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Migration not applied. Exiting..."
        exit 1
    fi
fi

echo ""
echo "[3/3] Verifying migration..."
echo "You can verify the migration by checking:"
echo "  • Table: public.gm_payments"
echo "  • Columns: payment_provider, external_checkout_id, external_payment_id, metadata"
echo ""
echo "✅ Migration process complete!"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Deploy integration-gateway to Vercel"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Register webhook URL with SumUp"
echo "=========================================="
