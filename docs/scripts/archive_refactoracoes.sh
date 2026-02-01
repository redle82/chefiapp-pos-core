#!/bin/bash
# Script para arquivar refatorações por fase
# Adiciona header ARCHIVED e move para docs/archive/

ARCHIVE_DIR="archive"
HEADER="**Status:** ARCHIVED
**Reason:** Refatoração concluída; estado atual documentado em STATE_PURE_DOCKER_APP_LAYER.md
**Arquivado em:** $(date +%Y-%m-%d)

---"

# Lista de refatorações a arquivar
REFACTORINGS=(
  "REFATORACAO_FASE_1_2_VALIDADA.md"
  "REFATORACAO_FASE_3_4_MAPEAMENTO.md"
  "REFATORACAO_FASE_3_5_MAPEAMENTO.md"
  "REFATORACAO_FASE_3_CONCLUSAO.md"
  "REFATORACAO_FASE_3_PLANO.md"
  "REFATORACAO_FASE_3_STATUS.md"
  "REFATORACAO_PLANO.md"
  "REFATORACAO_PROGRESSO.md"
  "REFATORACAO_RESUMO.md"
)

echo "Arquivando refatorações por fase..."

for file in "${REFACTORINGS[@]}"; do
  if [ -f "$file" ]; then
    # Adicionar header no topo do arquivo
    {
      echo "$HEADER"
      echo ""
      cat "$file"
    } > "$file.tmp"
    mv "$file.tmp" "$file"

    # Mover para archive
    mv "$file" "$ARCHIVE_DIR/"
    echo "✅ Arquivado: $file"
  else
    echo "⚠️  Não encontrado: $file"
  fi
done

echo ""
echo "Concluído! Refatorações arquivadas em $ARCHIVE_DIR/"
