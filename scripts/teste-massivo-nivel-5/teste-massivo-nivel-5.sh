#!/bin/bash

# Teste Massivo Nível 5 - Stress de Realidade Extrema
# Executa o teste completo

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

echo "🚀 TESTE MASSIVO NÍVEL 5 - STRESS DE REALIDADE EXTREMA"
echo "===================================================="
echo ""
echo "⚠️  ATENÇÃO: Este teste é EXTREMO e pode levar horas."
echo "⚠️  Certifique-se de que Docker Core está rodando."
echo ""

# Verificar Docker Core
if ! docker ps | grep -q chefiapp-core-postgres; then
  echo "❌ Docker Core não está rodando. Execute: docker-compose -f docker-core/docker-compose.core.yml up -d"
  exit 1
fi

echo "✅ Docker Core detectado"
echo ""

# Executar teste
echo "Iniciando teste..."
npx tsx scripts/teste-massivo-nivel-5/index.ts

echo ""
echo "✅ Teste completo!"
echo ""
echo "Relatórios disponíveis em: test-results/NIVEL_5/"
