#!/bin/bash

# 🔧 FASE A — LIMPEZA NÃO-DESTRUTIVA
# Data: 2026-01-18
# Objetivo: Reduzir entropia sem quebrar nada

set -e  # Parar em caso de erro

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 FASE A — LIMPEZA NÃO-DESTRUTIVA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# 1️⃣ REMOÇÃO SEGURA (Logs, Cache, Artefatos)
# ============================================

echo "📋 PASSO 1: Removendo logs, cache e artefatos..."
echo ""

# Logs na raiz
echo "  → Removendo logs da raiz..."
rm -f stripe-listen.log stripe-listen-3099.log a3-server.log billing-server.log 2>/dev/null || true

# Logs em merchant-portal
echo "  → Removendo logs em merchant-portal..."
rm -f merchant-portal/test_output.log merchant-portal/test-output-3.log merchant-portal/test_output_2.log 2>/dev/null || true

# Logs em docs/archive
echo "  → Removendo logs em docs/archive..."
rm -f docs/archive/*.log 2>/dev/null || true

# Cache Python
echo "  → Removendo cache Python..."
rm -rf testsprite_tests/__pycache__/ 2>/dev/null || true

# Artefatos de teste
echo "  → Removendo artefatos de teste..."
rm -rf test-results/ 2>/dev/null || true
rm -f audit-ui-click-findings.json audit-ui-comprehensive.json 2>/dev/null || true

# Arquivos temporários
echo "  → Removendo arquivos temporários..."
find . -name "*.tmp" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true

echo "✅ PASSO 1 concluído"
echo ""

# ============================================
# 2️⃣ CRIAR ESTRUTURA /archive
# ============================================

echo "📋 PASSO 2: Criando estrutura /archive..."
echo ""

mkdir -p archive/code
mkdir -p archive/reports
mkdir -p archive/scripts
mkdir -p archive/docs
mkdir -p archive/data

echo "✅ PASSO 2 concluído"
echo ""

# ============================================
# 3️⃣ MOVER CÓDIGO MORTO
# ============================================

echo "📋 PASSO 3: Movendo código morto..."
echo ""

if [ -d "phase2" ]; then
    echo "  → Movendo phase2/ → archive/code/phase2/"
    mv phase2 archive/code/ 2>/dev/null || true
fi

if [ -d "phase3" ]; then
    echo "  → Movendo phase3/ → archive/code/phase3/"
    mv phase3 archive/code/ 2>/dev/null || true
fi

echo "✅ PASSO 3 concluído"
echo ""

# ============================================
# 4️⃣ MOVER RELATÓRIOS HISTÓRICOS
# ============================================

echo "📋 PASSO 4: Movendo relatórios históricos..."
echo ""

if [ -d "audit-reports" ]; then
    mkdir -p archive/reports/audit-reports
    
    # Mover relatórios antigos (manter apenas os 3 mais recentes)
    echo "  → Movendo relatórios antigos (mantendo 3 mais recentes)..."
    cd audit-reports
    ls -t audit-report-*.md 2>/dev/null | tail -n +4 | xargs -I {} mv {} ../archive/reports/audit-reports/ 2>/dev/null || true
    cd ..
fi

echo "✅ PASSO 4 concluído"
echo ""

# ============================================
# 5️⃣ MOVER DUMPS DE DADOS
# ============================================

echo "📋 PASSO 5: Movendo dumps de dados..."
echo ""

if [ -f "merchant-001-record.json" ]; then
    echo "  → Movendo merchant-001-record.json → archive/data/"
    mv merchant-001-record.json archive/data/ 2>/dev/null || true
fi

echo "✅ PASSO 5 concluído"
echo ""

# ============================================
# 6️⃣ CONSOLIDAR SCRIPTS DUPLICADOS
# ============================================

echo "📋 PASSO 6: Consolidando scripts duplicados..."
echo ""

if [ -f "aplicar_migration_cli.sh" ]; then
    echo "  → Movendo aplicar_migration_cli.sh → archive/scripts/"
    mv aplicar_migration_cli.sh archive/scripts/ 2>/dev/null || true
fi

if [ -f "aplicar_migration_mcp.sh" ]; then
    echo "  → Movendo aplicar_migration_mcp.sh → archive/scripts/"
    mv aplicar_migration_mcp.sh archive/scripts/ 2>/dev/null || true
fi

echo "✅ PASSO 6 concluído"
echo ""

# ============================================
# 7️⃣ CRIAR archive/README.md
# ============================================

echo "📋 PASSO 7: Criando archive/README.md..."
echo ""

cat > archive/README.md << 'EOF'
# Archive

Este diretório contém código, documentação e artefatos históricos que não são mais usados ativamente, mas são mantidos para referência.

## Estrutura

- `code/` - Código morto (phase2, phase3)
- `reports/` - Relatórios históricos de auditoria
- `scripts/` - Scripts one-shot executados uma vez
- `docs/` - Documentação obsoleta consolidada
- `data/` - Dumps de dados de teste

## Política de Limpeza

- Arquivos aqui podem ser deletados após 90 dias sem uso
- Antes de deletar, verificar:
  - Nenhum import encontrado
  - Nenhuma referência em docs atuais
  - Build funciona sem eles

## Data de Criação

2026-01-18 — Fase A de limpeza não-destrutiva
EOF

echo "✅ PASSO 7 concluído"
echo ""

# ============================================
# RESUMO
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ FASE A CONCLUÍDA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Resumo:"
echo "  • Logs removidos"
echo "  • Cache removido"
echo "  • Artefatos removidos"
echo "  • Estrutura /archive criada"
echo "  • Código morto movido"
echo "  • Relatórios históricos organizados"
echo "  • Scripts duplicados consolidados"
echo ""
echo "🎯 Próximo passo: Validar que build funciona"
echo "   → npm run build"
echo "   → npm test"
echo ""
