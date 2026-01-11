#!/bin/bash

# Script para abrir todos os apps do ChefIApp no navegador
# Porta padrão: 5173 (merchant-portal)

PORT=5173
BASE_URL="http://localhost:${PORT}"

# Apps para abrir
APPS=(
    "/app/tpv"
    "/app/kds"
    "/app/menu"
    "/app/orders"
    "/app/dashboard"
)

echo "🚀 Abrindo todos os apps do ChefIApp..."
echo ""

# Verifica se o servidor está rodando
if ! curl -s --max-time 2 "${BASE_URL}" > /dev/null 2>&1; then
    echo "❌ Servidor não está rodando na porta ${PORT}"
    echo ""
    echo "Para iniciar o servidor, execute:"
    echo "  npm -w merchant-portal run dev"
    echo ""
    echo "Ou se estiver usando outra porta, ajuste a variável PORT no script."
    exit 1
fi

echo "✅ Servidor detectado na porta ${PORT}"
echo ""

# Detecta o navegador padrão e abre todas as URLs
if command -v open > /dev/null; then
    # macOS
    for app in "${APPS[@]}"; do
        url="${BASE_URL}${app}"
        echo "📱 Abrindo: ${url}"
        open "${url}"
        sleep 0.5  # Pequeno delay para evitar sobrecarga
    done
elif command -v xdg-open > /dev/null; then
    # Linux
    for app in "${APPS[@]}"; do
        url="${BASE_URL}${app}"
        echo "📱 Abrindo: ${url}"
        xdg-open "${url}" &
        sleep 0.5
    done
elif command -v start > /dev/null; then
    # Windows
    for app in "${APPS[@]}"; do
        url="${BASE_URL}${app}"
        echo "📱 Abrindo: ${url}"
        start "${url}"
        sleep 0.5
    done
else
    echo "❌ Não foi possível detectar o comando para abrir URLs"
    exit 1
fi

echo ""
echo "✅ Todos os apps foram abertos!"
echo ""
echo "Apps abertos:"
for app in "${APPS[@]}"; do
    echo "  • ${BASE_URL}${app}"
done

