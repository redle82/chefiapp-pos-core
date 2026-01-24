# 📊 Monitoring & Logging - ChefIApp

**Guia de monitoramento e logging em produção**

---

## 🎯 Objetivos

### Métricas Principais
- **Disponibilidade:** > 99.9%
- **Tempo de resposta:** < 2s (p95)
- **Taxa de erro:** < 0.1%
- **Uptime:** > 99.5%

### KPIs de Negócio
- **Tempo de pagamento:** < 5s
- **Taxa de conversão:** > 85%
- **Satisfação do usuário:** > 4.5/5

---

## 📈 Métricas a Monitorar

### Performance
```typescript
// Tempo de pagamento
const startTime = performance.now();
await quickPay(orderId, method);
const duration = performance.now() - startTime;

// Log
console.log('fast_pay_duration', {
  orderId,
  duration,
  method,
  timestamp: new Date().toISOString()
});
```

### Erros
```typescript
// Capturar erros
try {
  await processPayment();
} catch (error) {
  // Log estruturado
  logger.error('payment_error', {
    error: error.message,
    stack: error.stack,
    orderId,
    userId,
    timestamp: new Date().toISOString()
  });
}
```

### Eventos de Negócio
```typescript
// Eventos importantes
logger.info('order_created', {
  orderId,
  tableId,
  total,
  itemCount: order.items.length,
  timestamp: new Date().toISOString()
});

logger.info('payment_processed', {
  orderId,
  amount,
  method,
  duration,
  timestamp: new Date().toISOString()
});
```

---

## 🔍 Logging

### Estrutura de Logs

```typescript
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: {
    userId?: string;
    orderId?: string;
    tableId?: string;
    [key: string]: any;
  };
  timestamp: string;
  environment: 'development' | 'staging' | 'production';
}
```

### Níveis de Log

```typescript
// DEBUG: Desenvolvimento
logger.debug('state_update', { state });

// INFO: Eventos normais
logger.info('order_created', { orderId });

// WARN: Avisos
logger.warn('slow_payment', { duration: 6000 });

// ERROR: Erros
logger.error('payment_failed', { error, orderId });
```

### Implementação

```typescript
// services/logger.ts
class Logger {
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  private log(level: string, message: string, context: any) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      environment: this.environment
    };

    // Em desenvolvimento: console
    if (this.environment === 'development') {
      console[level](message, context);
    }

    // Em produção: enviar para serviço
    if (this.environment === 'production') {
      this.sendToService(entry);
    }
  }

  debug(message: string, context?: any) {
    this.log('debug', message, context);
  }

  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  error(message: string, context?: any) {
    this.log('error', message, context);
  }

  private async sendToService(entry: LogEntry) {
    // Enviar para serviço de logs (Sentry, LogRocket, etc.)
    await logService.send(entry);
  }
}

export const logger = new Logger();
```

---

## 🚨 Alertas

### Configuração de Alertas

```typescript
// Alertas críticos
const alerts = {
  // Crash
  crash: {
    threshold: 1,
    window: '5m',
    action: 'notify_team'
  },

  // Performance
  slow_payment: {
    threshold: 5000, // 5s
    window: '1m',
    action: 'log_warning'
  },

  // Erros
  error_rate: {
    threshold: 0.05, // 5%
    window: '5m',
    action: 'notify_team'
  },

  // Disponibilidade
  downtime: {
    threshold: 0,
    window: '1m',
    action: 'notify_emergency'
  }
};
```

### Implementação

```typescript
// services/alerts.ts
class AlertService {
  async checkAlerts(metric: string, value: number) {
    const alert = alerts[metric];
    if (!alert) return;

    if (value > alert.threshold) {
      await this.triggerAlert(metric, value, alert.action);
    }
  }

  private async triggerAlert(
    metric: string,
    value: number,
    action: string
  ) {
    switch (action) {
      case 'notify_team':
        await this.notifyTeam(metric, value);
        break;
      case 'notify_emergency':
        await this.notifyEmergency(metric, value);
        break;
      case 'log_warning':
        logger.warn(`alert_${metric}`, { value });
        break;
    }
  }
}
```

---

## 📊 Dashboards

### Métricas de Performance

```typescript
// Dashboard: Performance
const performanceMetrics = {
  fastPayDuration: {
    avg: '< 5s',
    p95: '< 7s',
    p99: '< 10s'
  },
  renderTime: {
    avg: '< 2s',
    p95: '< 3s'
  },
  apiResponse: {
    avg: '< 500ms',
    p95: '< 1s'
  }
};
```

### Métricas de Negócio

```typescript
// Dashboard: Negócio
const businessMetrics = {
  paymentsPerHour: 'count',
  averageOrderValue: 'avg',
  conversionRate: 'percentage',
  tableTurnover: 'count'
};
```

### Métricas de Sistema

```typescript
// Dashboard: Sistema
const systemMetrics = {
  cpuUsage: 'percentage',
  memoryUsage: 'mb',
  networkLatency: 'ms',
  errorRate: 'percentage'
};
```

---

## 🔐 Logs Sensíveis

### O Que NÃO Logar

```typescript
// ❌ NUNCA logar
const sensitiveData = {
  password: '***',
  creditCard: '***',
  cvv: '***',
  token: '***',
  apiKey: '***'
};

// ✅ Logar apenas metadados
logger.info('payment_processed', {
  orderId,
  amount,
  method,
  // Sem dados sensíveis
});
```

### Sanitização

```typescript
const sanitizeLog = (data: any): any => {
  const sensitive = ['password', 'token', 'cvv', 'cardNumber'];
  
  return Object.keys(data).reduce((acc, key) => {
    if (sensitive.includes(key)) {
      acc[key] = '***';
    } else {
      acc[key] = data[key];
    }
    return acc;
  }, {} as any);
};
```

---

## 🛠️ Ferramentas

### Recomendadas

1. **Sentry:** Error tracking
2. **LogRocket:** Session replay
3. **Mixpanel:** Analytics
4. **Datadog:** APM e logs
5. **Firebase Analytics:** Mobile analytics

### Setup Básico

```typescript
// Sentry
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2
});

// LogRocket
import LogRocket from 'logrocket';
LogRocket.init(process.env.LOGROCKET_APP_ID);
```

---

## 📋 Checklist de Monitoramento

### Setup
- [ ] Logger configurado
- [ ] Alertas configurados
- [ ] Dashboards criados
- [ ] Ferramentas integradas

### Métricas
- [ ] Performance monitorada
- [ ] Erros rastreados
- [ ] Eventos de negócio logados
- [ ] KPIs definidos

### Alertas
- [ ] Crash alerts
- [ ] Performance alerts
- [ ] Error rate alerts
- [ ] Availability alerts

### Segurança
- [ ] Dados sensíveis não logados
- [ ] Logs sanitizados
- [ ] Acesso restrito
- [ ] Retenção configurada

---

## 📚 Recursos

- **Métricas:** `docs/METRICAS_KPIS.md`
- **Performance:** `docs/PERFORMANCE_OPTIMIZATION.md`
- **Security:** `docs/SECURITY_BEST_PRACTICES.md`

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
