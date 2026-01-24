#!/bin/bash
# Script de Provisioning Manual de Restaurante
# Uso: ./scripts/provision-restaurant.sh "Nome do Restaurante" "owner@email.com"

set -e  # Exit on error

RESTAURANT_NAME="${1:-}"
OWNER_EMAIL="${2:-}"

if [ -z "$RESTAURANT_NAME" ] || [ -z "$OWNER_EMAIL" ]; then
  echo "❌ Erro: Uso correto: ./scripts/provision-restaurant.sh \"Nome do Restaurante\" \"owner@email.com\""
  exit 1
fi

# Gerar slug a partir do nome
SLUG=$(echo "$RESTAURANT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')

echo "🚀 Provisionando restaurante: $RESTAURANT_NAME"
echo "📧 Owner: $OWNER_EMAIL"
echo "🔗 Slug: $SLUG"
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

echo "📋 Passo 1: Criar restaurante..."
RESTAURANT_ID=$(supabase db execute "
  INSERT INTO gm_restaurants (name, slug, created_at, updated_at)
  VALUES ('$RESTAURANT_NAME', '$SLUG', NOW(), NOW())
  RETURNING id;
" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)

if [ -z "$RESTAURANT_ID" ]; then
  echo "❌ Erro: Falha ao criar restaurante"
  exit 1
fi

echo "✅ Restaurante criado: $RESTAURANT_ID"

echo "📋 Passo 2: Buscar/verificar usuário owner..."
USER_ID=$(supabase db execute "
  SELECT id FROM auth.users WHERE email = '$OWNER_EMAIL' LIMIT 1;
" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)

if [ -z "$USER_ID" ]; then
  echo "⚠️  Usuário não encontrado. Criar usuário via API de auth ou criar manualmente."
  echo "   Para criar via Supabase Dashboard:"
  echo "   1. Acesse Authentication > Users"
  echo "   2. Crie usuário com email: $OWNER_EMAIL"
  echo "   3. Execute novamente este script"
  exit 1
fi

echo "✅ Usuário encontrado: $USER_ID"

echo "📋 Passo 3: Associar owner ao restaurante..."
supabase db execute "
  INSERT INTO gm_restaurant_members (restaurant_id, user_id, role, created_at)
  VALUES ('$RESTAURANT_ID', '$USER_ID', 'owner', NOW())
  ON CONFLICT (restaurant_id, user_id) DO NOTHING;
" > /dev/null

echo "✅ Owner associado ao restaurante"

echo "📋 Passo 4: Criar dados seed básicos..."
supabase db execute "
  -- Criar mesas padrão (1-12)
  INSERT INTO gm_tables (restaurant_id, number, status, created_at)
  SELECT '$RESTAURANT_ID', generate_series(1, 12), 'free', NOW()
  ON CONFLICT DO NOTHING;
  
  -- Criar categorias padrão
  INSERT INTO gm_menu_categories (restaurant_id, name, sort_order, created_at)
  VALUES 
    ('$RESTAURANT_ID', 'Entradas', 1, NOW()),
    ('$RESTAURANT_ID', 'Pratos Principais', 2, NOW()),
    ('$RESTAURANT_ID', 'Bebidas', 3, NOW()),
    ('$RESTAURANT_ID', 'Sobremesas', 4, NOW())
  ON CONFLICT DO NOTHING;
" > /dev/null

echo "✅ Dados seed criados (12 mesas, 4 categorias)"

echo ""
echo "✅ Provisionamento concluído!"
echo ""
echo "📊 Resumo:"
echo "   Restaurante ID: $RESTAURANT_ID"
echo "   Nome: $RESTAURANT_NAME"
echo "   Slug: $SLUG"
echo "   Owner: $OWNER_EMAIL ($USER_ID)"
echo ""
echo "🔗 Próximos passos:"
echo "   1. Owner pode fazer login com: $OWNER_EMAIL"
echo "   2. Selecionar restaurante no AppStaff"
echo "   3. Começar a usar o sistema"
echo ""
