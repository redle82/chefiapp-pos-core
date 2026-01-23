# 🔒 Security Best Practices - ChefIApp

**Guia de segurança e melhores práticas**

---

## 🎯 Princípios de Segurança

### 1. Defense in Depth
Múltiplas camadas de proteção

### 2. Least Privilege
Acesso mínimo necessário

### 3. Fail Secure
Em caso de erro, sistema permanece seguro

### 4. Never Trust Client
Sempre validar no servidor

---

## 🔐 Autenticação e Autorização

### 1. Supabase RLS (Row Level Security)
```sql
-- ✅ Política: Usuários só veem pedidos do seu restaurante
CREATE POLICY "Users see own restaurant orders"
ON gm_orders FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM gm_staff 
    WHERE user_id = auth.uid()
  )
);
```

### 2. Validação de Roles
```typescript
// ✅ Sempre validar role no servidor
const { data, error } = await supabase.rpc('process_payment', {
  order_id: orderId,
  amount: total
});

// RPC valida internamente:
// - Usuário autenticado
// - Role adequada (waiter, manager, owner)
// - Permissões corretas
```

### 3. Tokens e Sessões
```typescript
// ✅ Tokens gerenciados pelo Supabase
const { data: { session } } = await supabase.auth.getSession();

// Verificar expiração
if (!session || session.expires_at < Date.now() / 1000) {
  // Reautenticar
  await supabase.auth.refreshSession();
}
```

---

## 🛡️ Proteção de Dados

### 1. Dados Sensíveis
```typescript
// ❌ NUNCA armazenar dados sensíveis no cliente
// ❌ NUNCA fazer:
const creditCard = {
  number: '1234-5678-9012-3456',
  cvv: '123'
};
await AsyncStorage.setItem('card', JSON.stringify(creditCard));

// ✅ SEMPRE usar tokens/PII no servidor
// ✅ Dados locais apenas temporários e criptografados
```

### 2. AsyncStorage Seguro
```typescript
// ✅ Usar apenas para dados não-sensíveis
// Waitlist: OK (não é PII crítico)
await AsyncStorage.setItem('waitlist', JSON.stringify(entries));

// ❌ NUNCA armazenar:
// - Senhas
// - Tokens de pagamento
// - Dados de cartão
// - Informações pessoais sensíveis
```

### 3. Criptografia de Dados
```typescript
// ✅ Para dados sensíveis locais, usar criptografia
import * as SecureStore from 'expo-secure-store';

// Armazenar token de forma segura
await SecureStore.setItemAsync('auth_token', token);

// Recuperar
const token = await SecureStore.getItemAsync('auth_token');
```

---

## 🌐 Segurança de Rede

### 1. HTTPS Only
```typescript
// ✅ Supabase usa HTTPS por padrão
// ✅ Nunca fazer requisições HTTP para APIs

// Verificar em produção
if (__DEV__) {
  console.warn('Development mode - verify HTTPS in production');
}
```

### 2. Validação de Certificados
```typescript
// ✅ React Native valida certificados SSL automaticamente
// ✅ Em produção, nunca desabilitar validação SSL
```

### 3. Rate Limiting
```typescript
// ✅ Implementar no servidor (Supabase Edge Functions)
// Limitar requisições por usuário/IP

// Exemplo: Max 10 pagamentos por minuto
const rateLimit = {
  maxRequests: 10,
  windowMs: 60 * 1000
};
```

---

## 💳 Segurança de Pagamentos

### 1. Idempotência
```typescript
// ✅ Sempre usar idempotency keys
const idempotencyKey = `${orderId}-${Date.now()}`;

const { data, error } = await supabase.rpc('process_payment', {
  order_id: orderId,
  amount: total,
  method: method,
  idempotency_key: idempotencyKey
});

// Servidor verifica se já processou este pagamento
```

### 2. Validação de Valores
```typescript
// ✅ Sempre validar valores no servidor
// ❌ NUNCA confiar em valores do cliente

// Cliente pode enviar:
const maliciousTotal = -100; // Tentativa de fraude

// Servidor deve validar:
// - Total > 0
// - Total <= order.total (com margem de erro)
// - Método de pagamento válido
```

### 3. Logs de Auditoria
```typescript
// ✅ Registrar todas as transações
await supabase.from('payment_logs').insert({
  order_id: orderId,
  amount: total,
  method: method,
  user_id: userId,
  timestamp: new Date().toISOString(),
  ip_address: clientIp, // Se disponível
  success: true
});
```

---

## 🔍 Validação de Input

### 1. Sanitização
```typescript
// ✅ Sempre sanitizar inputs
const sanitizeInput = (input: string) => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover HTML tags
    .substring(0, 100); // Limitar tamanho
};

const customerName = sanitizeInput(nameInput);
```

