#!/bin/bash
# Script para arquivar fixes históricos
# Adiciona header ARCHIVED e move para docs/archive/

ARCHIVE_DIR="archive"
HEADER="**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** $(date +%Y-%m-%d)

---"

# Lista de fixes históricos a arquivar
FIXES=(
  "FIX_AUTH_SESSION_MISSING.md"
  "FIX_DOCKER_CORE_SEM_AUTH.md"
  "FIX_ERROS_500_VITE.md"
  "FIX_INVENTORY_CONTEXT_404.md"
  "FIX_JWSError_DOCKER_CORE.md"
  "FIX_ORDERCONTEXT_ERROR_500.md"
  "FIX_POSTGREST_404.md"
  "FIX_POSTGREST_JWT_SECRET.md"
  "FIX_POSTGREST_NGINX_PROXY.md"
  "FIX_REALTIME_WEBSOCKET.md"
  "FIX_RESTAURANT_ID_MISSING.md"
  "FIX_SYSTEMNODE_IMPORT.md"
  "FIX_TPV_CONTEXTENGINE.md"
  "FIX_TPV_ORDERPROVIDER.md"
)

echo "Arquivando fixes históricos..."

for file in "${FIXES[@]}"; do
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
echo "Concluído! Fixes arquivados em $ARCHIVE_DIR/"
