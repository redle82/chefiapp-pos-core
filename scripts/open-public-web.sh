#!/bin/bash
# ============================================================================
# ABRIR PÁGINA WEB PÚBLICA — Script Docker-Only
# ============================================================================
# 
# OBJETIVO: Abrir página web pública, assumindo Docker Core ativo
# 
# PRÉ-REQUISITOS:
#   - Docker Core rodando (PostgREST na porta 3001, Realtime na 4000)
#   - Frontend rodando (Vite na porta 5175)
# 
# USO:
#   ./scripts/open-public-web.sh [slug]
# 
# ============================================================================

set -e

SLUG="${1:-test-restaurant}"
PORT="${VITE_PORT:-5175}"
BASE_URL="http://localhost:${PORT}"

echo "🌐 Abrindo Página Web Pública (Docker Core)..."
echo ""

# ============================================================================
# 1. VERIFICAR DOCKER CORE
# ============================================================================
echo "📋 Verificando Docker Core..."

if ! docker ps | grep -q "chefiapp-core-postgres"; then
    echo "   ❌ Docker Core não está rodando!"
    echo ""
    echo "   💡 Para subir o Docker Core:"
    echo "      cd docker-core"
    echo "      docker compose -f docker-compose.core.yml up -d"
    echo ""
    exit 1
fi

if ! docker ps | grep -q "chefiapp-core-postgrest"; then
    echo "   ⚠️  PostgREST não está rodando!"
    echo "   💡 Verifique: docker compose -f docker-core/docker-compose.core.yml ps"
    exit 1
fi

echo "   ✅ Docker Core detectado"
echo "      - Postgres: localhost:54320"
echo "      - PostgREST: localhost:3001"
echo "      - Realtime: localhost:4000"
echo ""

# ============================================================================
# 2. VERIFICAR FRONTEND
# ============================================================================
echo "📋 Verificando Frontend..."

if ! curl -s http://localhost:${PORT} > /dev/null 2>&1; then
    echo "   ⚠️  Frontend não está rodando na porta ${PORT}!"
    echo "   💡 Para iniciar:"
    echo "      cd merchant-portal"
    echo "      npm run dev"
    echo ""
    echo "   ⚠️  Continuando mesmo assim..."
else
    echo "   ✅ Frontend detectado na porta ${PORT}"
fi

echo ""

# ============================================================================
# 3. ABRIR PÁGINA WEB PÚBLICA
# ============================================================================
echo "🌐 Abrindo Página Web Pública..."
echo "   Slug: ${SLUG}"
echo "   URL: ${BASE_URL}/public/${SLUG}"
echo ""

# Abrir no navegador
if command -v open &> /dev/null; then
    # macOS
    open "${BASE_URL}/public/${SLUG}"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "${BASE_URL}/public/${SLUG}"
elif command -v start &> /dev/null; then
    # Windows
    start "${BASE_URL}/public/${SLUG}"
else
    echo "❌ Não foi possível abrir o navegador automaticamente."
    echo "   Abra manualmente: ${BASE_URL}/public/${SLUG}"
fi

echo ""
echo "✅ Página aberta!"
echo ""
echo "💡 Lembre-se:"
echo "   - Docker Core deve estar rodando (PostgREST:3001, Realtime:4000)"
echo "   - Frontend deve estar rodando (Vite:5175)"
echo "   - Tudo roda dentro do Docker, sem serviços externos"
