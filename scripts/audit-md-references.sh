#!/usr/bin/env bash
# audit-md-references.sh — Referências .md em docs vs ficheiros existentes
#
# Uso: ./scripts/audit-md-references.sh
#
# Lista ficheiros .md referenciados em docs/ que não existem em nenhuma
# subpasta de docs/ (architecture/, contracts/, ops/, testing/, etc.).

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "Checking missing .md references (searching under docs/)..."
echo ""

# Lista de basenames .md referenciados em docs/
grep -R "\.md" docs --include="*.md" 2>/dev/null | \
  grep -oE '[A-Za-z0-9_./-]+\.md' | \
  sed 's|^\./||;s|.*/||' | \
  sort -u | while read -r file; do
  [ -z "$file" ] && continue
  # Existe em algum sítio sob docs/?
  if ! find docs -name "$file" -type f 2>/dev/null | grep -q .; then
    echo "❌ Missing: $file"
  fi
done

echo ""
echo "Rule: Do not reference files that do not exist."
echo "If a new document is required, explicitly create it with full content."
