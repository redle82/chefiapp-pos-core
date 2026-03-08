# 🎙️ Demo: Fluxo Completo Voice Operations

**Data**: 2025-01-02  
**Status**: ✅ Script Criado  
**Objetivo**: Validar o fluxo completo VOL → Event Bus → AppStaff → Why Badge

---

## 🎯 O Que Este Demo Valida

### Fluxo Completo

1. **Ativação** → Voice Operations habilitado
2. **Registro** → Dispositivo Alexa registrado
3. **Disparo** → Rotina "Abertura de Turno" executada
4. **Event Bus** → Evento `voice_reminder` criado
5. **GovernManage** → Regra processada, decisão registrada
6. **AppStaff** → Task criada para funcionário
7. **Why Badge** → Task mostra origem (regra + evento)
8. **Ack** → Funcionário confirma lembrete
9. **Decision History** → Tudo rastreável

---

## 🚀 Como Executar

### Pré-requisitos

1. Servidor rodando (`npm run dev` no `server/`)
2. Frontend rodando (`npm run dev` no `merchant-portal/`)
3. Banco de dados configurado
4. `jq` instalado (`brew install jq` ou `apt-get install jq`)

### Executar Demo

```bash
# Opção 1: Com restaurant_id padrão
./scripts/demo-voice-complete-flow.sh

# Opção 2: Com restaurant_id customizado
RESTAURANT_ID="seu-restaurant-id" ./scripts/demo-voice-complete-flow.sh

# Opção 3: Com API base customizada
API_BASE="http://localhost:3000" ./scripts/demo-voice-complete-flow.sh
```

---

## 📊 O Que Esperar

### Saída do Script

```
🎙️ Demo: Fluxo Completo Voice Operations
==========================================

1. Ativando Voice Operations...
✅ Voice Operations ativado

2. Registrando dispositivo Alexa...
✅ Dispositivo registrado: demo-echo-001

3. Verificando rotinas disponíveis...
routine-001 - Abertura de Turno (true)

4. Disparando rotina 'Abertura de Turno'...
✅ Voice event criado: event-123

5. Aguardando processamento pelo Event Bus (3s)...

6. Verificando status do Voice Operations...
{
  "enabled": true,
  "devices": 1,
  "routines": 3,
  "pending_acks": 1,
  "last_triggered": "Abertura de Turno"
}

7. Verificando Decision History...
voice_reminder → create_task (Regra: Voice Reminder Handler)

8. Verificando tasks criadas...
Task criada: task-456 por regra Voice Reminder Handler após evento voice_reminder

9. Simulando confirmação (ack) do funcionário...
✅ Confirmação registrada

10. Status final...
{
  "enabled": true,
  "devices": 1,
  "routines": 3,
  "pending_acks": 0
}

✅ Demo completo!
```

---

## ✅ Validações Manuais

Após executar o script, validar manualmente:

### 1. GovernManage Dashboard

- Abrir: `http://localhost:5173/app/govern-manage`
- Verificar seção "Voice Operations":
  - ✅ Master toggle ativo
  - ✅ Dispositivo registrado e online
  - ✅ Rotinas listadas
  - ✅ Pending acks = 0 (após ack)

### 2. Decision History

- Filtrar por `voice_reminder`
- Verificar:
  - ✅ Evento criado
  - ✅ Regra aplicada
  - ✅ Task criada
  - ✅ Link para detalhes

### 3. AppStaff

- Abrir: `http://localhost:5173/app/appstaff`
- Verificar task criada:
  - ✅ Título: "Lembrete: Verificar temperatura..."
  - ✅ Badge "🎙️ Por quê?" visível
  - ✅ Ao clicar, mostra: "Criada por regra 'Voice Reminder Handler' após evento voice_reminder"

---

## 🔍 Troubleshooting

### Erro: "jq: command not found"

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### Erro: "Connection refused"

- Verificar se o servidor está rodando: `curl http://localhost:3000/health`
- Verificar se a porta está correta: `API_BASE="http://localhost:3000"`

### Erro: "restaurant_id not found"

- Criar arquivo `.restaurant_id` com o ID do restaurante
- Ou passar via variável: `RESTAURANT_ID="seu-id"`

### Nenhuma task criada

- Verificar se a regra `voice_reminder` está ativa no GovernManage
- Verificar se o Event Bus está processando eventos
- Verificar logs do servidor

---

## 🎯 Próximos Passos

1. **Teste E2E com Playwright**
   - Automatizar validação visual
   - Screenshots do fluxo completo

2. **Conectores Plugáveis**
   - Alexa Skill MVP
   - Google Action MVP

3. **Modo Individual**
   - AppStaff com voz no fone
   - Alertas silenciosos

---

**Mensagem Final**:  
"O loop está fechado. GovernManage → Event Bus → VOL → AppStaff → Why Badge → GovernManage."

