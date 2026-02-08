#!/bin/bash
# Script para aplicar migration via Supabase CLI (MCP)

set -e

echo "🚀 Aplicando Migration via Supabase CLI (MCP)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se arquivo existe
if [ ! -f "DEPLOY_MIGRATIONS_CONSOLIDADO.sql" ]; then
    echo "❌ Arquivo não encontrado: DEPLOY_MIGRATIONS_CONSOLIDADO.sql"
    exit 1
fi

echo "✅ Arquivo encontrado: DEPLOY_MIGRATIONS_CONSOLIDADO.sql"
echo ""

# Método 1: Tentar via db push (se migrations estão na pasta)
if [ -d "supabase/migrations" ]; then
    echo "📋 Método 1: Aplicar via supabase db push"
    echo "   (Aplicará todas as migrations na pasta supabase/migrations/)"
    echo ""
    
    # Verificar se já está linkado
    if [ -f ".supabase/config.toml" ]; then
        echo "✅ Projeto já está linkado"
        echo ""
        echo "📤 Aplicando migrations..."
        supabase db push 2>&1 | tee /tmp/migration_output.log
        
        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            echo ""
            echo "✅ Migrations aplicadas com sucesso!"
            exit 0
        else
            echo ""
            echo "⚠️  db push falhou. Tentando método alternativo..."
        fi
    else
        echo "⚠️  Projeto não está linkado. Execute primeiro:"
        echo "   supabase login"
        echo "   supabase link --project-ref qonfbtwsxeggxbkhqnxl"
        exit 1
    fi
fi

# Método 2: Criar migration temporária e aplicar
echo ""
echo "📋 Método 2: Criar migration temporária"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_deploy_rls_race_conditions.sql"

echo "📝 Criando migration: $(basename $MIGRATION_FILE)"
cp DEPLOY_MIGRATIONS_CONSOLIDADO.sql "$MIGRATION_FILE"
echo "✅ Migration criada"
echo ""

echo "📤 Aplicando migration..."
supabase db push 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration aplicada com sucesso!"
    echo ""
    echo "📋 Próximo passo: Executar VALIDAR_DEPLOY.sql no Dashboard"
    exit 0
else
    echo ""
    echo "❌ Falha ao aplicar migration"
    echo ""
    echo "📋 Use o Dashboard:"
    echo "   1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new"
    echo "   2. Cole o conteúdo de DEPLOY_MIGRATIONS_CONSOLIDADO.sql"
    echo "   3. Execute"
    exit 1
fi
