# 🔧 TASK-1.1.1: REVISÃO TÉCNICA
## Passar txId para saveOrder

**Data:** 2026-01-20  
**Status:** 🔴 Pronto para Execução  
**Estimativa:** 0.5 dias  
**Dependências:** Nenhuma

---

## 📋 OBJETIVO

Modificar `saveOrder` para aceitar `txId` opcional. Se `txId` presente, salvar na transação. Se ausente, salvar direto (compatibilidade backward).

---

## 🔍 ANÁLISE DO CÓDIGO ATUAL

### Arquivo: `core-engine/repo/InMemoryRepo.ts`

**Método atual (linha ~120-130):**
```typescript
saveOrder(order: Order): void {
  // Salva direto no Map, sem suporte a transação
  this.orders.set(order.id, order);
}
```

**Problema:**
- Não aceita `txId`
- Não salva na transação
- Não permite rollback

**Método `saveSession` atual (linha ~110-120):**
```typescript
saveSession(session: Session, txId?: string): void {
  if (txId) {
    const tx = this.transactions.get(txId);
    if (tx) {
      const key = `SESSION:${session.id}`;
      if (!tx.snapshot.has(key)) {
        tx.snapshot.set(key, this.sessions.get(session.id));
      }
      tx.changes.set(key, { ...session, version: session.version + 1 });
    }
  } else {
    this.sessions.set(session.id, session);
  }
}
```

**Observação:** `saveSession` já tem suporte a `txId`! Podemos usar como referência.

---

## ✅ IMPLEMENTAÇÃO NECESSÁRIA

### Mudança 1: Modificar assinatura de `saveOrder`

**Antes:**
```typescript
saveOrder(order: Order): void {
  this.orders.set(order.id, order);
}
```

**Depois:**
```typescript
saveOrder(order: Order, txId?: string): void {
  if (txId) {
    const tx = this.transactions.get(txId);
    if (!tx) {
      throw new Error(`Transaction ${txId} not found`);
    }
    const key = `ORDER:${order.id}`;
    // Snapshot: salvar estado atual se ainda não foi salvo
    if (!tx.snapshot.has(key)) {
      tx.snapshot.set(key, this.orders.get(order.id));
    }
    // Changes: salvar mudança na transação
    tx.changes.set(key, { ...order, version: order.version + 1 });
  } else {
    // Backward compatibility: salvar direto se não há txId
    this.orders.set(order.id, order);
  }
}
```

### Mudança 2: Verificar que `commit` já suporta ORDER

**Arquivo:** `core-engine/repo/InMemoryRepo.ts` (linha 46-48)

**Código atual:**
```typescript
case "ORDER":
  this.orders.set(id, value as Order);
  break;
```

**Status:** ✅ Já implementado! Não precisa mudar.

---

## 🧪 TESTE NECESSÁRIO

### Arquivo: `core-engine/tests/repo/InMemoryRepo.test.ts` (criar se não existir)

