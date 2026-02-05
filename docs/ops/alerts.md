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

## G3 Onda 3 — Regras de alerta conforme ANOMALY_DEFINITION

Regras concretas alinhadas a [ANOMALY_DEFINITION.md](../architecture/ANOMALY_DEFINITION.md) e [SLO_SLI.md](../architecture/SLO_SLI.md). Configurar em Sentry, Grafana ou equivalente.

| Anomalia | Condição (exemplo) | Janela | Severidade | Onde configurar | Ação / runbook |
|----------|---------------------|--------|------------|------------------|----------------|
| **login_failure_count** | Contagem de eventos `login_failure` em gm_audit_logs por identifier ou tenant > 10 | 5 min | Warning | Grafana (query gm_audit_logs ou Realtime) ou Sentry (se login falha enviar evento) | [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) |
| **heartbeat_missed** | Terminal sem heartbeat > 90 s | 90 s | Warning | Worker/portal que emite heartbeat; alerta se ausência > 90 s | [HEARTBEAT_MINIMAL_CONTRACT](../architecture/HEARTBEAT_MINIMAL_CONTRACT.md) |
| **API indisponível** | Health check falha ou disponibilidade < 99% | 5 min | Critical | UptimeRobot / probe externo; ou Sentry (erro rate) | [RUNBOOKS.md](./RUNBOOKS.md); escalar engenharia |
| **Latência P95 > SLO** | api_request_latency_p95 > 500 ms | 5 min | Warning | APM (Sentry, Datadog) ou proxy | [SLO_SLI.md](../architecture/SLO_SLI.md) |
| **Taxa de erro 5xx** | (5xx / total requests) > 1% | 5 min | Critical ou Warning | Sentry, proxy ou logs | [RUNBOOKS.md](./RUNBOOKS.md) |
| **user_disabled / session_revoked** | Evento em gm_audit_logs | — | Info (registar) | Dashboard ou log; opcional notificação se em massa | [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](./INCIDENT_PLAYBOOK_STOLEN_DEVICE.md) |

### Exemplo: alerta login_failure em Grafana

- **Fonte:** Query a `gm_audit_logs` (via get_audit_logs ou datasource Supabase) com filtro `event_type = 'login_failure'`.
- **Condição:** `count(rows) > 10` na janela de 5 min (por tenant ou global).
- **Ação:** Notificar Slack/email; ver [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md).

### Exemplo: alerta em Sentry (erros / disponibilidade)

- **High Error Rate:** Event frequency > 10 em 1 min → Critical; notificar #alerts.
- **Health Check Failed:** UptimeRobot 3 falhas consecutivas → Critical; SMS/email on-call.

*Documento vivo. Ao ativar cada regra em Sentry/Grafana, marcar no checklist abaixo.*

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

- [ALERT_THRESHOLDS_CONTRACT.md](./ALERT_THRESHOLDS_CONTRACT.md) — Limiares operacionais (pedido atrasado, mesa sem atendimento) no portal
- [ALERT_ACTION_CONTRACT.md](./ALERT_ACTION_CONTRACT.md) — Ação imediata para alertas críticos (notificação in-app, link runbook)
- [ANOMALY_DEFINITION.md](../architecture/ANOMALY_DEFINITION.md) — Definição de anomalias (G3 Onda 3)
- [SLO_SLI.md](../architecture/SLO_SLI.md) — SLO e janelas
- [EVENT_PIPELINE.md](./EVENT_PIPELINE.md) — Consumo de gm_audit_logs para alertas
- **Sentry Alerts:** https://docs.sentry.io/product/alerts/
- **UptimeRobot:** https://uptimerobot.com
- **PagerDuty:** https://www.pagerduty.com
- **Slack Webhooks:** https://api.slack.com/messaging/webhooks

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado
