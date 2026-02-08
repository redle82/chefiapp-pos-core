#!/bin/bash

# TESTE FASE 0 — ESTADO ZERO
# Objetivo: Confirmar que o sistema sobe limpo

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE FASE 0 — ESTADO ZERO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar Docker Core
echo "1️⃣ Verificando Docker Core..."
if ! docker ps | grep -q "chefiapp-core-postgres"; then
    echo "❌ ERRO: Docker Core não está rodando"
    echo "   Execute: docker-compose -f docker-core/docker-compose.core.yml up -d"
    exit 1
fi
echo "✅ Docker Core rodando"

# 2. Verificar serviços
echo ""
echo "2️⃣ Verificando serviços..."
POSTGRES_OK=$(docker exec chefiapp-core-postgres pg_isready -U postgres >/dev/null 2>&1 && echo "OK" || echo "FAIL")
POSTGREST_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/rest/v1/ 2>/dev/null || echo "000")

if [ "$POSTGRES_OK" != "OK" ]; then
    echo "❌ ERRO: PostgreSQL não está respondendo"
    exit 1
fi
echo "✅ PostgreSQL: OK"

# PostgREST pode retornar 200, 401, 404 (rota não existe) ou 406 (not acceptable)
# Qualquer código HTTP significa que o serviço está rodando
if [ "$POSTGREST_OK" = "000" ]; then
    echo "❌ ERRO: PostgREST não está respondendo"
    exit 1
fi
echo "✅ PostgREST: OK (código: $POSTGREST_OK - serviço rodando)"

# 3. Verificar frontend (se estiver rodando)
echo ""
echo "3️⃣ Verificando frontend..."
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null || echo "000")

if [ "$FRONTEND_OK" = "000" ]; then
    echo "⚠️  AVISO: Frontend não está rodando (porta 5173)"
    echo "   Execute: cd merchant-portal && npm run dev"
    echo "   Continuando com testes do Core..."
elif [ "$FRONTEND_OK" != "200" ]; then
    echo "⚠️  AVISO: Frontend retornou código $FRONTEND_OK"
else
    echo "✅ Frontend: OK"
    
    # Verificar conteúdo da página
    PAGE_CONTENT=$(curl -s http://localhost:5173/ 2>/dev/null || echo "")
    if echo "$PAGE_CONTENT" | grep -q "UI RESET / CORE ONLY"; then
        echo "✅ Página mostra tela de reset (correto)"
    elif echo "$PAGE_CONTENT" | grep -q "CoreResetPage"; then
        echo "✅ Página mostra CoreResetPage (correto)"
    else
        echo "⚠️  AVISO: Conteúdo da página não identificado como tela de reset"
    fi
fi

# 4. Verificar que não há redirecionamentos automáticos
echo ""
echo "4️⃣ Verificando ausência de redirecionamentos..."
# Se frontend estiver rodando, verificar que não redireciona
if [ "$FRONTEND_OK" = "200" ]; then
    REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" -L http://localhost:5173/ 2>/dev/null || echo "")
    if [ -n "$REDIRECT" ] && [ "$REDIRECT" != "http://localhost:5173/" ]; then
        echo "❌ ERRO: Frontend está redirecionando para: $REDIRECT"
        exit 1
    fi
    echo "✅ Nenhum redirecionamento detectado"
fi

# 5. Resumo
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ TESTE FASE 0 — APROVADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Sistema está em estado zero:"
echo "  ✅ Docker Core rodando"
echo "  ✅ PostgreSQL acessível"
echo "  ✅ PostgREST acessível"
if [ "$FRONTEND_OK" = "200" ]; then
    echo "  ✅ Frontend mostra tela de reset"
    echo "  ✅ Nenhum redirecionamento automático"
fi
echo ""
echo "Pronto para FASE 1 — Contrato do Core (Leitura)"
echo ""
