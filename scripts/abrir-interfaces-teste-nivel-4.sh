#!/bin/bash
# Abre todas as interfaces do ChefIApp para validação visual

set -e

PORT="${PORT:-5175}"
BASE_URL="http://localhost:${PORT}"

echo "🌐 Abrindo interfaces do ChefIApp..."
echo ""

# Verificar se o servidor está rodando
if ! curl -s "${BASE_URL}" > /dev/null 2>&1; then
  echo "⚠️  Servidor não está rodando em ${BASE_URL}"
  echo "Execute: cd merchant-portal && npm run dev"
  echo ""
fi

# Abrir interfaces
echo "📱 Abrindo interfaces no navegador..."

if command -v open > /dev/null; then
  # macOS
  open "${BASE_URL}/kds"
  sleep 1
  open "${BASE_URL}/task-system"
  sleep 1
  open "${BASE_URL}/shopping-list"
  sleep 1
  open "${BASE_URL}/menu-builder"
elif command -v xdg-open > /dev/null; then
  # Linux
  xdg-open "${BASE_URL}/kds" &
  sleep 1
  xdg-open "${BASE_URL}/task-system" &
  sleep 1
  xdg-open "${BASE_URL}/shopping-list" &
  sleep 1
  xdg-open "${BASE_URL}/menu-builder" &
else
  echo "❌ Não foi possível abrir navegador automaticamente"
  echo "Abra manualmente:"
  echo "  - KDS: ${BASE_URL}/kds"
  echo "  - Task System: ${BASE_URL}/task-system"
  echo "  - Shopping List: ${BASE_URL}/shopping-list"
  echo "  - Menu Builder: ${BASE_URL}/menu-builder"
  exit 1
fi

echo ""
echo "✅ Interfaces abertas!"
echo ""
echo "📋 Checklist Visual:"
echo "  [ ] KDS: Ver pedidos agrupados por estação"
echo "  [ ] Task System: Ver tarefas abertas"
echo "  [ ] Shopping List: Ver itens abaixo do mínimo"
echo "  [ ] Menu Builder: Verificar tempo + estação em produtos"
echo ""
echo "📄 Relatório completo: test-results/NIVEL_4/CHECKLIST_VISUAL.md"
