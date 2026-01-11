# ChefIApp POS Core - Testing Guide

> **"Teste só aquilo que está ativo, plugado e com responsabilidade definida."**

Este documento define o escopo correto de testes para o ChefIApp POS Core no estado atual (MVP Operacional).

---

## 🎯 Princípio-Mãe

**Teste só aquilo que está ativo, plugado e com responsabilidade definida.**

Tudo que depende de:
- ❌ Stripe
- ❌ Billing
- ❌ Subscription
- ❌ Merchant externo
- ❌ Webhook real

**NÃO deve ser testado agora**, porque:
- Ainda não é requisito funcional do MVP
- Ainda não está inicializado
- Ainda não gera valor no restaurante

---

## ✅ O QUE TESTAR AGORA (CORE OPERACIONAL)

### 1️⃣ Health & System Status

**O que testar:**
- ✅ `/health` retorna 200
- ✅ Resposta inclui status do banco de dados
- ✅ Event store está inicializado
- ✅ Core engine está disponível

**Por quê:**
- Valida que o sistema está operacional
- Confirma que dependências críticas estão funcionando
- Base para todos os outros testes

**Exemplo de teste:**
```bash
GET /health
Expected: 200 OK
Response: {
  "status": "ok",
  "database": "up",
  "event_store": "initialized",
  "core_engine": "available"
}
```

---

### 2️⃣ Event Store (O Coração do Sistema)

**O que testar:**
- ✅ Append de evento válido → 201
- ✅ Append de evento duplicado → 409 (idempotência)
- ✅ Replay de eventos produz estado consistente
- ✅ Ordem de eventos é garantida
- ✅ Hash chain mantém integridade

**Por quê:**
- Event Store é a fonte da verdade
- Qualquer falha aqui quebra todo o sistema
- Idempotência previne duplicação de fatos financeiros

**Nota:** Se não houver endpoints HTTP, testar diretamente via `EventStore` interface.

**Exemplo de teste:**
```typescript
// Teste de idempotência
const event1 = await eventStore.append(event);
const event2 = await eventStore.append(event); // Mesmo event_id
// event2 deve ser ignorado silenciosamente ou retornar 409
```

---

### 3️⃣ Order Lifecycle (Sem Pagamento)

**O que testar:**
1. ✅ Criar order → estado OPEN
2. ✅ Adicionar order_item → order aceita itens
3. ✅ Lock order → estado LOCKED, total calculado
4. ✅ Tentar modificar order LOCKED → rejeitado
5. ✅ Close order → estado CLOSED
6. ✅ Tentar modificar order CLOSED → rejeitado

**Fluxo esperado:**
```
OPEN → LOCKED → CLOSED
  ↓
CANCELED (terminal)
```

**Por quê:**
- Valida o sistema digestivo do restaurante
- Total calculado uma única vez (imutável)
- Estados terminais são respeitados

**Exemplo de teste:**
```bash
# 1. Criar order
POST /api/orders
Body: { "tableId": "mesa-1", "items": [...] }
Expected: 201, state: "OPEN"

# 2. Lock order
POST /api/orders/{orderId}/lock
Expected: 200, state: "LOCKED", total_cents: 5000

# 3. Tentar adicionar item (deve falhar)
PATCH /api/orders/{orderId}
Body: { "items": [...] }
Expected: 400, error: "ORDER_LOCKED"

# 4. Close order
POST /api/orders/{orderId}/close
Expected: 200, state: "CLOSED"
```

---

### 4️⃣ State Consistency (Determinismo)

**O que testar:**
- ✅ Estado reconstruído de eventos = estado atual
- ✅ Replay sempre produz mesmo resultado
- ✅ Sem drift entre projeções
- ✅ Eventos ordenados corretamente

**Por quê:**
- Garante que o sistema pode se recuperar de crashes
- Valida que eventos são a fonte da verdade
- Previne estados inconsistentes

**Exemplo de teste:**
```typescript
// 1. Executar operações
await createOrder();
await addItem();
await lockOrder();

// 2. Reconstruir estado do zero
const events = await eventStore.readAll();
const rebuiltState = rebuildState(events);

// 3. Comparar com estado atual
expect(rebuiltState).toEqual(currentState);
```

---

### 5️⃣ Session Management (Se Implementado)

**O que testar:**
- ✅ Session pode ser iniciada (INACTIVE → ACTIVE)
- ✅ Session pode ser fechada (ACTIVE → CLOSED)
- ✅ Session fechada não aceita novos orders
- ✅ Transições de estado são atômicas

**Por quê:**
- Sessions representam contexto operacional
- Valida que o sistema pode iniciar/fechar operações

**Nota:** Se não houver endpoints HTTP, testar via `CoreExecutor`.

---

