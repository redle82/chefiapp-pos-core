#!/bin/bash
# Script para aplicar migration via Supabase CLI

echo "🚀 Aplicando Migration Consolidada..."
echo ""

# Verificar se está linkado
if ! supabase projects list 2>/dev/null | grep -q "qonfbtwsxeggxbkhqnxl"; then
    echo "⚠️  Projeto não está linkado. Tentando linkar..."
    supabase link --project-ref qonfbtwsxeggxbkhqnxl || {
        echo "❌ Falha ao linkar. Use: supabase login && supabase link --project-ref qonfbtwsxeggxbkhqnxl"
        exit 1
    }
fi

# Aplicar migration
echo "📋 Aplicando DEPLOY_MIGRATIONS_CONSOLIDADO.sql..."
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.qonfbtwsxeggxbkhqnxl.supabase.co:5432/postgres" < DEPLOY_MIGRATIONS_CONSOLIDADO.sql 2>&1 || {
    echo ""
    echo "⚠️  Método CLI falhou. Use o Dashboard:"
    echo "   1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new"
    echo "   2. Cole o conteúdo de DEPLOY_MIGRATIONS_CONSOLIDADO.sql"
    echo "   3. Execute"
    exit 1
}

echo "✅ Migration aplicada com sucesso!"
