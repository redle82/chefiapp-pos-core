#!/bin/bash

# ==============================================================================
# CHEFIAPP CLI - The Sovereign Orchestrator
# ==============================================================================
# Usage: ./chef <command>
# ==============================================================================

COMMAND=$1
SUBCOMMAND=$2

case "$COMMAND" in
  "portal")
    case "$SUBCOMMAND" in
      "up")
        echo "🚀 Starting ChefIApp Cockpit (Portal + Core)..."

        # 1. Start Docker Core
        echo "📦 Starting Docker Core services..."
        docker compose -f docker-core/docker-compose.core.yml up -d

        # 2. Check if Docker is healthy
        if [ $? -ne 0 ]; then
          echo "❌ Failed to start Docker Core. Is Docker Desktop running?"
          exit 1
        fi

        # 3. Start Merchant Portal
        echo "🌐 Starting Merchant Portal..."
        cd merchant-portal && npm run dev
        ;;
      *)
        echo "Usage: ./chef portal [up]"
        exit 1
        ;;
    esac
    ;;
  "audit")
    echo "🔍 Running Full System Audit..."
    npm run audit:release
    ;;
  *)
    echo "ChefIApp Sovereign CLI"
    echo "Usage: ./chef [portal|audit]"
    echo ""
    echo "Commands:"
    echo "  portal up    Starts Docker Core and Merchant Portal"
    echo "  audit        Runs full compliance and test suite"
    exit 1
    ;;
esac
