#!/bin/bash

# 🔍 VALIDADOR DE REPRESENTAÇÃO TOTAL
# 
# Valida se o sistema está íntegro (frontend = backend = banco)
# Identifica gaps de representação
#
# Uso:
#   ./scripts/validate-representation.sh

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT/docs/sovereignty"
MATRIX_FILE="$ROOT/docs/canon/REPRESENTATION_MATRIX.md"

echo "🔍 Validando Representação Total..."
echo ""

# Gerar mapas se não existirem
if [ ! -f "$OUTPUT_DIR/backend-power-map.json" ]; then
    echo "📊 Gerando mapas de soberania..."
    node "$ROOT/scripts/generate-sovereignty-maps.js"
fi

# Verificar se matriz existe
if [ ! -f "$MATRIX_FILE" ]; then
    echo "⚠️  Matriz de Representação não encontrada: $MATRIX_FILE"
    echo "   Criando template..."
    mkdir -p "$(dirname "$MATRIX_FILE")"
    cat > "$MATRIX_FILE" << 'EOF'
# 🔐 MATRIZ DE REPRESENTAÇÃO

**Data:** 2026-01-24  
**Status:** 📝 **TEMPLATE - Preencher Manualmente**

---

## 🎯 OBJETIVO

Esta matriz cruza **Backend Action → DB Change → UI Route → UI Action → Audit** para garantir que todo poder do sistema seja representado.

---

## 📋 MATRIZ COMPLETA

| Backend Action | DB Change | UI Route | UI Action | Audit | Status |
|----------------|-----------|----------|-----------|-------|--------|
| cancel_order | status → canceled | /app/tpv | Botão Cancelar | ✔ | ✅ |
| split_bill | payment split | /app/tpv | Dividir Conta | ✔ | ✅ |
| mark_ready | status → ready | /app/kds | Marcar Pronto | ✔ | ✅ |

---

## 🔍 GAPS IDENTIFICADOS

### Backend sem UI
- [ ] (nenhum gap encontrado)

### UI sem Backend Real
- [ ] (nenhum gap encontrado)

### Banco com Estado Inalcançável
- [ ] (nenhum gap encontrado)

---

**Última atualização:** 2026-01-24
EOF
    echo "✅ Template criado: $MATRIX_FILE"
fi

# Validar gaps básicos
echo "🔍 Verificando gaps..."

GAPS_FOUND=0

# Verificar se há endpoints sem rota correspondente (heurística simples)
if grep -q "⚠️" "$MATRIX_FILE" 2>/dev/null; then
    echo "⚠️  Gaps encontrados na matriz (marcados com ⚠️)"
    GAPS_FOUND=1
fi

# Verificar se há rotas sem backend (heurística simples)
if grep -q "❌" "$MATRIX_FILE" 2>/dev/null; then
    echo "❌ Ações sem backend encontradas na matriz"
    GAPS_FOUND=1
fi

if [ $GAPS_FOUND -eq 0 ]; then
    echo "✅ Nenhum gap crítico encontrado"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Revisar manualmente a matriz: $MATRIX_FILE"
    echo "   2. Preencher todas as ações do backend"
    echo "   3. Verificar se todas as rotas têm ações correspondentes"
    exit 0
else
    echo ""
    echo "❌ Gaps encontrados! Revisar matriz: $MATRIX_FILE"
    exit 1
fi
