#!/usr/bin/env bash
# CHEFIAPP POS CORE — Pre-Flight Check
# Verifica que tudo está configurado antes de rodar testes massivos

set -euo pipefail

PROJECT_ROOT="/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core"
cd "$PROJECT_ROOT"

echo "================================================"
echo "CHEFIAPP POS CORE — Pré-Flight Check"
echo "================================================"
echo ""

# 1. Verificar Node/NPM
echo "[1/5] Verificando Node e NPM..."
NODE_VERSION=$(node -v 2>&1 || echo "NOT_FOUND")
NPM_VERSION=$(npm -v 2>&1 || echo "NOT_FOUND")

if [[ "$NODE_VERSION" == "NOT_FOUND" ]]; then
    echo "    ✗ ERRO: Node.js não encontrado"
    exit 1
else
    echo "    ✓ Node: $NODE_VERSION"
fi

if [[ "$NPM_VERSION" == "NOT_FOUND" ]]; then
    echo "    ✗ ERRO: NPM não encontrado"
    exit 1
else
    echo "    ✓ NPM: $NPM_VERSION"
fi

echo ""

# 2. Verificar Docker
echo "[2/5] Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "    ✗ ERRO: Docker não encontrado"
    echo "    Instale Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

DOCKER_VERSION=$(docker --version)
echo "    ✓ Docker: $DOCKER_VERSION"

echo ""

# 3. Verificar Docker Compose
echo "[3/5] Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "    ⚠ AVISO: docker-compose não encontrado, tentando 'docker compose'..."
    if ! docker compose version &> /dev/null; then
        echo "    ✗ ERRO: Docker Compose não disponível"
        exit 1
    fi
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "    ✓ Docker Compose: OK"

echo ""

# 4. Subir PostgreSQL
echo "[4/5] Subindo PostgreSQL..."
if ! $COMPOSE_CMD ps | grep -q "db.*Up"; then
    echo "    Iniciando containers..."
    $COMPOSE_CMD up -d
    
    # Aguardar PostgreSQL ficar pronto
    echo "    Aguardando PostgreSQL inicializar..."
    for i in {1..30}; do
        if $COMPOSE_CMD exec -T db pg_isready -U test_user -d chefiapp_core_test &> /dev/null; then
            echo "    ✓ PostgreSQL pronto!"
            break
        fi
        echo -n "."
        sleep 1
        
        if [ $i -eq 30 ]; then
            echo ""
            echo "    ✗ TIMEOUT: PostgreSQL não inicializou em 30s"
            exit 1
        fi
    done
else
    echo "    ✓ PostgreSQL já está rodando"
fi

echo ""

# 5. Testar conexão PostgreSQL
echo "[5/5] Testando conexão PostgreSQL..."
if psql "postgres://test_user:test_password@localhost:5432/chefiapp_core_test" -c "SELECT NOW();" &> /dev/null; then
    echo "    ✓ Conexão PostgreSQL OK"
else
    echo "    ⚠ AVISO: Comando psql não disponível localmente (OK se Docker funciona)"
    
    # Testar via Docker
    if $COMPOSE_CMD exec -T db psql -U test_user -d chefiapp_core_test -c "SELECT NOW();" &> /dev/null; then
        echo "    ✓ Conexão via Docker OK"
    else
        echo "    ✗ ERRO: Não foi possível conectar ao PostgreSQL"
        exit 1
    fi
fi

echo ""
echo "================================================"
echo "✓ PRÉ-FLIGHT CHECK COMPLETO"
echo "================================================"
echo ""
echo "Pronto para executar testes massivos:"
echo ""
echo "  # PILOT (rápido)"
echo "  npm run test:pilot"
echo ""
echo "  # MASSIVE (completo)"
echo "  npm run test:massive"
echo ""
echo "  # STRESS (extremo)"
echo "  npm run test:stress"
echo ""
echo "  # SEED MINER (caça-falha)"
echo "  ./scripts/seed_miner.sh 1 100"
echo ""
echo "================================================"
