#!/bin/bash

# Script para iniciar o Central de Comando do ChefIApp

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Sobe três níveis: central-comando -> teste-massivo-nivel-5 -> scripts -> raiz do repo
cd "$SCRIPT_DIR/../../.."

echo "🎯 Iniciando Central de Comando do ChefIApp..."
echo ""

# Matar processos antigos
pkill -f "central-comando" || true
pkill -f "monitor-web" || true
sleep 2

# Iniciar
npx tsx scripts/teste-massivo-nivel-5/central-comando/index.ts
