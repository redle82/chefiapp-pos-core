#!/bin/bash
# =============================================================================
# Testar Conexão Realtime
# =============================================================================
# Verifica se o Realtime está funcionando corretamente
# =============================================================================

set -e

echo "🔍 Testando Conexão Realtime"
echo "============================="
echo ""

# Verificar se containers estão rodando
echo "📦 Verificando containers..."
if ! docker ps --format "{{.Names}}" | grep -q "^chefiapp-core-realtime$"; then
    echo "❌ Realtime não está rodando"
    exit 1
fi

if ! docker ps --format "{{.Names}}" | grep -q "^chefiapp-core-nginx$"; then
    echo "❌ Nginx não está rodando"
    exit 1
fi

echo "✅ Containers estão rodando"
echo ""

# Verificar logs do Realtime
echo "📋 Últimos logs do Realtime:"
docker logs chefiapp-core-realtime --tail 10 | grep -E "(Running|error|Error|ERROR)" || echo "Sem erros recentes"
echo ""

# Verificar se Realtime responde
echo "🔌 Testando conexão direta (porta 4000)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/socket/websocket | grep -q "403\|101"; then
    echo "✅ Realtime responde na porta 4000"
else
    echo "⚠️  Realtime pode não estar respondendo corretamente"
fi
echo ""

# Verificar proxy nginx
echo "🔌 Testando proxy nginx (porta 3001)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/realtime/v1/websocket || echo "000")
if [ "$HTTP_CODE" = "101" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Proxy nginx está funcionando (HTTP $HTTP_CODE)"
else
    echo "⚠️  Proxy nginx pode não estar configurado corretamente (HTTP $HTTP_CODE)"
fi
echo ""

# Verificar publicação PostgreSQL
echo "📊 Verificando publicação PostgreSQL..."
PUB_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT COUNT(*) FROM pg_publication WHERE pubname = 'supabase_realtime';" | xargs)
if [ "$PUB_COUNT" = "1" ]; then
    echo "✅ Publicação PostgreSQL existe"
else
    echo "⚠️  Publicação PostgreSQL pode não estar configurada"
    echo "   Execute: docker exec -i chefiapp-core-postgres psql -U postgres -d chefiapp_core < docker-core/schema/realtime_setup.sql"
fi
echo ""

echo "✅ Teste concluído!"
echo ""
echo "💡 Para testar no navegador:"
echo "   1. Abra http://localhost:5175/kds-minimal"
echo "   2. Abra DevTools → Console"
echo "   3. Verifique se aparece 'Realtime status: SUBSCRIBED'"
echo "   4. Crie um pedido e veja se aparece imediatamente no KDS"