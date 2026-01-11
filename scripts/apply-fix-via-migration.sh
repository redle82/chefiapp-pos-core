#!/bin/bash

# 🔧 Aplicar Fix via Migration (Método MCP-friendly)
# Cria uma migration e aplica via Supabase CLI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$PROJECT_ROOT/FIX_ONBOARDING_SQL.sql"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"

echo "🔧 Aplicando Fix de Onboarding via Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar arquivo SQL
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Arquivo não encontrado: $SQL_FILE"
    exit 1
fi

# Criar diretório de migrations se não existir
mkdir -p "$MIGRATIONS_DIR"

# Criar migration com timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="$MIGRATIONS_DIR/${TIMESTAMP}_fix_onboarding_heartbeat.sql"

echo "📝 Criando migration: $(basename $MIGRATION_FILE)"
cp "$SQL_FILE" "$MIGRATION_FILE"
echo "✅ Migration criada"
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI não encontrado"
    echo ""
    echo "📋 OPÇÃO 1: Instalar e usar CLI"
    echo "   1. npm install -g supabase"
    echo "   2. supabase login"
    echo "   3. supabase link --project-ref qonfbtwsxeggxbkhqnxl"
    echo "   4. supabase db push"
    echo ""
    echo "📋 OPÇÃO 2: Aplicar manualmente via Dashboard"
    echo "   1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new"
    echo "   2. Cole o conteúdo de: $SQL_FILE"
    echo "   3. Execute (Cmd+Enter)"
    echo ""
    exit 0
fi

# Tentar aplicar via CLI
echo "📡 Tentando aplicar via Supabase CLI..."
echo ""

# Verificar se está autenticado
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Supabase CLI não está autenticado"
    echo ""
    echo "📋 Execute primeiro:"
    echo "   supabase login"
    echo ""
    echo "📋 Depois execute:"
    echo "   supabase link --project-ref qonfbtwsxeggxbkhqnxl"
    echo "   supabase db push"
    echo ""
    echo "💡 Migration já criada em: $MIGRATION_FILE"
    exit 0
fi

# Tentar linkar se não estiver linkado
if [ ! -f "$PROJECT_ROOT/.supabase/config.toml" ]; then
    echo "🔗 Linkando projeto..."
    if supabase link --project-ref qonfbtwsxeggxbkhqnxl 2>&1; then
        echo "✅ Projeto linkado"
    else
        echo "⚠️  Falha ao linkar. Execute manualmente:"
        echo "   supabase link --project-ref qonfbtwsxeggxbkhqnxl"
        exit 1
    fi
fi

# Aplicar migration
echo ""
echo "🚀 Aplicando migration..."
if supabase db push; then
    echo ""
    echo "✅ Fix aplicado com sucesso!"
    echo ""
    echo "🧹 Removendo migration temporária..."
    rm "$MIGRATION_FILE"
    echo "✅ Concluído! Teste o onboarding agora."
else
    echo ""
    echo "⚠️  Falha ao aplicar migration"
    echo ""
    echo "📋 OPÇÃO MANUAL:"
    echo "   1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new"
    echo "   2. Cole o conteúdo de: $SQL_FILE"
    echo "   3. Execute (Cmd+Enter)"
    echo ""
    echo "💡 Migration criada em: $MIGRATION_FILE"
    exit 1
fi
