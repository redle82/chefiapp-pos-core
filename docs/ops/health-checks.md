# 🏥 Health Checks - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ Implementado

---

## 🎯 OBJETIVO

Health checks verificam se o sistema está saudável e operacional. Permitem monitoramento externo e alertas automáticos.

---

## 🔧 ENDPOINTS

### Backend (Supabase Edge Function)

**URL:** `https://[project].supabase.co/functions/v1/health`

**Método:** `GET`

**Resposta (200 - Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T10:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "authentication": "ok"
  },
  "responseTime": 45
}
```

**Resposta (503 - Unhealthy):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-24T10:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": "error",
    "authentication": "ok"
  },
  "responseTime": 120
}
```

### App (Mobile)

**Função:** `checkHealth()` do serviço `healthCheck.ts`

**Uso:**
```typescript
import { checkHealth, isOnline } from '@/services/healthCheck';

// Verificar saúde completa
const health = await checkHealth();
console.log(health.status); // 'online' | 'offline'

// Verificar se está online (simples)
const online = await isOnline();
```

---

## 📊 O QUE É VERIFICADO

### Database
- ✅ Conexão com Supabase
- ✅ Query simples funciona
- ✅ Resposta em tempo razoável

### Authentication
- ✅ Serviço de autenticação acessível
- ✅ API responde corretamente
- ✅ Não requer sessão válida (apenas verifica serviço)

---

## 🔔 CONFIGURAR ALERTAS

### UptimeRobot (Recomendado)

1. **Criar conta:** https://uptimerobot.com
2. **Adicionar monitor:**
   - **Tipo:** HTTP(s)
   - **URL:** `https://[project].supabase.co/functions/v1/health`
   - **Intervalo:** 5 minutos
   - **Alerta:** Se falhar 3 vezes consecutivas
3. **Configurar notificações:**
   - Email
   - Slack (opcional)
   - SMS (opcional)

### Outros Serviços

- **Pingdom:** https://www.pingdom.com
- **StatusCake:** https://www.statuscake.com
- **Better Uptime:** https://betteruptime.com

---

## 📈 DASHBOARD DE STATUS

### Criar Dashboard Básico (Opcional)

Criar página simples mostrando status:

```typescript
// merchant-portal/src/pages/Admin/HealthStatusPage.tsx
import { checkBackendHealth } from '@/services/healthCheck';

// Mostrar status em tempo real
// Atualizar a cada 30 segundos
```

---

## 🧪 TESTES

### Testar Health Check Manualmente

```bash
# Backend
curl https://[project].supabase.co/functions/v1/health

# Deve retornar status 200 com JSON
```

### Testar no App

```typescript
import { checkHealth } from '@/services/healthCheck';

const health = await checkHealth();
console.log('Health:', health);
```

### Simular Falha

1. Desligar internet
2. Executar health check
3. Deve retornar `status: 'offline'`

---

## 📚 REFERÊNCIAS

- **Edge Function:** `supabase/functions/health/index.ts`
- **Serviço App:** `mobile-app/services/healthCheck.ts`
- **Sentry Docs:** https://docs.sentry.io/platforms/react-native/

---

## 🔄 MANUTENÇÃO

### Adicionar Novos Checks

Para adicionar novos checks (ex: storage, realtime):

1. Atualizar `HealthCheckResult` interface
2. Adicionar check na Edge Function
3. Adicionar check no serviço do app
4. Atualizar documentação

### Monitorar Performance

- **Response time:** Deve ser < 500ms
- **Uptime:** Meta de 99.5%+
- **Alertas:** Configurar para falhas > 3 consecutivas

---

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ Implementado
