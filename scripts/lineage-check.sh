#!/usr/bin/env bash
# H2 Onda 3 — Verificação de lineage: lista escritores de tabelas críticas a partir das migrações.
# Uso: ./scripts/lineage-check.sh
# Objetivo: comparar com docs/architecture/DATA_LINEAGE.md §3 (tabelas → fontes → consumidores).

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS="${REPO_ROOT}/supabase/migrations"

echo "=== Lineage check: escritores de tabelas críticas (supabase/migrations) ==="
echo "Compare com docs/architecture/DATA_LINEAGE.md §3."
echo ""

for table in gm_orders gm_payments gm_audit_logs turn_sessions gm_cash_registers; do
  echo "--- Escritores de: $table ---"
  # Funções que contêm INSERT/UPDATE/DELETE na tabela (nome da função via CREATE OR REPLACE FUNCTION ou trigger)
  rg -l "INSERT INTO public\.$table|UPDATE public\.$table|DELETE FROM public\.$table" "$MIGRATIONS" 2>/dev/null || true
  rg -l "INTO public\.$table" "$MIGRATIONS" 2>/dev/null || true
  echo ""
done

echo "--- Triggers que escrevem em gm_audit_logs ---"
rg -l "INSERT INTO public.gm_audit_logs" "$MIGRATIONS" 2>/dev/null || true
echo ""
echo "Concluído. Verifique se cada ficheiro listado está referenciado em DATA_LINEAGE.md §3."