### 2. Validação de Tipos
```typescript
// ✅ Validar tipos antes de processar
const validateOrder = (order: any): order is Order => {
  return (
    typeof order.id === 'string' &&
    typeof order.total === 'number' &&
    order.total > 0 &&
    Array.isArray(order.items) &&
    order.items.length > 0
  );
};

if (!validateOrder(order)) {
  throw new Error('Invalid order format');
}
```

### 3. Validação de Negócio
```typescript
// ✅ Validar regras de negócio
const validatePayment = (order: Order, amount: number) => {
  // 1. Pedido existe e está aberto
  if (order.status === 'paid') {
    throw new Error('Order already paid');
  }
  
  // 2. Valor correto (com margem de 0.01 para arredondamento)
  if (Math.abs(amount - order.total) > 0.01) {
    throw new Error('Amount mismatch');
  }
  
  // 3. Método válido
  const validMethods = ['cash', 'card', 'pix'];
  if (!validMethods.includes(method)) {
    throw new Error('Invalid payment method');
  }
};
```

---

## 🚨 Tratamento de Erros Seguro

### 1. Não Expor Detalhes
```typescript
// ❌ NUNCA expor detalhes internos
catch (error) {
  Alert.alert('Erro', error.message); // Pode expor SQL, paths, etc.
}

// ✅ Expor apenas mensagens genéricas
catch (error) {
  console.error('Payment error:', error); // Log completo
  Alert.alert('Erro', 'Falha ao processar pagamento. Tente novamente.');
}
```

### 2. Logs Seguros
```typescript
// ✅ Logs detalhados no servidor
// ❌ Nunca logar dados sensíveis

// ❌ NUNCA:
console.log('Payment:', { cardNumber, cvv, customerEmail });

// ✅ SEMPRE:
console.log('Payment processed:', {
  orderId,
  amount,
  method,
  timestamp
  // Sem dados sensíveis
});
```

---

## 🔐 Segurança de Código

### 1. Secrets e Env Vars
```typescript
// ✅ Usar variáveis de ambiente
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ❌ NUNCA hardcodar secrets
// ❌ NUNCA commitar .env com secrets
```

### 2. Dependências Seguras
```bash
# ✅ Verificar vulnerabilidades regularmente
npm audit

# ✅ Atualizar dependências
npm update

# ✅ Usar dependências confiáveis
# Preferir: mantidas ativamente, muitas stars, sem vulnerabilidades conhecidas
```

### 3. Code Review
```typescript
// ✅ Sempre revisar código de segurança
// Checklist:
// - [ ] Inputs validados
// - [ ] Outputs sanitizados
// - [ ] Secrets não expostos
// - [ ] Permissões corretas
// - [ ] Logs seguros
```

---

## 📱 Segurança Mobile

### 1. Root/Jailbreak Detection
```typescript
// ✅ Detectar dispositivos comprometidos (opcional)
import * as Device from 'expo-device';

// Em produção, considerar bloquear dispositivos rootados
if (Device.isRootedExperimental) {
  Alert.alert(
    'Dispositivo não suportado',
    'Por segurança, este app não funciona em dispositivos modificados.'
  );
}
```

### 2. Certificate Pinning (Opcional)
```typescript
// ✅ Para máxima segurança, considerar certificate pinning
// Implementar via expo-secure-store ou biblioteca especializada
```

### 3. Biometria (Futuro)
```typescript
// ✅ Para operações sensíveis, considerar biometria
import * as LocalAuthentication from 'expo-local-authentication';

const authenticate = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Autentique para processar pagamento',
    cancelLabel: 'Cancelar'
  });
  
  return result.success;
};
```

---

## 🔍 Checklist de Segurança

### Antes de Deploy
- [ ] RLS policies implementadas
- [ ] Inputs validados e sanitizados
- [ ] Secrets em variáveis de ambiente
- [ ] Logs não expõem dados sensíveis
- [ ] Erros não expõem detalhes internos
- [ ] Pagamentos com idempotência
- [ ] Validação de valores no servidor
- [ ] Auditoria de transações
- [ ] Dependências atualizadas (`npm audit`)
- [ ] HTTPS em todas as requisições
- [ ] Tokens gerenciados corretamente
- [ ] Permissões mínimas necessárias

---

## 🚨 Incident Response

### Em Caso de Breach
1. **Isolar:** Desabilitar acesso comprometido
2. **Investigar:** Identificar origem e escopo
3. **Notificar:** Avisar usuários afetados (se necessário)
4. **Corrigir:** Remover vulnerabilidade
5. **Monitorar:** Aumentar monitoramento
6. **Documentar:** Registrar incidente

### Contatos
- **Segurança:** security@chefiapp.com
- **Suporte:** support@chefiapp.com

---

## 📚 Recursos Adicionais

- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [React Native Security](https://reactnative.dev/docs/security)

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
