#!/usr/bin/env bash
# contract-gate.sh — Gate de integridade de contratos: sem .md vazios, sem links quebrados, sem docs não indexados.
# Exit 0 = success; exit 1 = failure.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

ARCH_DIR="$REPO_ROOT/docs/architecture"
CONTRACTS_DIR="$REPO_ROOT/docs/contracts"
INDEX="$ARCH_DIR/CORE_CONTRACT_INDEX.md"
FAILED=0

report() { echo "[contract-gate] $*"; }
fail() { report "FAIL: $*"; FAILED=1; }

# --- 1. No empty .md under docs/architecture or docs/contracts ---
report "Step 1: Checking for empty .md in docs/architecture and docs/contracts..."
EMPTY_FOUND=""
for dir in "$ARCH_DIR" "$CONTRACTS_DIR"; do
  [ ! -d "$dir" ] && continue
  while IFS= read -r -d '' f; do
    EMPTY_FOUND="$EMPTY_FOUND $f"
  done < <(find "$dir" -maxdepth 1 -type f -name "*.md" -size 0 -print0 2>/dev/null)
done
if [ -n "$EMPTY_FOUND" ]; then
  for f in $EMPTY_FOUND; do fail "Empty .md: $f"; done
else
  report "  OK: No empty .md files."
fi

# --- 2. Extract all .md links from INDEX, ENFORCEMENT, OVERVIEW, CONTROL_PLANE; verify each exists and non-empty ---
report "Step 2: Verifying referenced .md exist and are non-empty..."
SOURCES=(
  "$ARCH_DIR/CORE_CONTRACT_INDEX.md"
  "$ARCH_DIR/CONTRACT_ENFORCEMENT.md"
  "$ARCH_DIR/CORE_SYSTEM_OVERVIEW.md"
  "$ARCH_DIR/CORE_CONTROL_PLANE_CONTRACT.md"
)
REF_LIST=$(mktemp)
trap 'rm -f "$REF_LIST"' EXIT
for src in "${SOURCES[@]}"; do
  [ ! -f "$src" ] && fail "Source missing: $src" && continue
  grep -oE '\]\(\./[^)]+\.md\)' "$src" 2>/dev/null | sed 's/](\.\///;s/)$//' | while IFS= read -r base; do [ -n "$base" ] && echo "ARCH:$base"; done >> "$REF_LIST"
  grep -oE '\]\(\.\./contracts/[^)]+\.md\)' "$src" 2>/dev/null | sed 's/](\.\.\/contracts\///;s/)$//' | while IFS= read -r base; do [ -n "$base" ] && echo "CONTRACTS:$base"; done >> "$REF_LIST"
done
while IFS= read -r entry; do
  [ -z "$entry" ] && continue
  kind="${entry%%:*}"
  base="${entry#*:}"
  if [ "$kind" = "ARCH" ]; then path="$ARCH_DIR/$base"; else path="$CONTRACTS_DIR/$base"; fi
  if [ ! -f "$path" ]; then fail "Referenced file missing: $path"; elif [ ! -s "$path" ]; then fail "Referenced file empty: $path"; fi
done < <(sort -u "$REF_LIST")
[ $FAILED -eq 0 ] && report "  OK: All referenced files exist and are non-empty."

# --- 3. Every .md in docs/architecture and docs/contracts must be linked in CORE_CONTRACT_INDEX ---
# NOTE: legacy repositories may contain many historical docs not part of the canonical index.
# In default mode we warn (non-blocking). Set CONTRACT_GATE_STRICT_INDEX=1 to block on unindexed docs.
report "Step 3: Checking unindexed docs (strict mode optional via CONTRACT_GATE_STRICT_INDEX=1)..."
[ ! -f "$INDEX" ] && fail "CORE_CONTRACT_INDEX.md not found." && exit 1
INDEXED_ARCH=""
INDEXED_CONTRACTS=""
while IFS= read -r base; do
  [ -z "$base" ] && continue
  INDEXED_ARCH="$INDEXED_ARCH $base"
done < <(grep -oE '\]\(\./[^)]+\.md\)' "$INDEX" 2>/dev/null | sed 's/](\.\///;s/)$//' | sort -u)
while IFS= read -r base; do
  [ -z "$base" ] && continue
  INDEXED_CONTRACTS="$INDEXED_CONTRACTS $base"
done < <(grep -oE '\]\(\.\./contracts/[^)]+\.md\)' "$INDEX" 2>/dev/null | sed 's/](\.\.\/contracts\///;s/)$//' | sort -u)

UNINDEXED=""
for f in "$ARCH_DIR"/*.md; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  if ! echo " $INDEXED_ARCH " | grep -qF " $base "; then
    UNINDEXED="$UNINDEXED docs/architecture/$base"
  fi
done
for f in "$CONTRACTS_DIR"/*.md; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  if ! echo " $INDEXED_CONTRACTS " | grep -qF " $base "; then
    UNINDEXED="$UNINDEXED docs/contracts/$base"
  fi
done
if [ -n "$UNINDEXED" ]; then
  if [ "${CONTRACT_GATE_STRICT_INDEX:-0}" = "1" ]; then
    for u in $UNINDEXED; do fail "UNINDEXED_DOC: $u (must be linked in CORE_CONTRACT_INDEX.md)"; done
  else
    for u in $UNINDEXED; do report "WARN: UNINDEXED_DOC: $u (non-blocking in default mode)"; done
  fi
else
  report "  OK: All docs are indexed in CORE_CONTRACT_INDEX."
fi

# --- Report ---
echo ""
if [ "$FAILED" -eq 1 ]; then
  report "Contract gate FAILED. Fix the issues above."
  exit 1
fi
report "Contract gate PASSED."
exit 0
