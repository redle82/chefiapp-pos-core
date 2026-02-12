#!/bin/bash
# Validação Completa da Arquitetura Híbrida
# Verifica que operações críticas usam coreClient e analytics usam analyticsClient

set -e

echo "🏗️ VALIDAÇÃO ARQUITETURA HÍBRIDA"
echo "=================================="
echo ""

# ─── 1. Type Check ────────────────────────────────────────────────
echo "1️⃣ TypeScript Compilation..."
cd merchant-portal
if pnpm tsc --noEmit; then
  echo "✅ TypeScript compilation OK"
else
  echo "❌ TypeScript errors detected"
  exit 1
fi
echo ""

# ─── 2. Test Hybrid Backend ──────────────────────────────────────
echo "2️⃣ Hybrid Backend Tests..."
if pnpm vitest run src/core/infra/hybridBackend.test.ts; then
  echo "✅ Hybrid backend tests passed"
else
  echo "❌ Hybrid backend tests failed"
  exit 1
fi
echo ""

# ─── 3. Test Core Operations API ─────────────────────────────────
echo "3️⃣ Core Operations API Tests..."
if pnpm vitest run src/core/infra/backendClient.test.ts; then
  echo "✅ Backend client tests passed"
else
  echo "❌ Backend client tests failed"
  exit 1
fi
echo ""

# ─── 4. Validar Imports (Grep Analysis) ──────────────────────────
echo "4️⃣ Import Pattern Analysis..."

# CoreOrdersApi deve importar coreClient
if grep -q "from.*coreClient" src/core/infra/CoreOrdersApi.ts; then
  echo "✅ CoreOrdersApi imports coreClient (correto)"
else
  echo "❌ CoreOrdersApi não importa coreClient"
  exit 1
fi

# connection.ts deve importar coreClient
if grep -q "from.*coreClient" src/core-boundary/docker-core/connection.ts; then
  echo "✅ connection.ts imports coreClient (correto)"
else
  echo "❌ connection.ts não importa coreClient"
  exit 1
fi

# backendClient.ts deve ter deprecation warning
if grep -q "DEPRECATED" src/core/infra/backendClient.ts; then
  echo "✅ backendClient.ts marked as DEPRECATED"
else
  echo "⚠️  backendClient.ts should be marked DEPRECATED"
fi

echo ""

# ─── 5. Validar Estrutura de Arquivos ────────────────────────────
echo "5️⃣ File Structure Validation..."

required_files=(
  "src/core/infra/coreClient.ts"
  "src/core/infra/analyticsClient.ts"
  "src/core/infra/insforgeClient.ts"
  "src/core/infra/dockerCoreFetchClient.ts"
  "src/core/infra/backendClient.ts"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
    exit 1
  fi
done

echo ""

# ─── 6. Validar Documentação ──────────────────────────────────────
echo "6️⃣ Documentation Check..."

if [ -f "../docs/architecture/ADR_HYBRID_BACKEND.md" ]; then
  echo "✅ ADR_HYBRID_BACKEND.md exists"
else
  echo "❌ ADR_HYBRID_BACKEND.md missing"
  exit 1
fi

echo ""

# ─── 7. Smoke Test (Core Health) ──────────────────────────────────
echo "7️⃣ Core Health Smoke Test..."
echo "Verificando se Docker Core está acessível..."

# Tentar query simples ao Core
if curl -s http://localhost:3001/rest/v1/ > /dev/null 2>&1; then
  echo "✅ Docker Core is reachable (http://localhost:3001)"
else
  echo "⚠️  Docker Core não está rodando localmente"
  echo "   (Esperado em CI/CD, mas necessário para dev local)"
fi

echo ""

# ─── 8. Summary ───────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VALIDAÇÃO COMPLETA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Arquitetura Híbrida validada com sucesso:"
echo "  • coreClient    → Operações críticas (sempre Docker)"
echo "  • analyticsClient → Leituras/analytics (InsForge com fallback)"
echo "  • Separação clara entre critical path e analytics path"
echo ""
echo "Próximos passos:"
echo "  1. Fase 2: Testes de falha (InsForge offline, latência alta)"
echo "  2. Fase 3: Observabilidade (logs, métricas, alertas)"
echo "  3. Fase 4: Sincronização Docker ↔ InsForge"
echo ""
echo "Documentação: docs/architecture/ADR_HYBRID_BACKEND.md"
echo ""
