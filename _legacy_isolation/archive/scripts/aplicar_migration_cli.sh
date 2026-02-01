#!/bin/bash
# Script para aplicar migration via Supabase CLI
# Execute este script no terminal interativo

set -e

echo "🚀 Aplicando Migration via Supabase CLI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado"
    echo ""
    echo "📋 Instalar:"
    echo "   brew install supabase/tap/supabase"
    echo "   ou"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI encontrado: $(supabase --version)"
echo ""

# Passo 1: Autenticar
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Passo 1/3: Autenticando..."
echo ""

if supabase projects list &> /dev/null; then
    echo "✅ Já autenticado"
else
    echo "📋 Abrindo navegador para autenticação..."
    supabase login
    if [ $? -ne 0 ]; then
        echo "❌ Falha na autenticação"
        exit 1
    fi
fi

echo ""

# Passo 2: Linkar projeto
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Passo 2/3: Linkando projeto..."
echo ""

if [ -f ".supabase/config.toml" ]; then
    echo "✅ Projeto já está linkado"
    PROJECT_REF=$(grep -A 2 "project_id" .supabase/config.toml | head -1 | cut -d'"' -f2 || echo "")
    if [ -n "$PROJECT_REF" ]; then
        echo "   Project ID: $PROJECT_REF"
    fi
else
    echo "📋 Linkando projeto qonfbtwsxeggxbkhqnxl..."
    supabase link --project-ref qonfbtwsxeggxbkhqnxl
    if [ $? -ne 0 ]; then
        echo "❌ Falha ao linkar projeto"
        exit 1
    fi
    echo "✅ Projeto linkado com sucesso"
fi

echo ""

# Passo 3: Aplicar migrations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Passo 3/3: Aplicando migrations..."
echo ""

# Verificar migrations pendentes
echo "📋 Migrations na pasta:"
ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | xargs echo "   Total:"
echo ""

# Aplicar
echo "📤 Aplicando migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ MIGRATIONS APLICADAS COM SUCESSO!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Próximo passo: Validar"
    echo "   1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new"
    echo "   2. Cole o conteúdo de VALIDAR_DEPLOY.sql"
    echo "   3. Execute e verifique que todos os testes passam ✅"
    echo ""
else
    echo ""
    echo "❌ Falha ao aplicar migrations"
    echo ""
    echo "📋 Alternativa: Use o Dashboard"
    echo "   1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new"
    echo "   2. Cole o conteúdo de DEPLOY_MIGRATIONS_CONSOLIDADO.sql"
    echo "   3. Execute"
    exit 1
fi
