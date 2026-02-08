#!/bin/bash

# Monitor em Tempo Real - Teste Massivo Nível 5
# Mostra barra de progresso e estatísticas em tempo real

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

echo "🚀 Iniciando monitor em tempo real..."
echo ""

# Verificar Docker Core
if ! docker ps | grep -q chefiapp-core-postgres; then
  echo "❌ Docker Core não está rodando. Execute: docker-compose -f docker-core/docker-compose.core.yml up -d"
  exit 1
fi

# Executar monitor
npx tsx scripts/teste-massivo-nivel-5/monitor-tempo-real.ts
