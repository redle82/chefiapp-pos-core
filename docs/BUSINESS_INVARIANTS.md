# ⚖️ BUSINESS INVARIANTS — ChefIApp

> **Regras de negócio que NUNCA podem ser violadas, independente do estado da rede, da UI, ou do dispositivo.**

---

## 🎯 Propósito

Este documento define as **invariantes absolutas** do sistema ChefIApp.

Estas regras:

- São verificadas no **backend** (DATABASE_AUTHORITY)
- **Não dependem** do client para enforcement
- São **imutáveis** em qualquer contexto
- Definem o que significa "sistema correto"

---

## 🔴 INVARIANTES ABSOLUTAS

### 1. Integridade de Pedidos

| ID          | Invariante                                                   | Enforcement         |
| ----------- | ------------------------------------------------------------ | ------------------- |
| **ORD-001** | Um pedido não pode existir sem `restaurant_id` válido        | FK constraint + RLS |
| **ORD-002** | Um pedido não pode ter `total < 0`                           | CHECK constraint    |
| **ORD-003** | Um pedido fechado (`status = 'closed'`) é **imutável**       | Trigger + RLS       |
| **ORD-004** | Itens só podem ser adicionados a pedidos `open` ou `pending` | Trigger             |
| **ORD-005** | `idempotency_key` garante criação única                      | UNIQUE constraint   |

### 2. Integridade de Pagamentos

| ID          | Invariante                                            | Enforcement                |
| ----------- | ----------------------------------------------------- | -------------------------- |
| **PAY-001** | Um pagamento não pode ser aplicado duas vezes         | `idempotency_key` UNIQUE   |
| **PAY-002** | Soma de pagamentos nunca pode exceder total do pedido | Trigger                    |
| **PAY-003** | Pedido só fecha quando `sum(payments) >= total`       | CHECK no status transition |
| **PAY-004** | Pagamento negativo é **impossível**                   | CHECK constraint           |
| **PAY-005** | Estorno cria novo registro, não deleta original       | Append-only policy         |

### 3. Integridade de Itens

| ID          | Invariante                                     | Enforcement              |
| ----------- | ---------------------------------------------- | ------------------------ |
| **ITM-001** | Um item não pode existir sem `order_id` válido | FK constraint            |
| **ITM-002** | `quantity` sempre > 0                          | CHECK constraint         |
| **ITM-003** | `unit_price` sempre >= 0                       | CHECK constraint         |
| **ITM-004** | Item de pedido fechado é **imutável**          | Trigger via order status |

### 4. Integridade de Mesas

| ID          | Invariante                                                   | Enforcement          |
| ----------- | ------------------------------------------------------------ | -------------------- |
| **TBL-001** | Mesa com pedido `open` não pode ser marcada como `available` | Trigger              |
| **TBL-002** | Apenas um pedido `open` por mesa por vez                     | UNIQUE partial index |
| **TBL-003** | Transferência de mesa preserva histórico                     | Append event log     |

### 5. Integridade de Usuários e RBAC

| ID          | Invariante                                          | Enforcement           |
| ----------- | --------------------------------------------------- | --------------------- |
| **USR-001** | Ação requer `role` válido verificado no backend     | RLS policies          |
| **USR-002** | `waiter` não pode executar ações de `manager`       | RLS + function checks |
| **USR-003** | `owner` tem acesso total ao próprio `restaurant_id` | RLS                   |
| **USR-004** | Nenhum usuário acessa dados de outro restaurante    | RLS tenant isolation  |

### 6. Integridade Financeira

| ID          | Invariante                                          | Enforcement            |
| ----------- | --------------------------------------------------- | ---------------------- |
| **FIN-001** | Fechamento de caixa é **irreversível**              | Status transition lock |
| **FIN-002** | Valores financeiros fechados são **imutáveis**      | Trigger                |
| **FIN-003** | Offline não pode alterar financeiro já sincronizado | Conflict policy        |
| **FIN-004** | Toda transação financeira tem `audit_trail`         | Append-only log        |

### 7. Integridade de Sincronização

| ID          | Invariante                                             | Enforcement                 |
| ----------- | ------------------------------------------------------ | --------------------------- |
| **SYN-001** | Backend é **sempre** a fonte da verdade final          | DATABASE_AUTHORITY          |
| **SYN-002** | Evento offline só é válido após confirmação do backend | Optimistic UI + backend ack |
| **SYN-003** | Conflito nunca resulta em perda silenciosa             | Conflict log obrigatório    |
| **SYN-004** | Replay de eventos respeita ordem cronológica           | `created_at` ordering       |

---

## 🟡 INVARIANTES CONDICIONAIS

> Regras que dependem de contexto mas ainda são enforced no backend.

| ID          | Condição                                      | Invariante                            |
| ----------- | --------------------------------------------- | ------------------------------------- |
| **CND-001** | Se `restaurant.requires_payment_first = true` | Pedido não vai para KDS sem pagamento |
| **CND-002** | Se `shift.is_closed = true`                   | Novos pedidos rejeitados              |
| **CND-003** | Se `item.requires_preparation = true`         | Item aparece no KDS                   |
| **CND-004** | Se `order.source = 'delivery'`                | Regras de delivery aplicadas          |

---

## 🛡️ Enforcement Matrix

| Camada                       | Responsabilidade                                     |
| ---------------------------- | ---------------------------------------------------- |
| **Database (PostgreSQL)**    | CHECK, FK, UNIQUE, Triggers, RLS                     |
| **Backend (Edge Functions)** | Business logic validation                            |
| **Client (React/Expo)**      | Feedback visual, validação prévia (não autoritativa) |
| **Sync Engine**              | Conflict detection, replay ordering                  |

---

## ⚠️ Violação = Bug Crítico

Se alguma invariante for violada:

1. É um **bug crítico** (não "feature request")
2. Deve parar o desenvolvimento até correção
3. Requer postmortem documentado
4. Pode indicar falha de arquitetura

---

## 📚 Referências

- [ENGINEERING_CONSTITUTION.md](../ENGINEERING_CONSTITUTION.md)
- [DATABASE_AUTHORITY principle](../architecture/DATABASE_AUTHORITY.md)
- [UNIVERSAL_TEST_PLAN.md](./testing/UNIVERSAL_TEST_PLAN.md)
