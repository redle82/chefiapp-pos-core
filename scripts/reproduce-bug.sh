#!/bin/bash
# Script de Reprodutibilidade de Bugs
# Uso: ./scripts/reproduce-bug.sh [ticket_id] [restaurant_id]

set -e  # Exit on error

TICKET_ID="${1:-}"
RESTAURANT_ID="${2:-}"

if [ -z "$TICKET_ID" ] || [ -z "$RESTAURANT_ID" ]; then
  echo "❌ Erro: Uso correto: ./scripts/reproduce-bug.sh [ticket_id] [restaurant_id]"
  echo ""
  echo "Exemplo:"
  echo "  ./scripts/reproduce-bug.sh TICKET-123 abc-123-def-456"
  exit 1
fi

echo "🐛 Reprodutibilidade de Bug"
echo "================================"
echo "Ticket ID: $TICKET_ID"
echo "Restaurant ID: $RESTAURANT_ID"
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

echo "📋 Passo 1: Buscar dados do ticket..."
TICKET_DATA=$(supabase db execute "
  SELECT 
    id,
    restaurant_id,
    user_id,
    subject,
    description,
    status,
    priority,
    metadata
  FROM gm_support_tickets
  WHERE id = '$TICKET_ID'
  LIMIT 1;
" 2>/dev/null || echo "")

if [ -z "$TICKET_DATA" ]; then
  echo "⚠️  Ticket não encontrado no banco. Continuando com dados fornecidos..."
fi

echo "📋 Passo 2: Buscar dados do restaurante..."
RESTAURANT_DATA=$(supabase db execute "
  SELECT 
    id,
    name,
    slug,
    status
  FROM gm_restaurants
  WHERE id = '$RESTAURANT_ID'
  LIMIT 1;
" 2>/dev/null || echo "")

if [ -z "$RESTAURANT_DATA" ]; then
  echo "❌ Erro: Restaurante não encontrado"
  exit 1
fi

echo "✅ Restaurante encontrado"
echo ""

echo "📋 Passo 3: Criar ambiente isolado..."
echo "   (Em produção, isso criaria um snapshot ou ambiente de staging)"
echo ""

echo "📋 Passo 4: Executar steps de reprodução..."
echo ""
echo "Steps para reproduzir bug:"
echo "  1. Fazer login como usuário do restaurante"
echo "  2. Navegar para a funcionalidade mencionada no ticket"
echo "  3. Reproduzir os passos descritos no ticket"
echo "  4. Verificar se o bug ocorre"
echo ""

echo "📋 Passo 5: Coletar logs e contexto..."
echo ""
echo "Para coletar logs:"
echo "  - Verificar Sentry: https://sentry.io"
echo "  - Verificar Supabase Logs: Dashboard > Logs"
echo "  - Verificar audit_logs: SELECT * FROM gm_audit_logs WHERE tenant_id = '$RESTAURANT_ID' ORDER BY created_at DESC LIMIT 50;"
echo ""

echo "✅ Script de reprodução concluído"
echo ""
echo "📝 Próximos passos:"
echo "  1. Executar steps manualmente"
echo "  2. Coletar logs e contexto"
echo "  3. Documentar reprodução"
echo "  4. Criar fix"
echo ""
