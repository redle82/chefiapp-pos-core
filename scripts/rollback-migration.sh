#!/bin/bash
# Script de Rollback de Migration
# Uso: ./scripts/rollback-migration.sh [version]

set -e  # Exit on error

VERSION="${1:-}"

echo "🔄 Rollback de Migration"
echo ""

# Verificar se supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
  echo "❌ Erro: Supabase CLI não encontrado. Instale: https://supabase.com/docs/guides/cli"
  exit 1
fi

# Verificar se está conectado ao projeto
if ! supabase status &> /dev/null; then
  echo "❌ Erro: Não conectado ao projeto Supabase. Execute: supabase link"
  exit 1
fi

# Confirmar rollback
echo "⚠️  ATENÇÃO: Rollback irá reverter mudanças no banco de dados"
if [ -z "$VERSION" ]; then
  echo "📋 Revertendo última migration..."
  read -p "Continuar? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelado"
    exit 1
  fi
  supabase migration down
else
  echo "📋 Revertendo para migration: $VERSION"
  read -p "Continuar? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelado"
    exit 1
  fi
  supabase migration down --version "$VERSION"
fi

echo ""
echo "✅ Rollback concluído"
echo ""
echo "🔍 Próximos passos:"
echo "   1. Verificar estado do banco de dados"
echo "   2. Testar funcionalidades críticas"
echo "   3. Se necessário, aplicar migration novamente"
echo ""
