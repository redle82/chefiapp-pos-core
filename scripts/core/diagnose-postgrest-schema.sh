#!/usr/bin/env bash
set -euo pipefail

TARGET_CONTAINER="${1:-}"

if [[ -z "${TARGET_CONTAINER}" ]]; then
  TARGET_CONTAINER="$(docker ps --format '{{.Names}} {{.Image}}' | grep 'postgrest/postgrest' | awk '{print $1}' | head -n1 || true)"
fi

if [[ -z "${TARGET_CONTAINER}" ]]; then
  echo "[error] Nenhum container PostgREST em execução foi encontrado."
  echo "        Passe o nome manualmente: ./scripts/core/diagnose-postgrest-schema.sh <postgrest-container>"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "${TARGET_CONTAINER}"; then
  echo "[error] Container '${TARGET_CONTAINER}' não está em execução."
  exit 1
fi

echo "== PostgREST container =="
echo "${TARGET_CONTAINER}"

ENV_DUMP="$(docker exec "${TARGET_CONTAINER}" sh -lc 'env' || true)"

DB_URI="$(printf '%s\n' "${ENV_DUMP}" | grep '^PGRST_DB_URI=' | sed 's/^PGRST_DB_URI=//' || true)"
DB_SCHEMA="$(printf '%s\n' "${ENV_DUMP}" | grep '^PGRST_DB_SCHEMA=' | sed 's/^PGRST_DB_SCHEMA=//' || true)"
DB_SCHEMAS="$(printf '%s\n' "${ENV_DUMP}" | grep '^PGRST_DB_SCHEMAS=' | sed 's/^PGRST_DB_SCHEMAS=//' || true)"
DB_ANON_ROLE="$(printf '%s\n' "${ENV_DUMP}" | grep '^PGRST_DB_ANON_ROLE=' | sed 's/^PGRST_DB_ANON_ROLE=//' || true)"

echo
echo "== PGRST env =="
echo "PGRST_DB_SCHEMA=${DB_SCHEMA:-<unset>}"
echo "PGRST_DB_SCHEMAS=${DB_SCHEMAS:-<unset>}"
echo "PGRST_DB_ANON_ROLE=${DB_ANON_ROLE:-<unset>}"

if [[ -z "${DB_URI}" ]]; then
  echo "[error] PGRST_DB_URI não encontrado no container ${TARGET_CONTAINER}."
  exit 1
fi

MASKED_URI="$(python3 - <<'PY' "${DB_URI}"
import sys
from urllib.parse import urlparse

uri = sys.argv[1]
p = urlparse(uri)
if p.password:
    netloc = f"{p.username}:***@{p.hostname or ''}"
    if p.port:
        netloc += f":{p.port}"
    masked = f"{p.scheme}://{netloc}{p.path or ''}"
else:
    masked = uri
print(masked)
PY
)"

echo "PGRST_DB_URI=${MASKED_URI}"

PARSED="$(python3 - <<'PY' "${DB_URI}"
import sys
from urllib.parse import urlparse, unquote

uri = sys.argv[1]
p = urlparse(uri)
user = unquote(p.username or "")
password = unquote(p.password or "")
host = p.hostname or ""
port = str(p.port or 5432)
db = (p.path or "/").lstrip("/")
print(user)
print(password)
print(host)
print(port)
print(db)
PY
)"

DB_USER="$(printf '%s\n' "${PARSED}" | sed -n '1p')"
DB_PASS="$(printf '%s\n' "${PARSED}" | sed -n '2p')"
DB_HOST="$(printf '%s\n' "${PARSED}" | sed -n '3p')"
DB_PORT="$(printf '%s\n' "${PARSED}" | sed -n '4p')"
DB_NAME="$(printf '%s\n' "${PARSED}" | sed -n '5p')"

if [[ -z "${DB_USER}" || -z "${DB_HOST}" || -z "${DB_NAME}" ]]; then
  echo "[error] Não foi possível parsear PGRST_DB_URI."
  exit 1
