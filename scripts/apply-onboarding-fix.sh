#!/bin/bash

# 🔧 Script para aplicar fix de onboarding
# Ação 1 do ACTION_PLAN_IMMEDIATE.md

set -e

echo "🔧 Aplicando Fix de Onboarding (create_tenant_atomic)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se o arquivo SQL existe
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$PROJECT_ROOT/FIX_ONBOARDING_SQL.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Arquivo $SQL_FILE não encontrado!"
    exit 1
fi

echo "✅ Arquivo SQL encontrado: $SQL_FILE"
echo ""

# Tentar via Supabase CLI (se linkado)
if command -v supabase &> /dev/null; then
    echo "📡 Tentando aplicar via Supabase CLI..."
    
    # Verificar se está linkado
    if supabase projects list &> /dev/null; then
        echo "✅ Supabase CLI encontrado e linkado"
        echo ""
        echo "🚀 Aplicando migration via CLI..."
        echo ""
        
        # Copiar SQL para migrations temporária
        TEMP_MIGRATION="$PROJECT_ROOT/supabase/migrations/$(date +%Y%m%d%H%M%S)_fix_onboarding_heartbeat.sql"
        cp "$SQL_FILE" "$TEMP_MIGRATION"
        
        # Aplicar via db push
        cd "$PROJECT_ROOT"
        if supabase db push; then
            echo ""
            echo "✅ Fix aplicado com sucesso via Supabase CLI!"
            echo "🧹 Removendo migration temporária..."
            rm "$TEMP_MIGRATION"
            echo ""
            echo "✅ Concluído! Teste o onboarding agora."
            exit 0
        else
            echo ""
            echo "⚠️  Falha ao aplicar via CLI. Use a opção manual abaixo."
            rm -f "$TEMP_MIGRATION"
        fi
    else
        echo "⚠️  Supabase CLI não está linkado ao projeto cloud."
        echo "   Execute: supabase link --project-ref qonfbtwsxeggxbkhqnxl"
    fi
else
    echo "⚠️  Supabase CLI não encontrado."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 OPÇÃO MANUAL (Recomendada para Cloud):"
echo ""
echo "1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl"
echo "2. Vá em: SQL Editor"
echo "3. Abra o arquivo: FIX_ONBOARDING_SQL.sql"
echo "4. Copie TODO o conteúdo (Cmd+A, Cmd+C)"
echo "5. Cole no SQL Editor"
echo "6. Clique em RUN (ou Cmd+Enter)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📄 Arquivo SQL: $SQL_FILE"
echo ""
echo "💡 Dica: Você pode abrir o arquivo automaticamente com:"
echo "   open \"$SQL_FILE\""
echo ""
