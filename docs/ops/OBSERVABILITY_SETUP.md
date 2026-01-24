# OBSERVABILITY SETUP — ChefIApp

**Status:** ATIVO  
**Data:** 2026-01-24  
**Versão:** 1.1

---

## VISÃO GERAL

Sistema de observabilidade completo para ChefIApp:

1. **Sentry** — Captura de erros em tempo real
2. **Dashboard de Métricas** — KPIs operacionais em tempo real
3. **Logging Centralizado** — Logs estruturados com contexto

---

## PARTE 1: SENTRY (Error Tracking)

O Sentry está integrado em todas as aplicações do ChefIApp para:

- **Captura de erros** em tempo real
- **Performance monitoring** (traces)
- **Session replay** para debugging visual
- **Alertas automáticos**

---

## CONFIGURAÇÃO POR APLICAÇÃO

### 1. Mobile App (React Native / Expo)

**Status:** ✅ Configurado

**Arquivo:** `mobile-app/services/logging.ts`

**Variáveis de ambiente:**
```bash
# .env.production
EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Uso:**
```typescript
import { logError, logEvent, setUserContext } from '@/services/logging';

// Log de erro
logError(error, { restaurantId, action: 'create_order' });

// Evento de tracking
logEvent('order_created', { orderId, total });

// Contexto de usuário (após login)
setUserContext(userId, restaurantId);
```

---

### 2. Merchant Portal (React / Vite)

**Status:** ✅ Configurado

**Arquivo:** `merchant-portal/src/core/logger/Logger.ts`

**Variáveis de ambiente:**
```bash
# .env.production
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Para upload de sourcemaps (CI/CD)
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=chefiapp
SENTRY_PROJECT=merchant-portal
```

**Uso:**
```typescript
import { Logger, setSentryUser, addBreadcrumb } from '@/core/logger';

// Logging padrão (já envia para Sentry se warn/error/critical)
Logger.error('Payment failed', error, { orderId });
Logger.warn('Stock low', { productId });

// Contexto de usuário
setSentryUser(userId, tenantId);

// Breadcrumb para debugging
addBreadcrumb('User clicked checkout', 'ui.click', { cartTotal });
```

---

### 3. Customer Portal (React / Vite)

**Status:** ✅ Configurado

**Arquivo:** `customer-portal/src/lib/logger.ts`

**Variáveis de ambiente:**
```bash
# .env.production
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Para upload de sourcemaps (CI/CD)
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=chefiapp
SENTRY_PROJECT=customer-portal
```

**Uso:**
```typescript
import { logError, logWarning, addBreadcrumb, setUserContext } from '@/lib/logger';

// Erros
logError(error, { restaurantSlug, orderId });

// Warnings
logWarning('Cart abandoned', { cartValue });

// Breadcrumbs
addBreadcrumb('Added item to cart', 'cart', { productId });

// Contexto
setUserContext(undefined, restaurantSlug);
```

---

## SETUP NO SENTRY.IO

### 1. Criar Projeto

1. Acesse [sentry.io](https://sentry.io)
2. Crie 3 projetos:
   - `chefiapp-mobile` (React Native)
   - `merchant-portal` (React)
   - `customer-portal` (React)

### 2. Obter DSN

Para cada projeto:
1. Settings → Client Keys (DSN)
2. Copie o DSN
3. Configure nas variáveis de ambiente

### 3. Configurar Alertas

**Recomendado:**

| Alerta | Condição | Ação |
|--------|----------|------|
| Erro Crítico | `level:fatal` OR `level:error` com >5 ocorrências/5min | Email + Slack |
| Performance | P95 latency > 3s | Email |
| Novo Issue | Primeira ocorrência | Slack |

### 4. Upload de Sourcemaps (CI/CD)

Para stack traces legíveis em produção:

```yaml
# GitHub Actions example
- name: Upload Sourcemaps
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: chefiapp
    SENTRY_PROJECT: merchant-portal
  run: npm run build
