#!/bin/sh
# ==============================================================================
# Docker Entrypoint Script
# ==============================================================================
# Handles initialization, migration, and service startup
# ==============================================================================

set -e

echo "🚀 CHEFIAPP POS Core - Starting..."

# Parse DATABASE_URL if provided
if [ -n "$DATABASE_URL" ]; then
    echo "📊 Database configuration detected"
fi

# Wait for database if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "⏳ Waiting for database..."
    
    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:pass@host:port/database
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
    
    # Use default values if parsing failed
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_USER="${DB_USER:-test_user}"
    DB_NAME="${DB_NAME:-chefiapp_core_test}"
    
    # Wait for PostgreSQL
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
        echo "   Database is unavailable - sleeping"
        sleep 2
    done
    
    echo "✅ Database is ready!"
fi

# Run migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄 Running database migrations..."
    # Add migration command here when available
    # node dist/migrations/run.js
fi

# Execute the command passed to the container
echo "▶️  Starting service: $*"
exec "$@"
