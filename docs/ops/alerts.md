# 🚨 Sistema de Alertas - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado

---

## 🎯 OBJETIVO

Implementar sistema de alertas para detectar incidentes críticos rapidamente (< 5 minutos).

---

## 🔔 ALERTAS CONFIGURADOS

### 1. Erros Críticos

**Condição:** > 10 erros/minuto

**Ação:**
- Enviar alerta imediato
- Notificar equipe de desenvolvimento
- Criar incidente automático

**Configuração:**
```yaml
# Sentry Alert
- Name: High Error Rate
- Condition: Error count > 10 in 1 minute
- Actions:
  - Send email to dev-team@chefiapp.com
  - Send Slack notification to #alerts
  - Create PagerDuty incident (if configured)
```

---

### 2. Performance Degradada

**Condição:** p95 > 1s ou p99 > 2s

**Ação:**
- Enviar alerta
- Investigar queries lentas
- Notificar equipe

**Configuração:**
```yaml
# Supabase Analytics Alert
- Name: Slow Queries
- Condition: p95 response time > 1000ms
- Actions:
  - Send email
  - Log to audit_logs
```

---

### 3. Health Check Falhando

**Condição:** Health check retorna `unhealthy` por 3 tentativas consecutivas

**Ação:**
- Alerta crítico
- Verificar infraestrutura
- Escalar para on-call

**Configuração:**
```yaml
# UptimeRobot Alert
- Name: Health Check Failed
- Condition: 3 consecutive failures
- Actions:
  - Send SMS to on-call
  - Send email to team
  - Create PagerDuty incident
```

---

### 4. Billing Falhando

**Condição:** Falha ao processar webhook de billing ou invoice não pago

**Ação:**
- Alerta para equipe financeira
- Notificar restaurante (se aplicável)

**Configuração:**
```yaml
# Stripe Webhook Alert
- Name: Billing Failure
- Condition: Webhook processing fails OR invoice.payment_failed
- Actions:
  - Send email to finance@chefiapp.com
  - Log to audit_logs
```

---

## 🔧 INTEGRAÇÕES

### Sentry (Erros)

**Configuração:**
1. Acesse Sentry Dashboard
2. Vá em **Alerts** > **Create Alert**
3. Configure condições
4. Adicione ações (email, Slack, PagerDuty)

**Exemplo:**
```javascript
// Sentry Alert Rule
{
  "conditions": [
    {
      "id": "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
      "value": 10,
      "interval": "1m"
    }
  ],
  "actions": [
    {
      "id": "sentry.rules.actions.notify_event_service.NotifyEventServiceAction",
      "service": "slack",
      "channel": "#alerts"
    }
  ]
}
```

---

### UptimeRobot (Health Checks)

**Configuração:**
1. Criar monitor HTTP(s)
2. URL: `https://[project].supabase.co/functions/v1/health`
3. Intervalo: 5 minutos
4. Alerta: 3 falhas consecutivas

**Ações:**
- Email
- SMS (opcional)
- Webhook (para Slack/PagerDuty)

---

### PagerDuty (Escalação)

**Configuração:**
1. Criar serviço no PagerDuty
2. Integrar com Sentry/UptimeRobot
3. Configurar escalação:
   - Nível 1: Dev on-call (5 min)
   - Nível 2: Tech Lead (15 min)
   - Nível 3: CTO (30 min)

---

### Slack (Notificações)

**Configuração:**
1. Criar webhook no Slack
2. Configurar em Sentry/PagerDuty
3. Canal: `#alerts` ou `#chefiapp-ops`

**Exemplo:**
```javascript
// Slack Webhook
{
  "text": "🚨 Alert: High Error Rate",
  "attachments": [
    {
      "color": "danger",
      "fields": [
        {
          "title": "Error Count",
          "value": "15 errors/min",
          "short": true
        },
        {
          "title": "Time",
          "value": "2026-01-22 10:30:00",
          "short": true
        }
      ]
    }
  ]
}
```

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### Sentry
- [ ] Criar projeto no Sentry
- [ ] Configurar DSN no app
- [ ] Criar alertas para erros críticos
- [ ] Integrar com Slack/PagerDuty
- [ ] Testar alertas

### UptimeRobot
- [ ] Criar conta
- [ ] Adicionar monitor de health check
- [ ] Configurar alertas (3 falhas consecutivas)
- [ ] Configurar notificações (email/SMS)
- [ ] Testar alertas

### PagerDuty (Opcional)
- [ ] Criar conta
- [ ] Criar serviço
- [ ] Integrar com Sentry/UptimeRobot
- [ ] Configurar escalação
- [ ] Testar alertas

### Slack
- [ ] Criar canal #alerts
- [ ] Criar webhook
- [ ] Integrar com Sentry/PagerDuty
- [ ] Testar notificações

---

## 🧪 TESTAR ALERTAS

### Testar Erro Crítico
1. Forçar 15 erros em 1 minuto
2. Verificar se alerta é enviado
3. Validar notificações (email, Slack)

### Testar Health Check
1. Desligar Supabase temporariamente
2. Verificar se UptimeRobot detecta
3. Validar alertas

### Testar Performance
1. Executar query lenta (> 1s)
2. Verificar se alerta é enviado
3. Validar notificações

---

## 📚 REFERÊNCIAS

- **Sentry Alerts:** https://docs.sentry.io/product/alerts/
- **UptimeRobot:** https://uptimerobot.com
- **PagerDuty:** https://www.pagerduty.com
- **Slack Webhooks:** https://api.slack.com/messaging/webhooks

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado
