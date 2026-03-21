#!/usr/bin/env bash
# Executa a Vercel CLI com VERCEL_TOKEN carregado de .env.vercel (se existir).
# Usar para deploy, env add, logs, etc. — dá controlo total ao agente.
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$ROOT/.env.vercel" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env.vercel"
  set +a
fi
exec vercel "$@"
