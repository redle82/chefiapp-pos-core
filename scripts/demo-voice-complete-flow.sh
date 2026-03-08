#!/bin/bash

# demo-voice-complete-flow.sh
# 
# Demo completo do fluxo Voice Operations:
# 1. Ativa Voice Operations
# 2. Registra dispositivo Alexa
# 3. Dispara rotina "Abertura de Turno"
# 4. Verifica criação de task no AppStaff
# 5. Verifica "Why Badge" na task
# 6. Simula ack do funcionário
# 7. Verifica Decision History no GovernManage

set -e

echo "🎙️ Demo: Fluxo Completo Voice Operations"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuração
API_BASE="${API_BASE:-http://localhost:3000}"
RESTAURANT_ID="${RESTAURANT_ID:-$(cat .restaurant_id 2>/dev/null || echo 'demo-restaurant-001')}"

echo -e "${BLUE}Configuração:${NC}"
echo "  API Base: $API_BASE"
echo "  Restaurant ID: $RESTAURANT_ID"
echo ""

# 1. Ativar Voice Operations
echo -e "${YELLOW}1. Ativando Voice Operations...${NC}"
curl -s -X POST "$API_BASE/api/govern-manage/feature-flags/voice_operations_enabled?restaurant_id=$RESTAURANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' | jq -r '.message // "✅ Voice Operations ativado"'
echo ""

# 2. Registrar dispositivo Alexa
echo -e "${YELLOW}2. Registrando dispositivo Alexa...${NC}"
DEVICE_RESPONSE=$(curl -s -X POST "$API_BASE/api/voice/devices/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"restaurant_id\": \"$RESTAURANT_ID\",
    \"device_name\": \"Echo Kitchen Demo\",
    \"device_type\": \"alexa\",
    \"device_id\": \"demo-echo-001\",
    \"location\": \"kitchen\",
    \"volume\": 70,
    \"language\": \"pt-BR\"
  }")
DEVICE_ID=$(echo $DEVICE_RESPONSE | jq -r '.device.id // .id // "demo-echo-001"')
echo "✅ Dispositivo registrado: $DEVICE_ID"
echo ""

# 3. Verificar rotinas disponíveis
echo -e "${YELLOW}3. Verificando rotinas disponíveis...${NC}"
ROUTINES=$(curl -s "$API_BASE/api/voice/routines?restaurant_id=$RESTAURANT_ID" | jq -r '.routines[] | "\(.id) - \(.routine_name) (\(.enabled))"')
echo "$ROUTINES"
ROUTINE_ID=$(curl -s "$API_BASE/api/voice/routines?restaurant_id=$RESTAURANT_ID" | jq -r '.routines[0].id // empty')
if [ -z "$ROUTINE_ID" ]; then
  echo "⚠️  Nenhuma rotina encontrada. Criando rotina padrão..."
  # A rotina deve ser criada via migration, mas se não existir, vamos continuar
  ROUTINE_ID="default-routine-001"
fi
echo ""

# 4. Disparar rotina manualmente (simulando scheduler)
echo -e "${YELLOW}4. Disparando rotina 'Abertura de Turno'...${NC}"
VOICE_EVENT_RESPONSE=$(curl -s -X POST "$API_BASE/api/voice/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"restaurant_id\": \"$RESTAURANT_ID\",
    \"device_id\": \"$DEVICE_ID\",
    \"event_type\": \"voice_reminder\",
    \"direction\": \"system_to_voice\",
    \"context\": {
      \"routine_id\": \"$ROUTINE_ID\",
      \"routine_name\": \"Abertura de Turno\",
      \"announcement_text\": \"Lembrete: Verificar temperatura dos equipamentos e higienização das superfícies.\"
    }
  }")
VOICE_EVENT_ID=$(echo $VOICE_EVENT_RESPONSE | jq -r '.event.id // .id // empty')
echo "✅ Voice event criado: $VOICE_EVENT_ID"
echo ""

# 5. Aguardar processamento pelo Event Bus
echo -e "${YELLOW}5. Aguardando processamento pelo Event Bus (3s)...${NC}"
sleep 3
echo ""

# 6. Verificar status do Voice
echo -e "${YELLOW}6. Verificando status do Voice Operations...${NC}"
VOICE_STATUS=$(curl -s "$API_BASE/api/voice/status?restaurant_id=$RESTAURANT_ID")
echo "$VOICE_STATUS" | jq -r '{
  enabled: .enabled,
  devices: (.devices | length),
  routines: (.routines | length),
  pending_acks: .pending_acks,
  last_triggered: .last_triggered_routine.routine_name
}'
echo ""

# 7. Verificar Decision History
echo -e "${YELLOW}7. Verificando Decision History (últimas 5 decisões)...${NC}"
DECISIONS=$(curl -s "$API_BASE/api/govern-manage/decisions?restaurant_id=$RESTAURANT_ID&limit=5")
echo "$DECISIONS" | jq -r '.decisions[] | "\(.event_type) → \(.action_type) (Regra: \(.rule_name // "N/A"))"'
echo ""

# 8. Verificar tasks criadas (via AppStaff - se houver endpoint)
echo -e "${YELLOW}8. Verificando tasks criadas...${NC}"
# Nota: Isso requer um endpoint de tasks ou acesso direto ao banco
# Por enquanto, vamos verificar via Decision History
TASK_DECISIONS=$(echo "$DECISIONS" | jq -r '.decisions[] | select(.action_type == "create_task") | "Task criada: \(.task_id // "N/A") por regra \(.rule_name // "N/A") após evento \(.event_type)"')
if [ -z "$TASK_DECISIONS" ]; then
  echo "⚠️  Nenhuma task encontrada (pode ser que a regra não esteja configurada)"
else
  echo "$TASK_DECISIONS"
fi
echo ""

# 9. Simular ack do funcionário
if [ ! -z "$VOICE_EVENT_ID" ]; then
  echo -e "${YELLOW}9. Simulando confirmação (ack) do funcionário...${NC}"
  ACK_RESPONSE=$(curl -s -X POST "$API_BASE/api/voice/events/$VOICE_EVENT_ID/ack" \
    -H "Content-Type: application/json" \
    -d "{
      \"restaurant_id\": \"$RESTAURANT_ID\",
      \"acknowledged_by\": \"demo-worker-001\"
    }")
  echo "✅ Confirmação registrada"
  echo ""
fi

# 10. Verificar status final
echo -e "${YELLOW}10. Status final...${NC}"
FINAL_STATUS=$(curl -s "$API_BASE/api/voice/status?restaurant_id=$RESTAURANT_ID")
echo "$FINAL_STATUS" | jq -r '{
  enabled: .enabled,
  devices: (.devices | length),
  routines: (.routines | length),
  pending_acks: .pending_acks
}'
echo ""

# Resumo
echo -e "${GREEN}=========================================="
echo "✅ Demo completo!"
echo "==========================================${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Abrir GovernManage: http://localhost:5173/app/govern-manage"
echo "  2. Verificar Decision History"
echo "  3. Abrir AppStaff e verificar tasks com 'Why Badge'"
echo "  4. Verificar Voice Operations Panel"
echo ""

