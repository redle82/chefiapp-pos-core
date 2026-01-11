# 🎙️ Voice Operations Layer — Guia de Implementação

**Data**: 2025-01-02  
**Status**: ✅ Schema Pronto | ⏳ Integração Pendente  
**Frase-Chave**: "Alexa não decide. Ela sinaliza. ChefIApp governa."

---

## ✅ O Que Já Está Pronto

### 1. Schema SQL
- ✅ Tabela `voice_devices` (dispositivos registrados)
- ✅ Tabela `voice_events` (eventos de voz)
- ✅ Tabela `voice_routines` (rotinas fixas)
- ✅ Tabela `voice_acknowledgments` (log de confirmações)
- ✅ RLS Policies
- ✅ Indexes
- ✅ Feature Flag `voice_operations_enabled` no GovernManage
- ✅ Novos tipos de evento no Event Bus
- ✅ Rotinas padrão (seed)

### 2. Documentação
- ✅ `VOICE_OPERATIONS_LAYER.md` — Conceito e arquitetura
- ✅ `VOICE_OPERATIONS_IMPLEMENTATION.md` — Este guia

---

## ⏳ O Que Falta Implementar

### 1. Alexa Skill (Custom Skill)

#### Intents Necessários

**1. TriggerCleaning**
- **Utterances**: 
  - "Limpar {equipment}"
  - "Limpar a {equipment}"
  - "Preciso limpar {equipment}"
- **Slots**: `equipment` (Trituradeira, Fogão, Geladeira, etc.)
- **Action**: POST `/api/voice/events`

**2. AcknowledgeReminder**
- **Utterances**:
  - "Confirmado"
  - "Feito"
  - "Ok"
- **Action**: POST `/api/voice/events` com `acknowledgment`

**3. AskStatus**
- **Utterances**:
  - "Status da cozinha"
  - "O que falta fazer"
  - "Tarefas pendentes"
- **Action**: GET `/api/voice/status`

#### Exemplo de Intent Schema

```json
{
  "intents": [
    {
      "name": "TriggerCleaning",
      "samples": [
        "Limpar {equipment}",
        "Limpar a {equipment}",
        "Preciso limpar {equipment}"
      ],
      "slots": [
        {
          "name": "equipment",
          "type": "AMAZON.SearchQuery"
        }
      ]
    }
  ]
}
```

---

### 2. Backend (API)

#### Endpoints Necessários

**POST `/api/voice/events`**
- Recebe eventos da Alexa
- Normaliza evento
- Emite no Event Bus
- Cria tarefa (se necessário)
- Retorna resposta para Alexa

**Payload**:
```json
{
  "intent": "TriggerCleaning",
  "equipment": "trituradeira",
  "location": "kitchen",
  "device_id": "alexa_device_123",
  "user_id": "user_456"
}
```

**Response**:
```json
{
  "success": true,
  "response_text": "Tarefa de limpeza da trituradeira criada. Você pode verificar no AppStaff.",
  "task_id": "task_789",
  "operational_event_id": "event_101"
}
```

**GET `/api/voice/status`**
- Retorna status operacional
- Tarefas pendentes
- Próximas rotinas

**GET `/api/voice/routines`**
- Lista rotinas configuradas
- Status (enabled/disabled)
- Próxima execução

**POST `/api/voice/routines/:id/execute`**
- Executa rotina manualmente
- Útil para testes

---

### 3. Event Bus Integration

#### Emitir Eventos

**Localização**: `server/operational-event-bus/event-bus.ts`

**Quando receber comando de voz**:
```typescript
await emitEvent({
  event_type: 'voice_trigger',
  source_module: 'voice',
  context: {
    intent: 'TriggerCleaning',
    equipment: 'trituradeira',
    location: 'kitchen',
    device_id: 'alexa_device_123'
  },
  priority: 'P1'
});
```

**Quando executar rotina**:
```typescript
await emitEvent({
  event_type: 'voice_reminder',
  source_module: 'voice',
  context: {
    routine_name: 'Higienização Recorrente',
    announcement_text: 'Atenção cozinha. Hora de higienizar as mãos.'
  },
  priority: 'P2'
});
```

---

### 4. GovernManage Integration

#### Decision History

**Exemplo de entrada**:
```json
{
  "decision_type": "create_task",
  "trigger_event": {
    "type": "voice_trigger",
    "source": "alexa",
    "intent": "TriggerCleaning",
    "equipment": "trituradeira"
  },
  "rule_applied": "Voice Cleaning Trigger → Create Task",
  "action_taken": {
    "type": "create_task",
    "task_id": "task_789",
    "target": "appstaff",
    "priority": "P1"
  },
  "reasoning": "Comando de voz recebido para limpeza de equipamento. Tarefa criada automaticamente."
}
```

---

### 5. AppStaff Integration

#### Badge de Origem

