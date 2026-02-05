#!/usr/bin/env bash
# Falha se encontrar imports Supabase em merchant-portal, core-engine ou mobile-app.
# Ver docs/architecture/DOCKER_CORE_ONLY.md e docs/qa/SUBSTITUICAO_SUPABASE_POR_PROJETO.md
# Exclui: merchant-portal/src/core/scripts (Deno legados); core-engine/infra/supabaseClient.ts (stub que lança).

set -e
FAIL=0

# Padrão que indica import do pacote (evita falsos positivos em comentários)
SUPABASE_IMPORT_PATTERN="['\"]@supabase/supabase-js['\"]"

run_rg() {
  local dir="$1"
  local pattern="$2"
  local exclude_glob="${3:-}"
  if [ -n "$exclude_glob" ]; then
    rg -n "$pattern" "$dir" --glob "!$exclude_glob" 2>/dev/null || true
  else
    rg -n "$pattern" "$dir" 2>/dev/null || true
  fi
}

check_dir() {
  local dir="$1"
  local exclude_glob="${2:-}"
  local label="${3:-$dir}"
  echo "[check-no-supabase] Scanning $label..."
  if run_rg "$dir" "$SUPABASE_IMPORT_PATTERN" "$exclude_glob" | grep -q .; then
    echo "[check-no-supabase] FAIL: Found @supabase/supabase-js import in $label"
    FAIL=1
  fi
  # getSupabaseClient() não pode ser usado exceto no stub que o define
  if [ "$dir" = "core-engine" ]; then
    if run_rg "$dir" "getSupabaseClient\(" "**/supabaseClient.ts" | grep -q .; then
      echo "[check-no-supabase] FAIL: Found getSupabaseClient() usage in core-engine (use getTableClient/coreClient)"
      FAIL=1
    fi
  else
    if run_rg "$dir" "getSupabaseClient\(" "$exclude_glob" | grep -q .; then
      echo "[check-no-supabase] FAIL: Found getSupabaseClient() in $label"
      FAIL=1
    fi
  fi
  if run_rg "$dir" "createClient\s*\(\s*['\"]@supabase|createClient.*supabase" "$exclude_glob" | grep -q .; then
    echo "[check-no-supabase] FAIL: Found createClient(Supabase) in $label"
    FAIL=1
  fi
}

# merchant-portal (excluir scripts Deno legados)
[ -d "merchant-portal/src" ] && check_dir "merchant-portal/src" "**/core/scripts/**" "merchant-portal/src"
# core-engine (excluir stub supabaseClient.ts que define getSupabaseClient)
[ -d "core-engine" ] && check_dir "core-engine" "**/infra/supabaseClient.ts" "core-engine"
# mobile-app
[ -d "mobile-app" ] && check_dir "mobile-app" "" "mobile-app"

if [ $FAIL -eq 0 ]; then
  echo "[check-no-supabase] PASS: No Supabase runtime in merchant-portal, core-engine, mobile-app"
  exit 0
fi
exit 1
