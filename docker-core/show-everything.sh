#!/bin/bash
# =============================================================================
# CHEFIAPP CORE - Mostrar Tudo
# =============================================================================
# Comando único para subir Core, validar e mostrar status
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "═══════════════════════════════════════════════════════════"
echo "  🚀 ChefIApp Core - Mostrar Tudo"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Subir Docker Core
echo "1️⃣  Subindo Docker Core..."
docker compose -f docker-compose.core.yml up -d

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 5

# 2. Validar serviços
echo ""
echo "2️⃣  Validando serviços..."

# Postgres
if docker compose -f docker-compose.core.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "   ✅ Postgres: rodando"
else
    echo "   ❌ Postgres: não respondeu"
    exit 1
fi

# PostgREST
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ PostgREST: rodando (http://localhost:3001)"
else
    echo "   ⚠️  PostgREST: não respondeu (pode estar iniciando)"
fi

# Realtime
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "   ✅ Realtime: rodando (ws://localhost:4000)"
else
    echo "   ⚠️  Realtime: não respondeu (pode estar iniciando)"
fi

# 3. Validar RPC
echo ""
echo "3️⃣  Validando RPC create_order_atomic..."
if docker compose -f docker-compose.core.yml exec -T postgres \
    psql -U postgres -d chefiapp_core -c "\df create_order_atomic" > /dev/null 2>&1; then
    echo "   ✅ RPC existe"
else
    echo "   ❌ RPC não encontrado"
    exit 1
fi

# 4. Validar constraint
echo ""
echo "4️⃣  Validando constraint idx_one_open_order_per_table..."
if docker compose -f docker-compose.core.yml exec -T postgres \
    psql -U postgres -d chefiapp_core -c "\d+ idx_one_open_order_per_table" > /dev/null 2>&1; then
    echo "   ✅ Constraint existe"
else
    echo "   ❌ Constraint não encontrada"
    exit 1
fi

# 5. Verificar dados de seed
echo ""
echo "5️⃣  Verificando dados de seed..."
RESTAURANT_COUNT=$(docker compose -f docker-compose.core.yml exec -T postgres \
    psql -U postgres -d chefiapp_core -t -c "SELECT COUNT(*) FROM gm_restaurants;" 2>/dev/null | tr -d ' ')

if [ "$RESTAURANT_COUNT" -gt 0 ]; then
    echo "   ✅ Restaurantes: $RESTAURANT_COUNT"
else
    echo "   ⚠️  Nenhum restaurante encontrado (seeds podem não ter sido aplicadas)"
fi

# 6. Mostrar status final
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ CORE DOCKER RODANDO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Endpoints:"
echo "   Postgres:  localhost:54320"
echo "   PostgREST: http://localhost:3001"
echo "   Realtime:  ws://localhost:4000"
echo ""
echo "🔧 Próximos passos:"
echo ""
echo "   1. Atualizar merchant-portal/.env:"
echo "      VITE_SUPABASE_URL=http://localhost:3001"
echo "      VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long"
echo ""
echo "   2. Subir Merchant Portal:"
echo "      cd merchant-portal"
echo "      npm run dev"
echo ""
echo "   3. Abrir no navegador:"
echo "      TPV:      http://localhost:5173/app/tpv"
echo "      KDS:      http://localhost:5173/app/kds"
echo "      Dashboard: http://localhost:5173/app/dashboard"
echo ""
echo "═══════════════════════════════════════════════════════════"
