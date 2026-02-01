#!/bin/bash
# Runner para Teste Massivo Nível 4

set -e

SCENARIO="${1:-M}"

if [[ ! "$SCENARIO" =~ ^[SMLXL]$ ]]; then
  echo "❌ Cenário inválido: $SCENARIO"
  echo "Uso: $0 [S|M|L|XL]"
  echo ""
  echo "Cenários:"
  echo "  S  - Ambulante (1 restaurante, 1 mesa, 1 estação)"
  echo "  M  - Restaurante Médio (1 restaurante, 15 mesas, 2 estações, 3 garçons)"
  echo "  L  - Grupo Multi-restaurantes (4 restaurantes, 60 mesas, 8 garçons, 2 gerentes, 1 dono)"
  echo "  XL - McDonald's Mode (10 restaurantes, 200 mesas, ondas temporais, alta concorrência)"
  exit 1
fi

echo "🧪 Teste Massivo Nível 4"
echo "📊 Cenário: $SCENARIO"
echo ""

# Verificar se Docker está rodando
if ! docker ps | grep -q chefiapp-core-postgres; then
  echo "❌ Docker Core não está rodando"
  echo "Execute: docker compose -f docker-core/docker-compose.core.yml up -d"
  exit 1
fi

# Verificar se PostgREST está rodando
if ! curl -s http://localhost:3001/rest/v1/ > /dev/null; then
  echo "⚠️  PostgREST não está respondendo (continuando mesmo assim...)"
fi

# Executar teste
export SCENARIO=$SCENARIO
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:54320/chefiapp_core}"

cd "$(dirname "$0")/.."

npx ts-node scripts/teste-massivo-nivel-4/index.ts

echo ""
echo "✅ Teste concluído!"
echo "📁 Relatórios em: test-results/NIVEL_4/"
