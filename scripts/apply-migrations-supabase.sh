#!/usr/bin/env bash
# Aplica todas as migrações do Core ao Supabase (ou qualquer Postgres) por ordem cronológica.
# Uso: export DATABASE_URL="postgresql://..."; pnpm run supabase:finalize
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="$ROOT/docker-core/schema/migrations"

if [ -z "${DATABASE_URL}" ]; then
  echo "Erro: define DATABASE_URL."
  echo "  Supabase → Project Settings → Database → Connection string (URI) → substituir [YOUR-PASSWORD]"
  echo "  export DATABASE_URL='postgresql://postgres:PASSWORD@db.XXX.supabase.co:5432/postgres'"
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Erro: diretório $MIGRATIONS_DIR não encontrado."
  exit 1
fi

# psql: PATH ou Homebrew libpq
PSQL="psql"
if ! command -v psql >/dev/null 2>&1; then
  if [ -x "$(brew --prefix libpq 2>/dev/null)/bin/psql" ]; then
    PSQL="$(brew --prefix libpq)/bin/psql"
  else
    echo "Erro: psql não encontrado. Instala: brew install libpq (macOS) ou postgresql-client (Linux)."
    exit 1
  fi
fi

echo "=== Finalizar Supabase — aplicar migrações ==="
count=0
for f in $(find "$MIGRATIONS_DIR" -maxdepth 1 -name "*.sql" -type f | sort); do
  echo "  [$(basename "$f")]"
  $PSQL "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f" || { echo "Falha em: $f"; exit 1; }
  count=$((count + 1))
done

echo "OK: $count migrações aplicadas. Supabase finalizado."
