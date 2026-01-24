# 🔍 MONITORING GUIDE — ChefIApp POS

> **Documento Canónico de Monitoramento**  
> **Data:** 2026-01-18  
> **Status:** Configuração Pendente

---

## 📊 Endpoints de Saúde

### Health Check (Já Implementado)

```bash
# Backend API
GET /health
GET /api/health

# Resposta esperada (HTTP 200):
{
  "status": "ok",
  "timestamp": "2026-01-18T10:00:00Z",
  "database": "connected",
  "version": "1.0.0"
}

# Resposta degradada (HTTP 503):
{
  "status": "degraded",
  "database": "error",
  "error": "Connection timeout"
}
```

### URLs para Monitorar

| Serviço | URL | Tipo | Intervalo |
|---------|-----|------|-----------|
| Backend API | `https://api.chefiapp.com/health` | HTTP GET | 1 min |
| Frontend | `https://app.chefiapp.com` | HTTP GET | 5 min |
| Public Pages | `https://chefiapp.com/public/sofia-gastrobar` | HTTP GET | 5 min |

---

## 🤖 Configuração UptimeRobot

### Passo 1: Criar Conta

1. Aceder a [uptimerobot.com](https://uptimerobot.com)
2. Criar conta gratuita (50 monitores)
3. Verificar email

### Passo 2: Adicionar Monitores

#### Monitor 1: Backend Health

```
Name: ChefIApp API Health
URL: https://api.chefiapp.com/health
Type: HTTP(s)
Monitoring Interval: 1 minute
Keyword: "ok" (Check for keyword)
Alert Contact: [Seu email/Discord]
```

#### Monitor 2: Frontend

```
Name: ChefIApp Portal
URL: https://app.chefiapp.com
Type: HTTP(s)
Monitoring Interval: 5 minutes
Alert Contact: [Seu email/Discord]
```

#### Monitor 3: Public Pages

```
Name: ChefIApp Public
URL: https://chefiapp.com
Type: HTTP(s)
Monitoring Interval: 5 minutes
Alert Contact: [Seu email/Discord]
```

### Passo 3: Configurar Alertas (Discord)

1. Em UptimeRobot: **My Settings** → **Alert Contacts**
2. Clicar **Add Alert Contact**
3. Seleccionar **Webhook**
4. Colar Discord Webhook URL:

   ```
   https://discord.com/api/webhooks/XXX/YYY
   ```

5. Formato: Usar template abaixo

#### Discord Webhook Template

```json
{
  "content": null,
  "embeds": [{
    "title": "*monitorFriendlyName* is *alertTypeFriendlyName*",
    "description": "*alertDetails*",
    "color": "*alertType*" == "up" ? 65280 : 16711680,
    "fields": [
      {"name": "URL", "value": "*monitorURL*"},
      {"name": "Duration", "value": "*alertDuration*"}
    ]
  }]
}
```

### Passo 4: Email Alerts

1. Alert Contacts → Add **Email**
2. Adicionar emails:
   - `dev@chefiapp.com`
   - Email pessoal do founder

---

## 📈 Dashboard Público (Opcional)

### Status Page

UptimeRobot oferece status page grátis:

1. **Dashboard** → **Status Pages**
2. **Add Status Page**
3. Configurar:

   ```
   Subdomain: status.chefiapp.com
   Monitors: Selecionar todos
   Theme: Dark
   ```

4. Partilhar URL: `https://stats.uptimerobot.com/XXXXX`

---

## 🔧 Alertas Recomendados

### Níveis de Severidade

| Evento | Canal | Intervalo |
|--------|-------|-----------|
| Down > 1 min | Discord + Email | Imediato |
| Down > 5 min | SMS (Pago) | 1x |
| Recovered | Discord | Imediato |

### Thresholds

- **Response Time**: Alertar se > 2000ms (p95)
- **Downtime**: Alertar imediato se > 1 min
- **SSL Expiry**: Alertar 14 dias antes

---

## 📋 Checklist de Setup

- [ ] Criar conta UptimeRobot
- [ ] Adicionar monitor: Backend API
- [ ] Adicionar monitor: Frontend
- [ ] Adicionar monitor: Public Pages
- [ ] Configurar Discord webhook
- [ ] Configurar email alerts
- [ ] Testar alerta manual (pause/unpause)
- [ ] Criar Status Page (opcional)

---

## 🔗 Alternativas (Pagas)

| Serviço | Preço/Mês | Vantagens |
|---------|-----------|-----------|
| Better Uptime | $20 | Melhor UI, Incident Management |
| Pingdom | $15 | Enterprise features |
| Datadog | $23+ | APM completo |
| StatusCake | $20 | Global monitoring |

**Recomendação:** Começar com UptimeRobot (grátis), migrar para Better Uptime se crescer.

---

## 📊 Métricas de Sucesso

| Métrica | Meta | Ferramenta |
|---------|------|------------|
| Uptime | 99.9% | UptimeRobot |
| Response Time (p95) | < 500ms | UptimeRobot |
| SSL Valid | Sempre | UptimeRobot |
| Zero Critical Alerts | 0/mês | Dashboard |

---

**Última atualização:** 2026-01-18