```typescript
import { describe, it, expect } from 'vitest';
import { InMemoryRepo } from '../../repo/InMemoryRepo';
import type { Order } from '../../repo/types';

describe('InMemoryRepo.saveOrder', () => {
  it('should save order directly when txId is not provided', () => {
    const repo = new InMemoryRepo();
    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 0,
    };

    repo.saveOrder(order);

    const saved = repo.getOrder('order-1');
    expect(saved).toBeDefined();
    expect(saved?.id).toBe('order-1');
  });

  it('should save order in transaction when txId is provided', () => {
    const repo = new InMemoryRepo();
    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 0,
    };

    const txId = repo.beginTransaction();
    repo.saveOrder(order, txId);

    // Order should NOT be in main storage yet
    const beforeCommit = repo.getOrder('order-1');
    expect(beforeCommit).toBeUndefined();

    // After commit, order should be saved
    await repo.commit(txId);
    const afterCommit = repo.getOrder('order-1');
    expect(afterCommit).toBeDefined();
    expect(afterCommit?.id).toBe('order-1');
  });

  it('should create snapshot when saving in transaction', () => {
    const repo = new InMemoryRepo();
    
    // Create initial order
    const initialOrder: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 1000,
    };
    repo.saveOrder(initialOrder);

    // Start transaction and modify
    const txId = repo.beginTransaction();
    const modifiedOrder: Order = {
      ...initialOrder,
      total_cents: 2000,
      version: 2,
    };
    repo.saveOrder(modifiedOrder, txId);

    // Snapshot should contain original
    const tx = (repo as any).transactions.get(txId);
    expect(tx).toBeDefined();
    expect(tx.snapshot.has('ORDER:order-1')).toBe(true);
    const snapshot = tx.snapshot.get('ORDER:order-1');
    expect(snapshot.total_cents).toBe(1000); // Original value

    // Changes should contain modified
    expect(tx.changes.has('ORDER:order-1')).toBe(true);
    const change = tx.changes.get('ORDER:order-1');
    expect(change.total_cents).toBe(2000); // Modified value
  });

  it('should throw error if txId does not exist', () => {
    const repo = new InMemoryRepo();
    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 0,
    };

    expect(() => {
      repo.saveOrder(order, 'invalid-tx-id');
    }).toThrow('Transaction invalid-tx-id not found');
  });

  it('should increment version when saving in transaction', () => {
    const repo = new InMemoryRepo();
    const order: Order = {
      id: 'order-1',
      session_id: 'session-1',
      state: 'OPEN',
      version: 1,
      total_cents: 0,
    };

    const txId = repo.beginTransaction();
    repo.saveOrder(order, txId);

    const tx = (repo as any).transactions.get(txId);
    const change = tx.changes.get('ORDER:order-1');
    expect(change.version).toBe(2); // Incremented
  });
});
```

---

## ✅ CRITÉRIO DE PRONTO

### Checklist Objetivo:

- [ ] **Código:** `saveOrder(order: Order, txId?: string)` aceita `txId` opcional
- [ ] **Código:** Se `txId` presente, salva em `tx.changes`
- [ ] **Código:** Se `txId` ausente, salva direto (backward compatible)
- [ ] **Código:** Snapshot é criado se não existe
- [ ] **Código:** Versão é incrementada ao salvar na transação
- [ ] **Código:** Erro é lançado se `txId` não existe
- [ ] **Teste:** Teste unitário passa (5 testes acima)
- [ ] **Teste:** Teste de rollback funciona (ver TASK-1.1.8)

---

## 🎯 ORDEM DE EXECUÇÃO

1. **Modificar `saveOrder`** (15 minutos)
   - Adicionar parâmetro `txId?: string`
   - Implementar lógica de transação (copiar de `saveSession`)
   - Manter backward compatibility

2. **Escrever testes** (30 minutos)
   - Criar arquivo de teste
   - Implementar 5 testes acima
   - Executar e verificar que passam

3. **Validar** (15 minutos)
   - Executar todos os testes do repositório
   - Verificar que não quebrou nada existente
   - Commit pequeno e focado

**Total:** ~1 hora (0.5 dias conforme estimativa)

---

## 🔗 PRÓXIMAS TAREFAS (Desbloqueadas)

Após TASK-1.1.1 completa:
- ✅ TASK-1.1.2: Passar txId para saveSession (já tem, validar)
- ✅ TASK-1.1.3: Passar txId para savePayment
- ✅ TASK-1.1.4: Modificar calculateTotal para usar txId

---

## 📝 NOTAS TÉCNICAS

### Por que snapshot?
- Permite rollback: se transação falhar, podemos restaurar estado original
- Evita lost updates: podemos comparar versão atual com snapshot

### Por que incrementar version?
- Implementa optimistic locking
- Permite detectar conflitos de concorrência (ver TASK-1.3.1)

### Por que backward compatibility?
- Código existente que chama `saveOrder(order)` sem `txId` continua funcionando
- Permite migração gradual

---

**Documento Criado:** 2026-01-20  
**Status:** ✅ **PRONTO PARA EXECUÇÃO** - Código, testes e critérios definidos  
**Próximo Passo:** Implementar e testar
