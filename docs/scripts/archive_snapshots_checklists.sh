#!/bin/bash
# Script para arquivar snapshots e checklists históricos
# Adiciona header ARCHIVED e move para docs/archive/

ARCHIVE_DIR="archive"
HEADER="**Status:** ARCHIVED
**Reason:** Documento histórico; estado atual documentado em STATE_PURE_DOCKER_APP_LAYER.md e ESTADO_ATUAL_2026_01_28.md
**Arquivado em:** $(date +%Y-%m-%d)

---"

# Lista de snapshots e checklists históricos a arquivar
DOCS=(
  "SNAPSHOT_PRE_REFACTOR.md"
  "CHECKLIST_DEBUG_ONBOARDING.md"
  "CHECKLIST_FINAL_IMPLEMENTACAO.md"
  "CHECKLIST_PROXIMOS_PASSOS.md"
)

echo "Arquivando snapshots e checklists históricos..."

for file in "${DOCS[@]}"; do
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
echo "Concluído! Snapshots e checklists arquivados em $ARCHIVE_DIR/"
echo ""
echo "Nota: CHECKLIST_VENDA_V1.md foi mantido para avaliação manual."