fi

PROJECT_LABEL="$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' "${TARGET_CONTAINER}" 2>/dev/null || true)"

PG_CONTAINER=""
if [[ -n "${PROJECT_LABEL}" ]]; then
  PG_CONTAINER="$(docker ps --filter "label=com.docker.compose.project=${PROJECT_LABEL}" --filter "label=com.docker.compose.service=postgres" --format '{{.Names}}' | head -n1 || true)"
fi

if [[ -z "${PG_CONTAINER}" ]]; then
  PG_CONTAINER="$(docker ps --format '{{.Names}}' | grep -E 'postgres$|postgres-' | head -n1 || true)"
fi

if [[ -z "${PG_CONTAINER}" ]]; then
  echo "[error] Não consegui identificar o container PostgreSQL para executar as queries."
  echo "        Usa estes comandos manualmente no ambiente remoto:"
  echo "        printenv | grep -E '^PGRST_DB_(URI|SCHEMA|SCHEMAS|ANON_ROLE)'"
  echo "        psql \"${MASKED_URI}\" -Atc \"select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';\""
  echo "        psql \"${MASKED_URI}\" -Atc \"show search_path;\""
  exit 2
fi

echo
echo "== PostgreSQL container =="
echo "${PG_CONTAINER}"

SQL_TABLES="select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';"
SQL_SEARCH_PATH="show search_path;"

echo
echo "== DB checks =="
TABLES_PUBLIC="$(docker exec -e PGPASSWORD="${DB_PASS}" "${PG_CONTAINER}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -Atc "${SQL_TABLES}" 2>/dev/null || true)"
SEARCH_PATH="$(docker exec -e PGPASSWORD="${DB_PASS}" "${PG_CONTAINER}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -Atc "${SQL_SEARCH_PATH}" 2>/dev/null || true)"

if [[ -z "${TABLES_PUBLIC}" && -z "${SEARCH_PATH}" ]]; then
  echo "[warn] Falha ao consultar via host '${DB_HOST}'. Tentando localhost dentro do container postgres..."
  TABLES_PUBLIC="$(docker exec -e PGPASSWORD="${DB_PASS}" "${PG_CONTAINER}" psql -h 127.0.0.1 -p 5432 -U "${DB_USER}" -d "${DB_NAME}" -Atc "${SQL_TABLES}" 2>/dev/null || true)"
  SEARCH_PATH="$(docker exec -e PGPASSWORD="${DB_PASS}" "${PG_CONTAINER}" psql -h 127.0.0.1 -p 5432 -U "${DB_USER}" -d "${DB_NAME}" -Atc "${SQL_SEARCH_PATH}" 2>/dev/null || true)"
fi

if [[ -z "${TABLES_PUBLIC}" && -z "${SEARCH_PATH}" ]]; then
  echo "[error] Não consegui executar psql automaticamente neste host."
  echo "        Usa os comandos manuais abaixo no ambiente onde o PostgREST 12.2.12 está a correr:"
  echo "        printenv | grep -E '^PGRST_DB_(URI|SCHEMA|SCHEMAS|ANON_ROLE)'"
  echo "        psql \"${MASKED_URI}\" -Atc \"select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';\""
  echo "        psql \"${MASKED_URI}\" -Atc \"show search_path;\""
  exit 3
fi

echo "tables_public=${TABLES_PUBLIC:-<unavailable>}"
echo "search_path=${SEARCH_PATH:-<unavailable>}"

echo
echo "== Quick interpretation =="
if [[ "${TABLES_PUBLIC:-0}" =~ ^[0-9]+$ ]] && [[ "${TABLES_PUBLIC}" -eq 0 ]]; then
  echo "[diagnosis] DB sem tabelas públicas visíveis para esta conexão."
  echo "            Isto combina com log 'Schema cache loaded 0 Relations'."
else
  echo "[diagnosis] Existem tabelas públicas visíveis; investigar instância/DB diferente para o log reportado."
fi
