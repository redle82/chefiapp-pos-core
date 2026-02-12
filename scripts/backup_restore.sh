#!/bin/bash
# Phase B: Backup and restore script for Postgres (docker-core)
# Usage: ./backup_restore.sh backup|restore <file> [database]
set -e

DB_CONTAINER=chefiapp-core-postgres
DB_NAME=${3:-postgres}

if [ "$1" = "backup" ]; then
  echo "[Backup] Dumping $DB_NAME to $2..."
  docker exec $DB_CONTAINER pg_dump -U postgres $DB_NAME > "$2"
  echo "[Backup] Done."
elif [ "$1" = "restore" ]; then
  echo "[Restore] Restoring $2 to $DB_NAME..."
  cat "$2" | docker exec -i $DB_CONTAINER psql -U postgres $DB_NAME
  echo "[Restore] Done."
else
  echo "Usage: $0 backup|restore <file> [database]"
  exit 1
fi
