#!/bin/sh
# ==============================================================================
# Generic Health Check Script
# ==============================================================================
# Usage: ./health-check.sh <port> [path]
# Example: ./health-check.sh 3000 /health
# ==============================================================================

set -e

PORT="${1:-3000}"
PATH="${2:-/health}"
URL="http://localhost:${PORT}${PATH}"

# Attempt to fetch the health endpoint
if command -v wget >/dev/null 2>&1; then
    wget --no-verbose --tries=1 --spider "$URL"
elif command -v curl >/dev/null 2>&1; then
    curl -f -s -o /dev/null "$URL"
else
    # Fallback to nc (netcat) - just check if port is open
    nc -z localhost "$PORT"
fi

exit $?
