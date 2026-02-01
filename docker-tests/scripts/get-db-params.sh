#!/bin/sh
# Helper script to extract database connection parameters from DATABASE_URL
# Usage: eval $(./scripts/get-db-params.sh)
# Sets: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

DB_HOST=$(echo "$DB_URL" | sed -E 's|.*@([^:]+).*|\1|')
DB_PORT=$(echo "$DB_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_USER=$(echo "$DB_URL" | sed -E 's|postgresql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DB_URL" | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|')
DB_NAME=$(echo "$DB_URL" | sed -E 's|.*/([^?]+).*|\1|')

echo "export DB_HOST=\"$DB_HOST\""
echo "export DB_PORT=\"$DB_PORT\""
echo "export DB_USER=\"$DB_USER\""
echo "export DB_PASS=\"$DB_PASS\""
echo "export DB_NAME=\"$DB_NAME\""
echo "export DATABASE_URL=\"$DB_URL\""
