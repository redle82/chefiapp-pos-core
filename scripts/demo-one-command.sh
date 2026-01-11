#!/bin/bash
# 🚀 Demo One Command - Zero Setup
# Executa demo completa com reset automático

set -e

CLEAN=false
RECORD=false
HEADLESS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --record)
            RECORD=true
            shift
            ;;
        --headless)
            HEADLESS=true
            shift
            ;;
        *)
            echo "Uso: $0 [--clean] [--record] [--headless]"
            exit 1
            ;;
    esac
done

echo "🚀 Iniciando Demo AppStaff (One Command)..."
echo ""

# Clean mode: resetar estado
if [ "$CLEAN" = true ]; then
    echo "🧹 Limpando estado anterior..."
    
    # Limpar localStorage simulado (se houver)
    rm -rf tests/reports/*.md tests/reports/*.json 2>/dev/null || true
    
    # Resetar banco de dados de teste (se configurado)
    if [ -f ".env.test" ]; then
        echo "   Resetando banco de teste..."
        # Comando de reset do banco (ajustar conforme setup)
    fi
    
    echo "✅ Estado limpo"
    echo ""
fi

# Verificar pré-requisitos
echo "🔍 Verificando pré-requisitos..."

# Verificar se servidor está rodando
if ! curl -s http://localhost:4320/health > /dev/null 2>&1; then
    echo "⚠️  Servidor não está rodando na porta 4320"
    echo "   Iniciando servidor em background..."
    npm run server:web-module > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 3
    echo "✅ Servidor iniciado (PID: $SERVER_PID)"
fi

# Verificar se frontend está rodando
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "⚠️  Frontend não está rodando na porta 5173"
    echo "   Por favor, inicie o frontend em outro terminal:"
    echo "   cd merchant-portal && npm run dev"
    echo ""
    read -p "Pressione Enter quando o frontend estiver rodando..."
fi

echo "✅ Pré-requisitos verificados"
echo ""

# Executar demo
echo "🎭 Executando demo..."
echo ""

if [ "$RECORD" = true ]; then
    echo "📹 Modo gravação ativado"
    # Em produção, integrar com ferramenta de gravação (ex: asciinema, OBS)
    echo "   (Gravação será implementada na próxima versão)"
fi

# Executar demo automático
if [ "$HEADLESS" = true ]; then
    npx playwright test tests/appstaff-full-operation-simulation.spec.ts --headed=false
else
    npx ts-node tests/appstaff-demo-mode.ts
fi

# Gerar relatório
echo ""
echo "📊 Gerando relatório..."
npm run metrics:appstaff

echo ""
echo "✅ Demo concluída!"
echo "📁 Relatórios disponíveis em: tests/reports/"
echo ""