## 🚫 O QUE NÃO TESTAR AGORA

### Explicitamente Fora de Escopo:

❌ **Stripe Webhooks**
- Requer STRIPE_WEBHOOK_SECRET configurado
- Requer Stripe CLI rodando
- Não é requisito do MVP operacional

❌ **Billing Webhooks**
- Requer billing service inicializado
- Não é core do restaurante

❌ **Payment Intent Creation**
- Requer Stripe API key
- Pagamento é Phase 2+

❌ **Subscription Management**
- Requer merchant records seedados
- Requer Stripe subscription configurado
- Não é core operacional

❌ **Payment Method Updates**
- Requer Stripe integration
- Não é requisito MVP

---

## 📊 Test Coverage Esperado

### Cobertura Mínima (MVP):

| Componente | Cobertura Esperada |
|------------|-------------------|
| Health Endpoints | 100% |
| Event Store | 100% |
| Order Lifecycle | 100% |
| State Consistency | 100% |
| Session Management | 100% (se implementado) |

### Cobertura Futura (Phase 2+):

| Componente | Quando Testar |
|------------|---------------|
| Payment Processing | Quando Stripe estiver configurado |
| Billing | Quando billing service estiver ativo |
| Subscriptions | Quando SaaS model estiver definido |

---

## 🧪 Como Executar Testes

### TestSprite (Recomendado para E2E)

```bash
# 1. Iniciar servidor
npm run server:web-module

# 2. Executar TestSprite
# (configurado para testar apenas CORE operacional)
```

### Testes Unitários (Jest)

```bash
# Testes do Core Engine
npm test core-engine

# Testes do Event Store
npm test event-log

# Testes de Constraints
npm test core.constraints
```

### Testes de Propriedade (Property-Based)

```bash
# Testes de invariantes financeiros
npm test property-based
```

---

## 📝 Checklist de Teste

Antes de executar testes, verificar:

- [ ] PostgreSQL está rodando
- [ ] Event store tables estão inicializadas
- [ ] **Restaurant ID seedado** (CRÍTICO - ver [CORE_TESTING_PREREQUISITES.md](./testsprite_tests/CORE_TESTING_PREREQUISITES.md))
- [ ] `WEB_MODULE_RESTAURANT_ID` configurado no `.env`
- [ ] Servidor web está rodando (porta 4320)
- [ ] Nenhuma dependência externa (Stripe, etc.) é necessária

### ⚠️ Pré-requisito Crítico: Restaurant ID

O CORE **não cria orders sem `restaurant_id` válido**. Isso é um **gate ontológico**, não um bug.

**Solução rápida:**
```bash
# 1. Seed o restaurante de teste
psql $DATABASE_URL -f migrations/99999999_00_test_restaurant_seed.sql

# 2. Configure .env
echo "WEB_MODULE_RESTAURANT_ID=00000000-0000-0000-0000-000000000001" >> .env
```

**Documentação completa:** [CORE_TESTING_PREREQUISITES.md](./testsprite_tests/CORE_TESTING_PREREQUISITES.md)

---

## 🎯 Critérios de Sucesso

Um teste passa se:

1. ✅ Endpoint responde com status code esperado
2. ✅ Estado transiciona corretamente
3. ✅ Eventos são gerados e armazenados
4. ✅ Replay produz estado consistente
5. ✅ Imutabilidade é respeitada

---

## 🔄 Próximos Passos

Quando o sistema evoluir para Phase 2+:

1. Adicionar testes de Payment Processing
2. Adicionar testes de Billing
3. Adicionar testes de Subscription Management
4. Adicionar testes de integração com Stripe

**Mas isso só acontece quando:**
- ✅ Core operacional está 100% testado
- ✅ Event Store está validado
- ✅ State consistency está garantida
- ✅ Sistema funciona sem pagamentos

---

## 📚 Referências

- [00_CORE_DEFINITION.md](../:blueprint/00_CORE_DEFINITION.md)
- [01_CORE_STATES.md](../:blueprint/01_CORE_STATES.md)
- [02_CORE_DATA_MODEL.md](../:blueprint/02_CORE_DATA_MODEL.md)
- [03_CORE_CONSTRAINTS.md](../:blueprint/03_CORE_CONSTRAINTS.md)
- [PUBLIC_API.md](../PUBLIC_API.md)
- [CORE_TESTING_PREREQUISITES.md](./testsprite_tests/CORE_TESTING_PREREQUISITES.md) - **Pré-requisitos obrigatórios**
- [SESSION_INFRASTRUCTURE.md](./testsprite_tests/SESSION_INFRASTRUCTURE.md) - Infraestrutura de sessão

---

**Última atualização:** 2025-12-27  
**Versão:** 1.0.0 (Core Operational Testing)

