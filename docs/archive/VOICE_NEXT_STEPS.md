# 🚀 Voice Operations — Próximos Passos

**Data**: 2025-01-02  
**Status**: ✅ Base Implementada  
**Objetivo**: Roadmap para próximas funcionalidades

---

## ✅ O Que Já Está Pronto

1. ✅ **VOL Core** (Voice Operations Layer)
   - Schema SQL completo
   - API endpoints
   - Scheduler de rotinas
   - Integração Event Bus

2. ✅ **GovernManage Integration**
   - Feature flag `voice_operations_enabled`
   - Voice Status Panel
   - Decision History tracking

3. ✅ **AppStaff Integration**
   - Task Why Badge
   - Origem rastreável (regra + evento)

4. ✅ **Demo Script**
   - Fluxo completo automatizado
   - Validação end-to-end

---

## 🎯 Próximos Passos (Priorizados)

### 🔹 Fase 1: Conectores Plugáveis (MVP)

**Objetivo**: Demonstrar que VOL é independente de dispositivos

#### 1.1 Alexa Skill MVP

**Entregáveis**:
- Skill básica no Amazon Developer Console
- Intents mínimos:
  - `AcknowledgeReminderIntent` ("Ok", "feito", "confirmado")
  - `TriggerCleaningIntent` ("Alexa, limpar a trituradora")
  - `AskStatusIntent` ("Alexa, status da cozinha")
- Lambda function que chama `/api/voice/events`
- Teste local com `ask-sdk-local-debug`

**Tempo estimado**: 2-3 dias

**Arquivos**:
- `server/voice/connectors/alexa-skill.ts`
- `server/voice/connectors/alexa-lambda.ts`
- `docs/ALEXA_SKILL_SETUP.md`

#### 1.2 Google Action MVP

**Entregáveis**:
- Action básica no Google Actions Console
- Intents similares ao Alexa
- Webhook que chama `/api/voice/events`
- Teste local com `gactions`

**Tempo estimado**: 2-3 dias

**Arquivos**:
- `server/voice/connectors/google-action.ts`
- `server/voice/connectors/google-webhook.ts`
- `docs/GOOGLE_ACTION_SETUP.md`

#### 1.3 Interface Genérica de Conectores

**Entregáveis**:
- Interface `VoiceConnector` TypeScript
- Factory para criar conectores
- Health check automático
- Fallback entre conectores

**Tempo estimado**: 1 dia

**Arquivos**:
- `server/voice/connectors/connector-interface.ts`
- `server/voice/connectors/connector-factory.ts`

---

### 🔹 Fase 2: Modo Individual (AppStaff)

**Objetivo**: Voz no fone, sem alto-falante

#### 2.1 Web Audio API Integration

**Entregáveis**:
- Componente `VoicePlayer` no AppStaff
- Reprodução de lembretes via Web Audio
- Controle de volume
- Confirmação por toque

**Tempo estimado**: 1-2 dias

**Arquivos**:
- `merchant-portal/src/pages/AppStaff/components/VoicePlayer.tsx`
- `merchant-portal/src/pages/AppStaff/hooks/useVoicePlayer.ts`

#### 2.2 Notificações Push (Opcional)

**Entregáveis**:
- Service Worker para notificações
- Notificações silenciosas
- Badge no ícone do app

**Tempo estimado**: 2-3 dias

**Arquivos**:
- `merchant-portal/src/service-worker.ts`
- `merchant-portal/src/pages/AppStaff/hooks/usePushNotifications.ts`

---

### 🔹 Fase 3: Testes E2E

**Objetivo**: Validar fluxo completo automaticamente

#### 3.1 Playwright Test Suite

**Entregáveis**:
- Teste: Ativar Voice Operations
- Teste: Registrar dispositivo
- Teste: Disparar rotina
- Teste: Verificar task no AppStaff
- Teste: Verificar Why Badge
- Teste: Simular ack
- Teste: Verificar Decision History

**Tempo estimado**: 2-3 dias

**Arquivos**:
- `tests/voice-operations-e2e.spec.ts`
- `tests/voice-operations-helpers.ts`

#### 3.2 Screenshots e Vídeos

**Entregáveis**:
- Screenshots de cada etapa
- Vídeo do fluxo completo
- GIF para documentação

**Tempo estimado**: 1 dia

---

### 🔹 Fase 4: Melhorias de UX

**Objetivo**: Tornar a experiência mais fluida

#### 4.1 Voice Status Dashboard

**Entregáveis**:
- Dashboard dedicado para Voice Operations
- Gráficos de uso
- Histórico de rotinas
- Métricas (acks pendentes, tempo médio de resposta)

**Tempo estimado**: 2-3 dias

**Arquivos**:
- `merchant-portal/src/pages/VoiceOperations/VoiceDashboard.tsx`

#### 4.2 Why Badge Melhorado

**Entregáveis**:
- Tooltip com mais detalhes
- Link direto para Decision History
- Visualização de cadeia de eventos

**Tempo estimado**: 1 dia

---

## 🎯 Decisão de Produto

### O Que Fazer Agora ✅

1. **Fase 1 (Conectores)** → Prioridade ALTA
   - Demonstra arquitetura defensável
   - Prova que VOL é independente
   - Permite demo comercial

2. **Fase 3 (Testes E2E)** → Prioridade MÉDIA
   - Garante qualidade
   - Facilita manutenção
   - Documenta comportamento

3. **Fase 2 (Modo Individual)** → Prioridade BAIXA
   - Nice to have
   - Pode esperar feedback de usuários

4. **Fase 4 (Melhorias UX)** → Prioridade BAIXA
   - Refinamento contínuo
   - Baseado em feedback

---

## 📊 Métricas de Sucesso

### Fase 1 (Conectores)

- ✅ Alexa Skill funcional
- ✅ Google Action funcional
- ✅ Demo comercial possível
- ✅ Documentação completa

### Fase 3 (Testes E2E)

- ✅ 100% de cobertura do fluxo crítico
- ✅ Testes passando em CI/CD
- ✅ Screenshots atualizados

---

## 🚀 Começar Agora

### Próximo Passo Imediato

**Criar Alexa Skill MVP**:

1. Criar conta no Amazon Developer Console
2. Criar skill básica
3. Configurar Lambda function
4. Testar localmente
5. Documentar processo

**Comando**:
```bash
# Criar estrutura básica
mkdir -p server/voice/connectors
touch server/voice/connectors/alexa-skill.ts
touch docs/ALEXA_SKILL_SETUP.md
```

---

**Mensagem Final**:  
"O fundamento está perfeito. Agora é conectar os periféricos."

