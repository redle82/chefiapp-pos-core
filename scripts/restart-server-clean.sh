#!/bin/bash
# Script para reiniciar servidor limpo
# Uso: ./scripts/restart-server-clean.sh

set -e

PORT=4320

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 REINICIANDO SERVIDOR LIMPO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Verificar processos na porta
echo "1️⃣ Verificando processos na porta $PORT..."
PROCESSES=$(lsof -i :$PORT 2>/dev/null | grep -v COMMAND || true)

if [ -n "$PROCESSES" ]; then
    echo "⚠️  Processos encontrados:"
    echo "$PROCESSES"
    echo ""
    echo "2️⃣ Parando processos..."
    
    # Extrair PIDs
    PIDS=$(echo "$PROCESSES" | awk 'NR>1 {print $2}' | sort -u)
    
    for PID in $PIDS; do
        echo "   Matando processo $PID..."
        kill -9 $PID 2>/dev/null || true
    done
    
    # Aguardar um pouco
    sleep 2
    
    # Verificar novamente
    REMAINING=$(lsof -i :$PORT 2>/dev/null | grep -v COMMAND || true)
    if [ -n "$REMAINING" ]; then
        echo "❌ Ainda há processos na porta. Execute manualmente:"
        echo "   lsof -i :$PORT"
        echo "   kill -9 <PID>"
        exit 1
    fi
    
    echo "✅ Porta $PORT está livre"
else
    echo "✅ Porta $PORT já está livre"
fi

echo ""
echo "3️⃣ Verificando variáveis de ambiente..."
if [ -z "$WEB_MODULE_RESTAURANT_ID" ]; then
    echo "⚠️  WEB_MODULE_RESTAURANT_ID não está configurado"
    echo "   Configure no .env ou exporte:"
    echo "   export WEB_MODULE_RESTAURANT_ID=<restaurant_id>"
else
    echo "✅ WEB_MODULE_RESTAURANT_ID: $WEB_MODULE_RESTAURANT_ID"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SERVIDOR PRONTO PARA REINICIAR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute: npm run dev"
echo "   2. Aguarde logs de startup"
echo "   3. Execute: ./scripts/test-order-creation-manual.sh"
echo "   4. Verifique logs do servidor: [API] /api/orders POST failed:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
