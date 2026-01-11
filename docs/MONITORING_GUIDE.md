# 📊 MONITORING GUIDE — CHEFIAPP POS CORE
**Versão:** 1.0.0  
**Data:** 2026-01-17  
**Status:** ✅ Em Implementação

---

## 📋 OVERVIEW

O sistema possui monitoramento básico implementado. Este guia descreve o que está disponível e o que pode ser melhorado.

---

## ✅ MONITORAMENTO ATUAL

### 1. Health Check
- **Endpoint:** `/health` ou `/api/health`
- **Verifica:** Database, Supabase, Storage
- **Status:** ✅ Implementado

### 2. Audit Logs
- **Tabela:** `gm_audit_logs`
- **Ações logadas:** orders, payments, cash registers
- **Status:** ✅ Implementado

### 3. Structured Logging
- **Frontend:** `app_logs` (Supabase)
- **Backend:** Console + Audit Logs
- **Status:** ✅ Implementado

### 4. Performance Monitoring
- **Métricas:** Web Vitals, operation durations
- **Status:** ✅ Implementado (básico)

---

## 🔍 MELHORIAS RECOMENDADAS

### 1. Sentry Integration

**Objetivo:** Capturar erros em produção

**Implementação:**
```typescript
// merchant-portal/src/core/monitoring/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Benefícios:**
- Stack traces completos
- Contexto de erro rico
- Alertas automáticos
- Performance tracking

### 2. Uptime Monitoring

**Objetivo:** Monitorar disponibilidade do sistema

**Serviços Recomendados:**
- **UptimeRobot** (gratuito)
- **Pingdom** (pago)
- **StatusCake** (gratuito)

**Configuração:**
- URL: `https://your-app.vercel.app/health`
- Intervalo: 5 minutos
- Alertas: Email/SMS/Slack

### 3. Log Aggregation

**Objetivo:** Centralizar logs de múltiplas fontes

**Serviços Recomendados:**
- **LogRocket** (frontend)
- **Datadog** (full-stack)
- **New Relic** (full-stack)

**Benefícios:**
- Busca de logs unificada
- Alertas baseados em padrões
- Análise de tendências

### 4. Performance Monitoring

**Objetivo:** Rastrear performance em produção

**Métricas Importantes:**
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

**Implementação:**
```typescript
// merchant-portal/src/core/monitoring/webVitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Enviar para serviço de analytics
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onFCP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

### 5. Business Metrics

**Objetivo:** Rastrear métricas de negócio

**Métricas Importantes:**
- Pedidos por dia
- Receita por dia
- Taxa de conversão
- Tempo médio de preparo
- Taxa de cancelamento

**Implementação:**
```typescript
// merchant-portal/src/core/analytics/businessMetrics.ts
export async function trackOrderCreated(orderId: string, amount: number) {
  // Enviar para analytics
}

export async function trackPaymentCompleted(orderId: string, method: string) {
  // Enviar para analytics
}
```

---

## 📊 DASHBOARD RECOMENDADO

### Métricas Principais

1. **Sistema**
   - Uptime (99.9% target)
   - Response time (p50, p95, p99)
   - Error rate (< 0.1% target)

2. **Negócio**
   - Pedidos hoje
   - Receita hoje
   - Pedidos ativos
   - Tempo médio de preparo

3. **Infraestrutura**
   - CPU usage
   - Memory usage
   - Database connections
   - API rate limits

---

## 🚨 ALERTAS RECOMENDADOS

### Críticos (Imediato)
- Sistema offline (> 1 minuto)
- Error rate > 1%
- Database connection failures
- Payment gateway failures

### Importantes (15 minutos)
- Response time > 2s (p95)
- Memory usage > 80%
- CPU usage > 80%
- Realtime disconnections

### Informativos (1 hora)
- Coverage < 70%
- Bundle size > 500KB
- Slow queries (> 1s)

---

## 🔧 IMPLEMENTAÇÃO PRÁTICA

### Fase 1: Sentry (2h)
1. Criar conta Sentry
2. Instalar SDK
3. Configurar DSN
4. Testar captura de erros

### Fase 2: Uptime Monitoring (1h)
1. Criar conta UptimeRobot
2. Configurar monitor do `/health`
3. Configurar alertas

### Fase 3: Log Aggregation (4h)
1. Escolher serviço (LogRocket/Datadog)
2. Integrar frontend
3. Integrar backend
4. Configurar dashboards

### Fase 4: Performance Monitoring (2h)
1. Implementar Web Vitals
2. Configurar métricas customizadas
3. Criar dashboard

---

## 📈 MÉTRICAS DE SUCESSO

### Antes
- ❌ Sem monitoramento de erros
- ❌ Sem alertas
- ❌ Logs dispersos
- ❌ Sem métricas de performance

### Depois
- ✅ Erros capturados automaticamente
- ✅ Alertas configurados
- ✅ Logs centralizados
- ✅ Performance rastreada

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Sentry configurado
- [ ] Uptime monitoring ativo
- [ ] Log aggregation funcionando
- [ ] Performance monitoring implementado
- [ ] Business metrics rastreadas
- [ ] Alertas configurados
- [ ] Dashboard criado
- [ ] Documentação atualizada

---

**Construído com 💛 pelo Goldmonkey Empire**

> "O que não é medido, não pode ser melhorado."