```

O plugin Vite já está configurado para upload automático quando:
- `SENTRY_AUTH_TOKEN` está definido
- Modo é `production`

---

## VARIÁVEIS DE AMBIENTE

### Desenvolvimento (opcional)

```bash
# .env.development (opcional - sem Sentry em dev)
VITE_SENTRY_DSN=
```

### Produção (obrigatório)

```bash
# .env.production
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Para CI/CD (upload sourcemaps)
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=chefiapp
SENTRY_PROJECT=merchant-portal
```

---

## FUNCIONALIDADES

### ErrorBoundary

Todas as aplicações têm ErrorBoundary que:
- Captura erros de React
- Envia automaticamente para Sentry
- Mostra UI amigável ao usuário
- Permite retry/reload

### Performance Monitoring

- **Traces** de navegação (page load, route changes)
- **Web Vitals** (LCP, FID, CLS)
- **Sample rate:** 10% em produção, 100% em desenvolvimento

### Session Replay

- Grava sessões onde erros ocorrem (100%)
- Grava amostra de sessões normais (10%)
- Útil para debugging visual

---

## DEBUGGING

### Ver Logs Locais

Em desenvolvimento, todos os logs aparecem no console:
```
[ERROR] Payment failed { orderId: '123' }
[WARN] Stock low { productId: '456' }
```

### Ver no Sentry Dashboard

1. Issues → Ver erros agrupados
2. Performance → Ver traces e métricas
3. Replays → Ver gravações de sessão

---

## CHECKLIST DE PRODUÇÃO

- [ ] DSN configurado para cada ambiente
- [ ] Alertas configurados no Sentry
- [ ] Sourcemaps sendo uploaded no CI/CD
- [ ] ErrorBoundary envolvendo toda a aplicação
- [ ] Contexto de usuário sendo setado após login

---

---

## PARTE 2: DASHBOARD DE MÉTRICAS

### Componentes

**Hook:** `merchant-portal/src/hooks/useRealtimeMetrics.ts`

**Widget:** `merchant-portal/src/components/Dashboard/OperationalMetricsWidget.tsx`

### Métricas Disponíveis

| Métrica | Descrição | Atualização |
|---------|-----------|-------------|
| **Receita do Dia** | Total faturado hoje | Tempo real |
| **Pedidos do Dia** | Quantidade de pedidos | Tempo real |
| **Ticket Médio** | Receita / Pedidos | Tempo real |
| **Pedidos/Hora** | Média desde abertura | Tempo real |
| **Pedidos Abertos** | Não finalizados | Tempo real |
| **vs. Ontem** | Comparação % | Tempo real |
| **Pedidos por Hora** | Gráfico sparkline | Tempo real |

### Funcionamento

1. **Busca inicial** dos dados do Supabase
2. **Subscription Realtime** na tabela `gm_orders`
3. **Polling fallback** a cada 30 segundos
4. **Recálculo automático** em qualquer mudança

### Uso

O widget já está integrado no Dashboard (`DashboardZero.tsx`).

Para usar em outro lugar:

```tsx
import { OperationalMetricsWidget } from '@/components/Dashboard/OperationalMetricsWidget';

// Em qualquer página
<OperationalMetricsWidget />
```

Para usar apenas o hook (dados brutos):

```tsx
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';

const { metrics, loading, error, refresh } = useRealtimeMetrics();

// metrics.totalRevenue
// metrics.ordersPerHour
// metrics.hourlyOrders
```

---

## PARTE 3: LOGGING CENTRALIZADO

### Níveis de Log

| Nível | Destino | Quando Usar |
|-------|---------|-------------|
| `debug` | Console (dev) | Debugging detalhado |
| `info` | Console | Fluxo normal |
| `warn` | Console + Sentry + DB | Situação anômala |
| `error` | Console + Sentry + DB | Erro recuperável |
| `critical` | Console + Sentry + DB + Alerta | Erro grave |

### Boas Práticas

```typescript
// ✅ BOM: Contexto rico
Logger.error('Payment failed', error, { 
  orderId, 
  amount, 
  paymentMethod 
});

// ❌ RUIM: Sem contexto
Logger.error('Payment failed');

// ✅ BOM: Breadcrumbs antes de ações
addBreadcrumb('Starting checkout', 'payment', { cartTotal });
// ... processo de pagamento ...
Logger.info('Payment completed', { orderId });
```

---

**ÚLTIMA ATUALIZAÇÃO:** 2026-01-24
