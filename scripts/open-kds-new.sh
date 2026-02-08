#!/bin/bash
# ============================================================================
# ABRIR APENAS O NOVO KDS — Script de Acesso Isolado
# ============================================================================
# 
# OBJETIVO: Abrir SOMENTE o novo KDS, garantindo que:
#   - Nenhuma rota antiga seja usada
#   - Nenhum cache antigo interfira
#   - O foco seja 100% no KDS novo
#   - Rodar em modo demo
#   - Ideal para teste visual da Fase 3 (Tempo Visível)
# 
# USO:
#   ./scripts/open-kds-new.sh
# 
# ============================================================================

set -e

echo "🍳 Abrindo NOVO KDS (Fase 3: Tempo Visível)"
echo ""

# ============================================================================
# 1. GARANTIR QUE NÃO HÁ INSTÂNCIAS ANTIGAS RODANDO
# ============================================================================
echo "📋 Verificando processos antigos..."

# Matar processos na porta 5173 (Vite dev server)
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "   ⚠️  Encontrado processo na porta 5173. Encerrando..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
    echo "   ✅ Processos antigos encerrados"
else
    echo "   ✅ Nenhum processo antigo encontrado"
fi

# ============================================================================
# 2. LIMPAR CACHE DO VITE / BUILD ANTERIOR
# ============================================================================
echo ""
echo "🧹 Limpando cache..."

cd merchant-portal

# Limpar cache do Vite
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo "   ✅ Cache do Vite limpo"
else
    echo "   ℹ️  Nenhum cache do Vite encontrado"
fi

# Limpar build anterior (se existir)
if [ -d "dist" ]; then
    rm -rf dist
    echo "   ✅ Build anterior removido"
fi

# ============================================================================
# 3. OBTER RESTAURANT ID (do seed ou gerar um padrão)
# ============================================================================
echo ""
echo "🔍 Obtendo Restaurant ID..."

# Tentar obter do banco (se Docker Core estiver rodando)
RESTAURANT_ID=""

# Verificar se Docker Core está rodando
if docker ps | grep -q "chefiapp-core-postgres"; then
    echo "   ℹ️  Docker Core detectado. Buscando Restaurant ID..."
    
    # Tentar obter o primeiro restaurant_id do banco
    RESTAURANT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT id FROM public.gm_restaurants LIMIT 1;" 2>/dev/null | tr -d '[:space:]' || echo "")
    
    if [ -n "$RESTAURANT_ID" ]; then
        echo "   ✅ Restaurant ID encontrado: ${RESTAURANT_ID:0:8}..."
    else
        echo "   ⚠️  Nenhum restaurante encontrado no banco"
    fi
fi

# Se não encontrou, usar um ID padrão para demo (do seeds_dev.sql)
if [ -z "$RESTAURANT_ID" ]; then
    # ID padrão do seed do Docker Core (seeds_dev.sql)
    RESTAURANT_ID="00000000-0000-0000-0000-000000000100"
    echo "   ℹ️  Usando Restaurant ID padrão para demo: ${RESTAURANT_ID}"
    echo "   💡 Dica: Se o Docker Core estiver rodando, rode o seed primeiro:"
    echo "      cd docker-core && ./show-everything.sh"
fi

# ============================================================================
# 4. SUBIR O FRONTEND EM MODO LIMPO
# ============================================================================
echo ""
echo "🚀 Iniciando servidor de desenvolvimento..."

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "   ⚠️  node_modules não encontrado. Instalando dependências..."
    npm install
fi

# Iniciar servidor em background
echo "   📡 Iniciando Vite dev server..."
npm run dev > /tmp/vite-kds.log 2>&1 &
VITE_PID=$!

# Aguardar servidor iniciar
echo "   ⏳ Aguardando servidor iniciar..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "   ✅ Servidor iniciado (PID: $VITE_PID)"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "   ❌ Timeout: Servidor não iniciou em 30s"
        echo "   📋 Logs disponíveis em: /tmp/vite-kds.log"
        kill $VITE_PID 2>/dev/null || true
        exit 1
    fi
done

# ============================================================================
# 5. ABRIR SOMENTE O NOVO KDS (MODO DEMO)
# ============================================================================
echo ""
echo "🌐 Abrindo KDS no navegador..."

# URL do novo KDS standalone
KDS_URL="http://localhost:5173/kds/${RESTAURANT_ID}?demo=true&kdsVersion=new&noLegacy=true"

echo "   🔗 URL: ${KDS_URL}"
echo ""

# Abrir no navegador padrão
if command -v open > /dev/null; then
    # macOS
    open "${KDS_URL}"
elif command -v xdg-open > /dev/null; then
    # Linux
    xdg-open "${KDS_URL}"
elif command -v start > /dev/null; then
    # Windows
    start "${KDS_URL}"
else
    echo "   ⚠️  Não foi possível abrir o navegador automaticamente"
    echo "   📋 Copie e cole esta URL no navegador:"
    echo "   ${KDS_URL}"
fi

# ============================================================================
# 6. INSTRUÇÕES DE TESTE
# ============================================================================
echo ""
echo "✅ KDS aberto!"
echo ""
echo "👀 CHECKLIST RÁPIDO PARA TESTAR FASE 3 (1 minuto):"
echo ""
echo "   [ ] Dá pra entender atraso sem ler nada?"
echo "   [ ] Vermelho chama atenção sem estressar?"
echo "   [ ] Pulsação não cansa?"
echo "   [ ] Timer é legível a 2–3 metros?"
echo "   [ ] ⚠️ aparece só quando faz sentido?"
echo ""
echo "📋 Logs do servidor: tail -f /tmp/vite-kds.log"
echo "🛑 Para parar: kill $VITE_PID"
echo ""
echo "🎯 Se isso passar → Fase 3 está validada."
echo ""
