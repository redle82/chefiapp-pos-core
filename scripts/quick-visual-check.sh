#!/bin/bash
# Quick Visual Check - Verificar se sistema está pronto para visualização

set -e

echo "🔍 Verificando Sistema para Teste Visual..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Verificar Supabase
echo "1️⃣ Verificando Supabase Local..."
if command -v supabase &> /dev/null; then
    SUPABASE_STATUS=$(supabase status 2>&1 || echo "NOT_RUNNING")
    if echo "$SUPABASE_STATUS" | grep -q "API URL"; then
        echo "   ✅ Supabase está rodando"
        echo "$SUPABASE_STATUS" | grep "API URL" | head -1
    else
        echo "   ⚠️  Supabase não está rodando"
        echo "   💡 Execute: supabase start"
    fi
else
    echo "   ❌ Supabase CLI não encontrado"
    echo "   💡 Instale: https://supabase.com/docs/guides/cli"
fi
echo ""

# 2. Verificar .env do merchant-portal
echo "2️⃣ Verificando Configuração do Merchant Portal..."
if [ -f "merchant-portal/.env" ] || [ -f "merchant-portal/.env.local" ]; then
    echo "   ✅ Arquivo .env encontrado"
    if grep -q "VITE_SUPABASE_URL" merchant-portal/.env 2>/dev/null || grep -q "VITE_SUPABASE_URL" merchant-portal/.env.local 2>/dev/null; then
        echo "   ✅ VITE_SUPABASE_URL configurado"
    else
        echo "   ⚠️  VITE_SUPABASE_URL não encontrado"
        echo "   💡 Configure: VITE_SUPABASE_URL=http://127.0.0.1:54321"
    fi
else
    echo "   ⚠️  Arquivo .env não encontrado"
    echo "   💡 Crie: cp merchant-portal/.env.example merchant-portal/.env"
fi
echo ""

# 3. Verificar restaurante piloto
echo "3️⃣ Verificando Restaurante Piloto..."
if ls test-results/pilot-restaurant-*.json 1> /dev/null 2>&1; then
    RESTAURANT_ID=$(cat test-results/pilot-restaurant-*.json | grep -o '"restaurantId":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$RESTAURANT_ID" ]; then
        echo "   ✅ Restaurante piloto encontrado"
        echo "   Restaurant ID: $RESTAURANT_ID"
    else
        echo "   ⚠️  Restaurante piloto sem ID"
    fi
else
    echo "   ⚠️  Restaurante piloto não encontrado"
    echo "   💡 Execute: npx ts-node scripts/setup-pilot-restaurant.ts"
fi
echo ""

# 4. Verificar node_modules
echo "4️⃣ Verificando Dependências..."
if [ -d "merchant-portal/node_modules" ]; then
    echo "   ✅ node_modules encontrado"
else
    echo "   ⚠️  node_modules não encontrado"
    echo "   💡 Execute: cd merchant-portal && npm install"
fi
echo ""

# 5. Resumo
echo "═══════════════════════════════════════════════════════════"
echo "📊 RESUMO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Próximos passos:"
echo ""
echo "1. Se Supabase não está rodando:"
echo "   supabase start"
echo ""
echo "2. Se .env não está configurado:"
echo "   cd merchant-portal"
echo "   cp .env.example .env"
echo "   # Edite .env e configure VITE_SUPABASE_URL"
echo ""
echo "3. Subir Merchant Portal:"
echo "   cd merchant-portal"
echo "   npm run dev"
echo ""
echo "4. Abrir no navegador:"
echo "   http://localhost:5173"
echo ""
if [ -n "$RESTAURANT_ID" ]; then
    echo "5. URLs para testar:"
    echo "   TPV:      http://localhost:5173/app/tpv"
    echo "   Dashboard: http://localhost:5173/app/dashboard"
    echo "   KDS:      http://localhost:5173/app/kds/$RESTAURANT_ID"
else
    echo "5. URLs para testar:"
    echo "   TPV:      http://localhost:5173/app/tpv"
    echo "   Dashboard: http://localhost:5173/app/dashboard"
    echo "   KDS:      http://localhost:5173/app/kds/{restaurantId}"
    echo "   (Crie restaurante piloto primeiro para ter restaurantId)"
fi
echo ""
echo "═══════════════════════════════════════════════════════════"
