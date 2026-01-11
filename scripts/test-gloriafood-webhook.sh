#!/bin/bash
# Test GloriaFood webhook locally or against edge function
#
# Usage:
#   ./test-gloriafood-webhook.sh local     # Test local endpoint
#   ./test-gloriafood-webhook.sh staging   # Test Supabase edge function
#   ./test-gloriafood-webhook.sh <url>     # Test custom URL

set -e

# Default URL (local dev)
URL="${1:-http://localhost:54321/functions/v1/webhook-gloriafood}"

# Resolve presets
case "$URL" in
  local)
    URL="http://localhost:54321/functions/v1/webhook-gloriafood"
    ;;
  staging)
    URL="https://YOUR_PROJECT.supabase.co/functions/v1/webhook-gloriafood"
    ;;
esac

echo "🧪 Testing GloriaFood webhook at: $URL"
echo ""

# Sample GloriaFood webhook payload
PAYLOAD='{
  "event": "order.placed",
  "timestamp": "2026-01-04T15:30:00Z",
  "data": {
    "order": {
      "id": "gf-order-'$(date +%s)'",
      "reference": "GF-'$(( RANDOM % 9000 + 1000 ))'",
      "restaurant_id": "sofia-gastrobar-001",
      "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "status": "new",
      "customer": {
        "id": "cust-001",
        "first_name": "João",
        "last_name": "Silva",
        "email": "joao@email.com",
        "phone": "+5511999001234",
        "address": {
          "street": "Rua Augusta 1500",
          "city": "São Paulo",
          "instructions": "Portão azul, interfone 12"
        }
      },
      "items": [
        {
          "id": "burger-classic",
          "name": "Classic Burger",
          "quantity": 2,
          "price": 1890,
          "instructions": "Sem cebola"
        },
        {
          "id": "fries-large",
          "name": "Batata Grande",
          "quantity": 1,
          "price": 1200
        },
        {
          "id": "coke-zero",
          "name": "Coca Zero 350ml",
          "quantity": 2,
          "price": 600
        }
      ],
      "payment": {
        "method": "online",
        "status": "paid",
        "total": 6180,
        "currency": "BRL"
      },
      "delivery": {
        "type": "delivery",
        "estimated_time": 45
      },
      "instructions": "Deixar na portaria"
    }
  }
}'

echo "📦 Payload:"
echo "$PAYLOAD" | jq .
echo ""

echo "📤 Sending webhook..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-GloriaFood-Signature: test-signature" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Response (HTTP $HTTP_CODE):"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Webhook processed successfully!"
else
  echo "❌ Webhook failed with HTTP $HTTP_CODE"
  exit 1
fi
