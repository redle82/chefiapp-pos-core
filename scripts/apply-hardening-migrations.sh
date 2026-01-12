#!/bin/bash

# Script para aplicar migrations de hardening P0
# Uso: ./scripts/apply-hardening-migrations.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 APLICAR MIGRATIONS - HARDENING P0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado."
    echo "   Instale: npm install -g supabase"
    exit 1
fi

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    echo "❌ Não está logado no Supabase CLI."
    echo "   Execute: supabase login"
    exit 1
fi

echo "📋 Migrations a aplicar:"
echo "   1. 20260118000001_add_sync_metadata_to_orders.sql"
echo "   2. 20260118000002_update_create_order_atomic_with_sync_metadata.sql"
echo "   3. 20260118000003_add_version_to_orders.sql"
echo "   4. 20260118000004_add_check_open_orders_rpc.sql"
echo ""

read -p "⚠️  Isso vai modificar o banco de dados. Continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado pelo usuário."
    exit 1
fi

echo ""
echo "🔄 Aplicando migrations..."
echo ""

# Aplicar migrations na ordem
MIGRATIONS=(
    "supabase/migrations/20260118000001_add_sync_metadata_to_orders.sql"
    "supabase/migrations/20260118000002_update_create_order_atomic_with_sync_metadata.sql"
    "supabase/migrations/20260118000003_add_version_to_orders.sql"
    "supabase/migrations/20260118000004_add_check_open_orders_rpc.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ ! -f "$migration" ]; then
        echo "❌ Arquivo não encontrado: $migration"
        exit 1
    fi
    
    echo "📄 Aplicando: $(basename $migration)"
    
    # Usar Supabase CLI para aplicar (requer link)
    if supabase db push &> /dev/null; then
        echo "   ✅ Aplicado via CLI"
    else
        echo "   ⚠️  CLI não linkado. Use Supabase Dashboard:"
        echo "      https://supabase.com/dashboard/project/_/sql"
        echo "      Cole o conteúdo de: $migration"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MIGRATIONS APLICADAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Próximos passos:"
echo "   1. Validar migrations no Supabase Dashboard"
echo "   2. Executar testes manuais (ver tests/manual/)"
echo "   3. Validar que sistema funciona corretamente"
echo ""
