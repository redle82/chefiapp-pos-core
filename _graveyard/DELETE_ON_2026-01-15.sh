#!/bin/bash

# 🔥 DESTRUCTION PROTOCOL - Graveyard Purge
# 
# Data de Execução: 2026-01-15 (7 dias após criação)
# 
# Este script deleta completamente a pasta _graveyard/
# após período de quarentena de 7 dias.
#
# ⚠️ AVISO: Executar apenas após confirmar que:
# - Nenhum arquivo aqui é necessário
# - Build funciona corretamente
# - Nenhuma referência existe

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 DESTRUCTION PROTOCOL - Graveyard Purge"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Data: $(date)"
echo "Pasta: _graveyard/"
echo ""
read -p "Confirma deleção completa? (digite 'DELETE' para confirmar): " confirmation

if [ "$confirmation" != "DELETE" ]; then
    echo "❌ Deleção cancelada."
    exit 1
fi

echo ""
echo "🗑️  Deletando _graveyard/..."
rm -rf _graveyard/
echo "✅ _graveyard/ deletada completamente."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DESTRUCTION PROTOCOL EXECUTED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
