#!/usr/bin/env bash
# auditor-soberania.sh — Braço executável do AUDITOR_MUDANCAS_SOBERANIA.md.
# Responde: "Esta mudança viola algum eixo soberano v1?"
# Exit 0 = pass; exit 1 = fail. Em dúvida → falhar.
# Ver: docs/architecture/AUDITOR_MUDANCAS_SOBERANIA.md
#
# Nota: O check 2 (escrita/acesso ao Core) é estrito. O repo pode ter dívida conhecida
# (ficheiros em core/ fora do boundary); use para evitar novas violações ou refatorar
# progressivamente. Em CI, pode correr só sobre ficheiros alterados (futuro).

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FAILED=0
report() { echo "[auditor-soberania] $*"; }
ok() { echo "[OK] $*"; }
fail() { echo "[FAIL] $*"; FAILED=1; }

# ——— 1. Invocar o que já existe (sovereignty-gate) ———
report "1/3 Sovereignty gate (pedidos/Core)..."
if ./scripts/sovereignty-gate.sh; then
  ok "Sovereignty gate passed"
else
  fail "Sovereignty gate failed (ver scripts/sovereignty-gate.sh)"
fi

# ——— 2. Check: Escrita direta no Core (UI) ———
# Regra: UI não escreve em gm_restaurants, orders, payments sem boundary.
# Exceções: RuntimeWriter, DbWriteGate, BootstrapPage (e restante boundary).
report "2/3 Escrita direta no Core (UI)..."
SRC="$REPO_ROOT/merchant-portal/src"
PATTERN_CORE="\.from\s*\(\s*['\"]gm_restaurants['\"]\)|\.from\s*\(\s*['\"]orders['\"]\)|\.from\s*\(\s*['\"]payments['\"]\)"
FOUND_CORE=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  # Ignorar boundary e exceção documentada (AUDITOR_MUDANCAS_SOBERANIA.md)
  case "$f" in
    *RuntimeWriter*|*RuntimeReader*|*DbWriteGate*|*BootstrapPage*|*core-boundary*) continue ;;
  esac
  FOUND_CORE="$FOUND_CORE$f"$'\n'
done < <(grep -rEl "$PATTERN_CORE" "$SRC" --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -n "$FOUND_CORE" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    fail "Escrita/acesso direto ao Core fora de boundary/BootstrapPage: $f"
  done <<< "$FOUND_CORE"
else
  ok "Nenhum acesso direto ao Core fora de boundary/BootstrapPage"
fi

# ——— 3. Check: Gates não escrevem ———
# Regra: Gate bloqueia ou redireciona; nunca insert/update/upsert.
# Exceção: DbWriteGate é o boundary de escrita (não é gate de rota).
report "3/3 Gates não escrevem..."
GATE_VIOLATION=""
while IFS= read -r f; do
  [ ! -f "$f" ] && continue
  # DbWriteGate é o boundary permitido a escrever
  case "$f" in
    *DbWriteGate*) continue ;;
  esac
  if grep -qE '\.(insert|update|upsert)\s*\(' "$f" 2>/dev/null; then
    GATE_VIOLATION="$GATE_VIOLATION$f"$'\n'
  fi
done < <(find "$SRC" -name "*Gate*.ts" -o -name "*Gate*.tsx" 2>/dev/null || true)

if [ -n "$GATE_VIOLATION" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    fail "Gate faz escrita (insert/update/upsert): $f"
  done <<< "$GATE_VIOLATION"
else
  ok "Gates não fazem escrita"
fi

# ——— Resultado ———
if [ "$FAILED" -eq 1 ]; then
  report "Auditor FAILED. Rever docs/architecture/AUDITOR_MUDANCAS_SOBERANIA.md"
  exit 1
fi
report "Auditor PASSED (todos os checks)."
exit 0
