#!/usr/bin/env bash
# audit-contracts-referenced.sh — Auditoria: documentos referenciados vs existentes (e vazios)
#
# Uso: ./scripts/audit-contracts-referenced.sh [dir]
#   dir = onde procurar referências (default: docs + raiz do repo)
#
# Saída:
#   1. Ficheiros .md vazios (em docs/ e raiz, excl. node_modules/.git)
#   2. Referências a .md em docs/ e em ficheiros de índice
#   3. Lista "referenciado mas não existe" e "existe mas vazio"

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

SEARCH_DIR="${1:-.}"
# Excluir pastas que não interessam para contratos
EXCLUDE_DIRS='(node_modules|\.git|_graveyard|\.venv|mobile-app|merchant-portal/ios|merchant-portal/android)'

echo "=== 1. Ficheiros .md vazios (docs + raiz) ==="
find docs "$REPO_ROOT" -maxdepth 1 -type f -name "*.md" -size 0 2>/dev/null | while read -r f; do
  echo "  VAZIO: $f"
done
EMPTY_COUNT=$(find docs "$REPO_ROOT" -maxdepth 1 -type f -name "*.md" -size 0 2>/dev/null | wc -l | tr -d ' ')
if [ "$EMPTY_COUNT" -eq 0 ]; then
  echo "  (nenhum)"
fi

echo ""
echo "=== 2. Documentos canónicos referenciados (nomes conhecidos) ==="
# Lista de documentos que costumam ser referenciados; verificar existência e tamanho
CANONICAL="BOOTSTRAP_KERNEL.md BOOTSTRAP_CONTRACT.md CORE_CONTROL_PLANE_CONTRACT.md CORE_SYSTEM_OVERVIEW.md CORE_CONTRACT_INDEX.md SYSTEM_TREE_VS_EXECUTION.md CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md CORE_RECONCILIATION_CONTRACT.md CORE_IDENTITY_AND_TRUST_CONTRACT.md CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md CONTRACT_AUDIT_REFERENCED.md"
for base in $CANONICAL; do
  if [ -f "docs/architecture/$base" ]; then
    if [ ! -s "docs/architecture/$base" ]; then
      echo "  VAZIO: docs/architecture/$base"
    else
      echo "  OK: docs/architecture/$base"
    fi
  elif [ -f "$REPO_ROOT/$base" ]; then
    if [ ! -s "$REPO_ROOT/$base" ]; then
      echo "  VAZIO (raiz): $REPO_ROOT/$base"
    else
      echo "  OK (raiz): $REPO_ROOT/$base"
    fi
  else
    echo "  INEXIST: $base"
  fi
done

echo ""
echo "=== 3. Contratos listados no CORE_CONTRACT_INDEX vs disco ==="
if [ -f "docs/architecture/CORE_CONTRACT_INDEX.md" ]; then
  grep -oE '\]\(\./[A-Za-z0-9_.-]+\.md\)' docs/architecture/CORE_CONTRACT_INDEX.md 2>/dev/null | sed 's/](\.\///;s/)$//' | sort -u | while read -r idx; do
    [ -z "$idx" ] && continue
    if [ -f "docs/architecture/$idx" ]; then
      size=$(wc -c < "docs/architecture/$idx")
      if [ "$size" -eq 0 ]; then
        echo "  NO_INDICE+VAZIO: docs/architecture/$idx"
      fi
    else
      echo "  NO_INDICE+INEXIST: docs/architecture/$idx"
    fi
  done
  echo "  (só listados os com problema; demais = existem com conteúdo)"
fi

echo ""
echo "=== 4. Resumo ==="
echo "  Corra 'find . -type f -name \"*.md\" -size 0' na raiz para todos os vazios (incl. subpastas)."
echo "  Use este script após alterações em contratos para garantir: referenciado = existe e não vazio."
