# 📊 Monitoramento - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ Implementado

---

## 🎯 VISÃO GERAL

O ChefIApp usa **Sentry** para captura de erros e logging estruturado. Todos os erros críticos são automaticamente capturados, alertados e acessíveis para debugging.

---

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente

Configure o DSN do Sentry em `.env`:

```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

Ou em `app.json`:

```json
{
  "expo": {
    "extra": {
      "sentryDsn": "https://your-sentry-dsn@sentry.io/project-id"
    }
  }
}
```

### Instalação

O Sentry já está instalado via `package.json`:

```json
"@sentry/react-native": "^5.34.0"
```

---

## 📝 USO DO SERVIÇO DE LOGGING

### Importar

```typescript
import { logError, logEvent, setUserContext, addBreadcrumb } from '@/services/logging';
```

### Logar Erros

```typescript
try {
  // código que pode falhar
} catch (error) {
  logError(error, {
    action: 'nomeDaAcao',
    userId: user?.id,
    orderId: order?.id,
    // contexto adicional
  });
}
```

### Logar Eventos

```typescript
logEvent('payment_processed', {
  orderId: order.id,
  amount: order.total,
  method: 'credit_card',
});
```

### Definir Contexto do Usuário

```typescript
// Ao fazer login
setUserContext(userId, restaurantId);

// Ao fazer logout
clearUserContext();
```

### Adicionar Breadcrumbs

```typescript
addBreadcrumb('User clicked payment button', 'user_action', {
  orderId: order.id,
});
```

---

## 🔍 ACESSO AOS LOGS

### Sentry Dashboard

1. Acesse: https://sentry.io
2. Faça login na sua conta
3. Selecione o projeto ChefIApp
4. Veja erros em tempo real

### Filtros Úteis

- **Por ambiente:** `environment:production` ou `environment:development`
- **Por usuário:** `user.id:user-id`
- **Por ação:** `context.action:action-name`
- **Por nível:** `level:error` ou `level:warning`

---

## 📊 MÉTRICAS E ALERTAS

### Métricas Disponíveis

- **Taxa de erros:** Erros por minuto/hora
- **Erros únicos:** Quantidade de erros diferentes
- **Taxa de resolução:** Quantos erros foram resolvidos
- **Tempo médio de resposta:** Tempo para resolver erros

### Configurar Alertas

1. No Sentry Dashboard, vá em **Alerts**
2. Crie um novo alerta:
   - **Condição:** Erros > 10 em 5 minutos
   - **Ação:** Enviar email/Slack
   - **Destinatários:** Equipe de desenvolvimento

---

## 🐛 DEBUGGING

### Breadcrumbs

Breadcrumbs mostram as últimas ações antes de um erro:

```
1. User clicked payment button
2. Payment API called
3. Network error occurred
```

### Contexto

Cada erro inclui contexto relevante:

```json
{
  "action": "processPayment",
  "orderId": "123",
  "method": "credit_card",
  "userId": "user-456"
}
```

### Stack Traces

Stack traces completos estão disponíveis no Sentry para debugging.

---

## 🔒 SEGURANÇA

### Dados Sensíveis

**NÃO logar:**
- Senhas
- Tokens de autenticação
- Dados de cartão de crédito completos
- Informações pessoais sensíveis (PII)

**Pode logar:**
- IDs (orderId, userId, etc.)
- Ações do usuário
- Erros técnicos
- Metadados não sensíveis

### LGPD/GDPR

O Sentry está configurado para:
- Não capturar dados pessoais sensíveis
- Permitir exclusão de dados sob demanda
- Respeitar políticas de privacidade

---

## 📈 DASHBOARD SUPABASE (OPCIONAL)

### Queries Lentas

Para monitorar queries lentas no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **Database** > **Performance**
3. Veja queries com tempo > 500ms

### Erros do Backend

1. Acesse o Supabase Dashboard
2. Vá em **Logs** > **Postgres Logs**
3. Filtre por nível de erro

---

## 🧪 TESTES

### Testar Captura de Erros

```typescript
// Forçar um erro para testar
throw new Error('Test error');
```

O erro deve aparecer no Sentry em < 1 minuto.

### Testar Breadcrumbs

```typescript
addBreadcrumb('Test breadcrumb', 'test');
throw new Error('Test error');
```

Verifique no Sentry que o breadcrumb aparece antes do erro.

---

## 📚 REFERÊNCIAS

- **Sentry Docs:** https://docs.sentry.io/platforms/react-native/
- **Serviço de Logging:** `mobile-app/services/logging.ts`
- **ErrorBoundary:** `mobile-app/components/ErrorBoundary.tsx`

---

## 🔄 MANUTENÇÃO

### Atualizar Sentry

```bash
cd mobile-app
npm update @sentry/react-native
```

### Verificar Configuração

1. Verificar se DSN está configurado
2. Testar captura de erro
3. Verificar breadcrumbs
4. Validar alertas

---

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ Implementado
