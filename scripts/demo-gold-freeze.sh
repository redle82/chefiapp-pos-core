#!/bin/bash
# 🔒 Demo Gold Freeze Script
# Congela o pacote de demo como produto fechado

set -e

VERSION="appstaff-demo-gold-v1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🔒 Congelando Demo Gold v1..."
echo ""

# Criar diretório de release
RELEASE_DIR="releases/${VERSION}"
mkdir -p "$RELEASE_DIR"

# Copiar arquivos essenciais da demo
echo "📦 Copiando arquivos da demo..."

# Teste E2E
mkdir -p "$RELEASE_DIR/tests"
cp tests/appstaff-full-operation-simulation.spec.ts "$RELEASE_DIR/tests/"
cp tests/appstaff-demo-mode.ts "$RELEASE_DIR/tests/"
cp tests/appstaff-metrics-extractor.ts "$RELEASE_DIR/tests/"
cp tests/README_APPSTAFF_SIMULATION.md "$RELEASE_DIR/tests/"

# Documentação comercial
mkdir -p "$RELEASE_DIR/docs"
cp docs/APPSTAFF_DEMO_NARRATIVE.md "$RELEASE_DIR/docs/"
cp docs/APPSTAFF_DEMO_CHECKLIST.md "$RELEASE_DIR/docs/"
cp docs/APPSTAFF_SALES_SCRIPT.md "$RELEASE_DIR/docs/"
cp docs/APPSTAFF_DEMO_INDEX.md "$RELEASE_DIR/docs/"

# Criar manifest
cat > "$RELEASE_DIR/MANIFEST.md" << EOF
# Demo Gold v1 - Manifest

**Versão**: ${VERSION}
**Data**: ${TIMESTAMP}
**Status**: CONGELADO - Produto Fechado

## Conteúdo

Este pacote contém a versão congelada da demo do AppStaff.
Nenhuma feature nova entra sem duplicar esta demo.

## Arquivos Incluídos

- Teste E2E completo
- Modo demo automático
- Extrator de métricas
- Narrativa comercial
- Checklist de validação
- Script de venda ao vivo

## Uso

Esta versão está congelada para garantir que sempre haverá uma demo funcional,
mesmo se o resto do sistema estiver em desenvolvimento.

## Regra de Ouro

**NUNCA QUEBRAR A DEMO GOLD**

Qualquer mudança que possa afetar a demo deve ser feita em versão paralela.
EOF

# Criar tag git (se git estiver disponível)
if command -v git &> /dev/null; then
    echo "🏷️  Criando tag Git: ${VERSION}"
    git tag -a "${VERSION}" -m "Demo Gold v1 - Congelado para ativação comercial" || echo "⚠️  Tag já existe ou Git não disponível"
fi

# Criar checksum
echo "📋 Gerando checksum..."
find "$RELEASE_DIR" -type f -exec md5sum {} \; > "$RELEASE_DIR/checksums.md5" 2>/dev/null || \
find "$RELEASE_DIR" -type f -exec shasum -a 256 {} \; > "$RELEASE_DIR/checksums.sha256" 2>/dev/null || \
echo "⚠️  Não foi possível gerar checksum"

echo ""
echo "✅ Demo Gold v1 congelada em: $RELEASE_DIR"
echo "🔒 Esta versão está protegida contra mudanças"
echo ""

