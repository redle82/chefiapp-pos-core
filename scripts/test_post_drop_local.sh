#!/usr/bin/env bash
set -e

echo "🔥 TESTE SUPREMO — POST DROP LEGACY (LOCAL)"

echo "1️⃣ Verificando Docker Core..."
docker compose -f docker-core/docker-compose.core.yml ps | grep chefiapp-core-postgres | grep healthy

echo "2️⃣ Verificando tabelas CORE/OPERATIONAL..."
docker exec -i chefiapp-core-postgres psql -U postgres -d chefiapp_core <<'SQL'
SELECT COUNT(*) AS tables
FROM information_schema.tables
WHERE table_schema='public'
AND table_name LIKE 'gm_%';
SQL

echo "3️⃣ Garantindo que tabelas LEGACY não existem..."
docker exec -i chefiapp-core-postgres psql -U postgres -d chefiapp_core <<'SQL'
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'
AND table_name IN (
  'mentor_suggestions',
  'mentor_recommendations',
  'restaurant_groups',
  'reservations',
  'cash_flow'
);
SQL

echo "4️⃣ Frontend — build e testes..."
cd merchant-portal
npm run test

echo "5️⃣ Navegação soberana (smoke HTTP)..."
# Porta oficial do merchant-portal (vite.config.ts: port 5175)
PORT="${VITE_PORT:-5175}"
code_dash="$(curl -sSf -o /dev/null -w '%{http_code}' "http://localhost:${PORT}/app/dashboard" 2>/dev/null || true)"
if [ "$code_dash" != "200" ]; then
  echo "⚠️  Dev server não está em http://localhost:${PORT} (resposta: ${code_dash:-sem conexão})."
  echo "   Inicie com: cd merchant-portal && npm run dev"
  echo "   Depois volte a correr este script para validar o passo 5."
  exit 1
fi
code_install="$(curl -sSf -o /dev/null -w '%{http_code}' "http://localhost:${PORT}/app/install" 2>/dev/null || true)"
if [ "$code_install" != "200" ]; then
  echo "⚠️  /app/install não responde 200 (resposta: ${code_install}). Verifique o dev server em :${PORT}"
  exit 1
fi

echo "✅ TESTE AUTOMÁTICO PASSOU"

