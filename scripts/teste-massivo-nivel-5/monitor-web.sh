#!/bin/bash

# Monitor Web - Teste Massivo Nível 5
# Abre o monitor no navegador

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

echo "🚀 Iniciando monitor web..."
echo ""

# Verificar Docker Core
if ! docker ps | grep -q chefiapp-core-postgres; then
  echo "❌ Docker Core não está rodando. Execute: docker-compose -f docker-core/docker-compose.core.yml up -d"
  exit 1
fi

# Executar monitor em background
npx tsx scripts/teste-massivo-nivel-5/monitor-web.ts &
MONITOR_PID=$!

# Aguardar servidor iniciar
sleep 2

# Abrir no navegador
echo "📊 Abrindo monitor no navegador..."
if command -v open >/dev/null 2>&1; then
  open "http://localhost:4321"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:4321"
else
  echo "⚠️  Abra manualmente: http://localhost:4321"
fi

echo ""
echo "✅ Monitor rodando em: http://localhost:4321"
echo "💡 Pressione Ctrl+C para parar"
echo ""

# Aguardar Ctrl+C
trap "kill $MONITOR_PID 2>/dev/null; exit" INT TERM
wait $MONITOR_PID
