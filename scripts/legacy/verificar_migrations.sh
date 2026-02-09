#!/bin/bash
# Script para verificar status das migrations

set -e

echo "🔍 VERIFICANDO STATUS DAS MIGRATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# Verificar se projeto está linkado
if [ -f ".supabase/config.toml" ]; then
    echo "✅ Projeto está linkado"
    echo ""
    
    # Tentar verificar status
    if command -v supabase &> /dev/null; then
        echo "📋 Verificando migrations aplicadas..."
        echo ""
        
        # Listar migrations
        if supabase migration list &> /dev/null; then
            echo "✅ Migrations aplicadas:"
            supabase migration list 2>&1 | grep -E "Applied|Pending" || echo "   (Verifique manualmente)"
            echo ""
        else
            echo "⚠️  Não foi possível listar migrations via CLI"
            echo "   Execute manualmente: supabase migration list"
            echo ""
        fi
        
        # Verificar migrations pendentes
        echo "📋 Verificando migrations pendentes..."
        if supabase db push --dry-run &> /dev/null; then
            PENDING=$(supabase db push --dry-run 2>&1 | grep -c "migration" || echo "0")
            if [ "$PENDING" = "0" ]; then
                echo "✅ Nenhuma migration pendente"
            else
                echo "⚠️  Há migrations pendentes"
                supabase db push --dry-run 2>&1 | head -10
            fi
        else
            echo "⚠️  Não foi possível verificar migrations pendentes"
            echo "   Execute manualmente: supabase db push --dry-run"
        fi
    else
        echo "⚠️  Supabase CLI não encontrado"
        echo "   Instale com: brew install supabase/tap/supabase"
    fi
else
    echo "⚠️  Projeto NÃO está linkado"
    echo ""
    echo "📋 Para linkar:"
    echo "   1. supabase login"
    echo "   2. supabase link --project-ref qonfbtwsxeggxbkhqnxl"
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 VALIDAÇÃO COMPLETA VIA DASHBOARD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new"
echo "2. Cole o conteúdo de VALIDAR_DEPLOY.sql"
echo "3. Execute e verifique os 6 testes"
echo ""
echo "📄 Guia completo: VERIFICAR_MIGRATIONS_STATUS.md"
echo ""
