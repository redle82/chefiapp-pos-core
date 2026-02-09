#!/bin/bash
# CHEFIAPP TUNNEL LAUNCHER
# Usage: ./start_tunnel.sh

echo "🚇 Starting ChefIApp Secure Tunnel..."
echo "Target: http://localhost:4320"

# Check if localtunnel is installed
if ! command -v npx &> /dev/null
then
    echo "❌ npx could not be found. Please install Node.js."
    exit 1
fi

echo "⚠️  Keep this terminal open!"
echo "📡 Tunnel URL will appear below:"
echo "--------------------------------"

# Run localtunnel
npx localtunnel --port 4320 --subdomain chefiapp-pilot-01
