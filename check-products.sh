#!/bin/bash
# Quick check for products in database

echo "=== Checking Supabase Health ==="
curl -s http://localhost:3001/rest/v1/ -I | head -1

echo ""
echo "=== Products Count (via REST API) ==="
curl -s "http://localhost:3001/rest/v1/gm_products?select=count" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo ""
echo "=== First 3 Products ==="
curl -s "http://localhost:3001/rest/v1/gm_products?select=id,name,price_cents,available&limit=3" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "Done."
