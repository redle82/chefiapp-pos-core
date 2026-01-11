#!/bin/sh
# ==============================================================================
# Wait for PostgreSQL to be ready
# ==============================================================================
# Usage: ./wait-for-db.sh [host] [port] [user] [database]
# ==============================================================================

set -e

HOST="${1:-localhost}"
PORT="${2:-5432}"
USER="${3:-test_user}"
DATABASE="${4:-chefiapp_core_test}"

echo "⏳ Waiting for PostgreSQL at ${HOST}:${PORT}..."

until pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" > /dev/null 2>&1; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"