**Localização**: `merchant-portal/src/pages/AppStaff/TaskCard.tsx`

**Exemplo**:
```tsx
{task.source === 'voice' && (
  <Badge variant="purple">
    🟣 Origem: Voz
    <Tooltip>
      Solicitado via Alexa às {formatTime(task.created_at)}
    </Tooltip>
  </Badge>
)}
```

---

### 6. UI GovernManage

#### Toggle de Feature Flag

**Localização**: `merchant-portal/src/pages/GovernManage/GovernManageDashboard.tsx`

**Adicionar seção**:
```tsx
<Card title="Voice Operations">
  <FeatureFlagToggle
    featureKey="voice_operations_enabled"
    label="Voice Operations Layer"
    description="Alexa como atuador operacional por voz"
  />
</Card>
```

#### Visualizar Eventos de Voz

**Adicionar filtro no Decision History**:
```tsx
<Filter
  label="Fonte"
  options={[
    { value: 'all', label: 'Todas' },
    { value: 'voice', label: 'Voz' },
    { value: 'appstaff', label: 'AppStaff' },
    { value: 'tpv', label: 'TPV' }
  ]}
  value={sourceFilter}
  onChange={setSourceFilter}
/>
```

---

### 7. Worker/Cron para Rotinas

#### Executar Rotinas Agendadas

**Localização**: `server/voice/routine-executor.ts`

**Lógica**:
1. Buscar rotinas ativas com `next_execution_at <= NOW()`
2. Executar anúncio via Alexa
3. Emitir eventos no Event Bus
4. Criar tarefas (se configurado)
5. Atualizar `next_execution_at`

**Exemplo**:
```typescript
async function executeScheduledRoutines() {
  const routines = await getRoutinesDue();
  
  for (const routine of routines) {
    // 1. Enviar anúncio para Alexa
    await sendToAlexa(routine.device_id, routine.announcement_text);
    
    // 2. Emitir evento
    await emitEvent({
      event_type: 'voice_reminder',
      context: { routine_id: routine.id, routine_name: routine.routine_name }
    });
    
    // 3. Executar ações
    for (const action of routine.actions) {
      await executeAction(action);
    }
    
    // 4. Calcular próxima execução
    const nextExecution = calculateNextExecution(routine);
    await updateRoutine(routine.id, { next_execution_at: nextExecution });
  }
}
```

---

## 🧭 Ordem de Implementação Recomendada

### Fase 1: Backend (Base)
1. ✅ Schema SQL
2. ⏳ Endpoints API (`/api/voice/events`, `/api/voice/status`)
3. ⏳ Integração com Event Bus
4. ⏳ Worker para rotinas agendadas

### Fase 2: Alexa Skill
5. ⏳ Criar Custom Skill
6. ⏳ Implementar intents (TriggerCleaning, AcknowledgeReminder, AskStatus)
7. ⏳ Conectar com endpoints

### Fase 3: UI
8. ⏳ Toggle no GovernManage
9. ⏳ Badge de origem no AppStaff
10. ⏳ Visualização de eventos de voz no Decision History

### Fase 4: Refinamento
11. ⏳ Testes E2E
12. ⏳ Analytics
13. ⏳ Otimizações

---

## 🚦 Feature Flag

### Ativação

**Via GovernManage UI**: `/app/govern-manage`

**Feature Key**: `voice_operations_enabled`

**Default**: `false` (desabilitado)

**Quando ativar**:
- Restaurantes com Alexa instalada
- Cozinhas que já usam voz
- Operações que precisam de lembretes recorrentes

---

## 🧪 Testes

### Cenários de Teste

1. **Comando de voz → Tarefa criada**
   - Dizer "Alexa, limpar trituradeira"
   - Verificar tarefa criada no AppStaff
   - Verificar evento no Event Bus
   - Verificar entrada no Decision History

2. **Rotina agendada → Anúncio executado**
   - Configurar rotina de higienização (30 min)
   - Aguardar execução
   - Verificar anúncio na Alexa
   - Verificar evento emitido

3. **Acknowledgment → Evento confirmado**
   - Receber lembrete
   - Dizer "Confirmado"
   - Verificar acknowledgment registrado

---

## 📊 Métricas

### O Que Medir

- % de tarefas criadas via voz
- Taxa de acknowledgment
- Tempo médio entre lembrete e ação
- Satisfação do staff

---

## 🎯 Diferenciação

### O Que Outros Sistemas Fazem

- ❌ Alexa como assistente pessoal
- ❌ Decisões invisíveis
- ❌ Sem rastreabilidade

### O Que ChefIApp Faz

- ✅ Alexa como atuador operacional
- ✅ Tudo rastreado no Decision History
- ✅ Governado por regras
- ✅ Integrado com Event Bus

**Isso ninguém tem.**

---

**Mensagem**: "Voz como camada operacional viva, governada por regras."

