#!/bin/bash
# demo-voice.sh — Demo da Voice Operations Layer (VOL)
# Objetivo: Ligar flag, registrar device fake, disparar rotina, esperar ack, mostrar rastro completo

set -e

echo "🎙️  Voice Operations Layer — Demo"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
if ! curl -s http://localhost:4320/health > /dev/null 2>&1; then
  echo "${YELLOW}⚠️  Server não está rodando. Inicie com: npm run dev${NC}"
  exit 1
fi

# Get restaurant ID (from env or first restaurant)
RESTAURANT_ID=${RESTAURANT_ID:-$(psql $DATABASE_URL -t -c "SELECT id FROM gm_restaurants LIMIT 1" | xargs)}

if [ -z "$RESTAURANT_ID" ]; then
  echo "${YELLOW}⚠️  Nenhum restaurante encontrado. Execute o onboarding primeiro.${NC}"
  exit 1
fi

echo "${BLUE}📍 Restaurant ID: ${RESTAURANT_ID}${NC}"
echo ""

# Step 1: Enable feature flag
echo "${GREEN}1️⃣  Ativando feature flag...${NC}"
curl -s -X POST "http://localhost:4320/api/govern-manage/feature-flags/voice_operations_enabled" \
  -H "Content-Type: application/json" \
  -d "{\"restaurant_id\": \"${RESTAURANT_ID}\", \"enabled\": true}" > /dev/null
echo "✅ Feature flag ativada"
echo ""

# Step 2: Register fake device
echo "${GREEN}2️⃣  Registrando device fake 'Kitchen Alexa'...${NC}"
DEVICE_RESPONSE=$(curl -s -X POST "http://localhost:4320/api/voice/devices/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"restaurant_id\": \"${RESTAURANT_ID}\",
    \"device_name\": \"Kitchen Alexa\",
    \"device_type\": \"alexa\",
    \"device_id\": \"demo_alexa_kitchen_001\",
    \"location\": \"kitchen\",
    \"volume\": 70,
    \"language\": \"pt-BR\"
  }")
DEVICE_ID=$(echo $DEVICE_RESPONSE | jq -r '.device.id')
echo "✅ Device registrado: ${DEVICE_ID}"
echo ""

# Step 3: Create opening routine (if not exists)
echo "${GREEN}3️⃣  Criando rotina de abertura...${NC}"
ROUTINE_RESPONSE=$(curl -s -X POST "http://localhost:4320/api/voice/routines" \
  -H "Content-Type: application/json" \
  -d "{
    \"restaurant_id\": \"${RESTAURANT_ID}\",
    \"device_id\": \"${DEVICE_ID}\",
    \"routine_name\": \"Abertura de Turno\",
    \"routine_type\": \"shift_opening\",
    \"schedule_type\": \"time\",
    \"schedule_config\": {\"time\": \"08:00\"},
    \"announcement_text\": \"Atenção equipe. Hora de iniciar o turno. Verifique checklist de abertura.\",
    \"actions\": [
      {
        \"type\": \"create_task\",
        \"target\": \"appstaff\",
        \"config\": {
          \"task_type\": \"checklist\",
          \"priority\": \"P1\",
          \"title\": \"Checklist de abertura\"
        }
      }
    ],
    \"enabled\": true
  }" 2>/dev/null || echo "{}")
echo "✅ Rotina criada/verificada"
echo ""

# Step 4: Trigger routine manually (create voice event)
echo "${GREEN}4️⃣  Disparando rotina de abertura...${NC}"
VOICE_EVENT_RESPONSE=$(curl -s -X POST "http://localhost:4320/api/voice/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"restaurant_id\": \"${RESTAURANT_ID}\",
    \"device_id\": \"${DEVICE_ID}\",
    \"event_type\": \"shift_opening_time\",
    \"direction\": \"system_to_voice\",
    \"response_text\": \"Atenção equipe. Hora de iniciar o turno. Verifique checklist de abertura.\",
    \"context\": {
      \"routine_name\": \"Abertura de Turno\",
      \"device_name\": \"Kitchen Alexa\"
    }
  }")
VOICE_EVENT_ID=$(echo $VOICE_EVENT_RESPONSE | jq -r '.event.id')
echo "✅ Evento de voz criado: ${VOICE_EVENT_ID}"
echo ""

# Step 5: Wait a bit
echo "${GREEN}5️⃣  Aguardando processamento...${NC}"
sleep 2
echo "✅ Processamento concluído"
echo ""

# Step 6: Acknowledge
echo "${GREEN}6️⃣  Confirmando lembrete (ack)...${NC}"
curl -s -X POST "http://localhost:4320/api/voice/events/${VOICE_EVENT_ID}/ack" \
  -H "Content-Type: application/json" \
  -d "{
    \"acknowledgment_type\": \"voice\",
    \"acknowledgment_text\": \"Ok, confirmado\"
  }" > /dev/null
echo "✅ Lembrete confirmado"
echo ""

# Step 7: Check status
echo "${GREEN}7️⃣  Verificando status...${NC}"
STATUS_RESPONSE=$(curl -s "http://localhost:4320/api/voice/status?restaurant_id=${RESTAURANT_ID}")
echo "$STATUS_RESPONSE" | jq '.'
echo ""

# Step 8: Check Decision History
echo "${GREEN}8️⃣  Verificando Decision History...${NC}"
DECISIONS_RESPONSE=$(curl -s "http://localhost:4320/api/govern-manage/decisions?restaurant_id=${RESTAURANT_ID}&limit=5")
echo "$DECISIONS_RESPONSE" | jq '.decisions[] | select(.event_type | contains("voice")) | {event_type, action_type, payload}'
echo ""

echo "${GREEN}✅ Demo concluída!${NC}"
echo ""
echo "${BLUE}📊 Próximos passos:${NC}"
echo "  1. Abra /app/govern-manage e veja a seção 'Voice Operations'"
echo "  2. Veja o Decision History com filtro 'voice_*'"
echo "  3. Verifique as tarefas criadas no AppStaff"
echo ""

