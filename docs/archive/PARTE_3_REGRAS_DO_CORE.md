# 📋 PARTE 3: REGRAS DO CORE (Imutabilidade e Causalidade)

**Fonte:** `SYSTEM_TRUTH_CODEX.md`  
**Status:** ✅ Regras Inegociáveis

---

## 🎯 VISÃO GERAL

As regras do Core são **inegociáveis** e garantem a integridade financeira e operacional do sistema. Elas aplicam constraints formais que impedem estados inválidos e transições ilegais.

---

## ✅ REGRAS OBRIGATÓRIAS

### 1. Estados Financeiros Irreversíveis

**Regra:** Operações fechadas são imutáveis.

**Validação:**
- [ ] Operações fechadas não podem ser alteradas
- [ ] Database triggers bloqueiam UPDATE/DELETE em estados fechados
- [ ] Nenhum componente pode modificar operações fechadas
- [ ] **Validação:** Database triggers implementados

**Implementação:**
```sql
-- Exemplo de trigger (deve existir no banco)
CREATE TRIGGER prevent_update_closed_orders
BEFORE UPDATE ON gm_orders
FOR EACH ROW
WHEN (OLD.status = 'CLOSED')
EXECUTE FUNCTION raise_exception('Cannot update closed order');
```

**Checklist:**
- [ ] Trigger `prevent_update_closed_orders` existe
- [ ] Trigger `prevent_delete_closed_orders` existe
- [ ] Testes validam que UPDATE/DELETE falham em estados fechados

---

### 2. Sem Pagamento Sem Pedido Finalizado

**Regra:** Não pode haver pagamento sem pedido finalizado.

**Validação:**
- [ ] Pagamento só pode ser criado se pedido está finalizado
- [ ] Constraint no banco valida essa regra
- [ ] API valida antes de processar pagamento
- [ ] **Validação:** Constraint `CHECK` ou trigger no banco

**Implementação (CANONICAL - Usar TRIGGER, não CHECK):**
```sql
-- ⚠️ IMPORTANTE: CHECK com subquery não é recomendado em PostgreSQL
-- Use TRIGGER para regras inter-tabelas (mais confiável)

CREATE OR REPLACE FUNCTION enforce_payment_requires_finalized_order()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM gm_orders
    WHERE id = NEW.order_id
    AND status IN ('FINALIZED', 'CLOSED', 'PAID')
  ) THEN
    RAISE EXCEPTION 'Payment requires finalized order (order_id: %, status: %)', 
      NEW.order_id, 
      (SELECT status FROM gm_orders WHERE id = NEW.order_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_requires_finalized_order_trigger
BEFORE INSERT OR UPDATE ON gm_payments
FOR EACH ROW
EXECUTE FUNCTION enforce_payment_requires_finalized_order();
```

**Checklist:**
- [ ] Função `enforce_payment_requires_finalized_order()` existe
- [ ] Trigger `payment_requires_finalized_order_trigger` existe
- [ ] API valida antes de criar pagamento (defesa em profundidade)
- [ ] Testes validam que pagamento sem pedido finalizado falha

---

### 3. Sem Pedido Sem Sessão Ativa

**Regra:** Não pode haver pedido sem sessão ativa.

**Validação:**
- [ ] Pedido só pode ser criado se sessão está ativa
- [ ] Constraint no banco valida essa regra
- [ ] API valida antes de criar pedido
- [ ] **Validação:** Constraint `CHECK` ou trigger no banco

**Implementação (CANONICAL - Usar TRIGGER, não CHECK):**
```sql
-- ⚠️ IMPORTANTE: CHECK com subquery não é recomendado em PostgreSQL
-- Use TRIGGER para regras inter-tabelas (mais confiável)

CREATE OR REPLACE FUNCTION enforce_order_requires_active_session()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM gm_sessions
    WHERE id = NEW.session_id
    AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Order requires active session (session_id: %, status: %)', 
      NEW.session_id,
      (SELECT status FROM gm_sessions WHERE id = NEW.session_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_requires_active_session_trigger
BEFORE INSERT OR UPDATE ON gm_orders
FOR EACH ROW
EXECUTE FUNCTION enforce_order_requires_active_session();
```

**Checklist:**
- [ ] Função `enforce_order_requires_active_session()` existe
- [ ] Trigger `order_requires_active_session_trigger` existe
- [ ] API valida antes de criar pedido (defesa em profundidade)
- [ ] Testes validam que pedido sem sessão ativa falha

---

### 4. Sem Transições Escondidas

**Regra:** Todas as transições de estado devem ser explícitas e validadas.

**Validação:**
- [ ] Máquina de estado versionada (JSON)
- [ ] Executor tipado valida transições
- [ ] Nenhuma transição pode pular estados
- [ ] **Validação:** State machine implementada e validada

**Implementação:**
```typescript
// Exemplo de state machine (deve existir no código)
type OrderState = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CLOSED';

const VALID_TRANSITIONS: Record<OrderState, OrderState[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['CLOSED'],
  CLOSED: [], // Estado terminal
};

function canTransition(from: OrderState, to: OrderState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Checklist:**
- [ ] State machine definida (JSON ou TypeScript)
- [ ] Executor tipado valida transições
- [ ] Testes validam todas as transições válidas
- [ ] Testes validam que transições inválidas falham

---

### 5. Total Imutável Após LOCKED

**Regra:** Total não pode ser alterado após pedido estar LOCKED.

**Validação:**
- [ ] Total não pode ser modificado se status = 'LOCKED'
- [ ] Constraint no banco valida essa regra
- [ ] API valida antes de atualizar total
- [ ] **Validação:** Constraint `CHECK` ou trigger no banco

**Implementação:**
```sql
-- Exemplo de constraint (deve existir no banco)
ALTER TABLE gm_orders
ADD CONSTRAINT total_immutable_when_locked
CHECK (
  status != 'LOCKED' OR 
  (total = (SELECT total FROM gm_orders WHERE id = id))
);
```

**Checklist:**
- [ ] Constraint `total_immutable_when_locked` existe
- [ ] API valida antes de atualizar total
- [ ] Testes validam que atualização de total em LOCKED falha

---

### 6. Item Imutável Após LOCKED

**Regra:** Itens não podem ser alterados após pedido estar LOCKED.

**Validação:**
- [ ] Itens não podem ser modificados se pedido.status = 'LOCKED'
- [ ] Constraint no banco valida essa regra
- [ ] API valida antes de atualizar itens
- [ ] **Validação:** Constraint `CHECK` ou trigger no banco

**Implementação:**
```sql
-- Exemplo de trigger (deve existir no banco)
CREATE TRIGGER prevent_update_items_when_locked
BEFORE UPDATE OR DELETE ON gm_order_items
FOR EACH ROW
WHEN (
  EXISTS (
    SELECT 1 FROM gm_orders
    WHERE id = OLD.order_id
    AND status = 'LOCKED'
  )
)
EXECUTE FUNCTION raise_exception('Cannot modify items when order is locked');
```

**Checklist:**
- [ ] Trigger `prevent_update_items_when_locked` existe
- [ ] API valida antes de atualizar itens
- [ ] Testes validam que atualização de itens em LOCKED falha

---

## 🧪 VALIDAÇÕES TÉCNICAS

### Verificar Constraints no Banco

```sql
-- Listar todas as constraints relacionadas
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'gm_orders'::regclass
  AND conname LIKE '%immutable%' 
     OR conname LIKE '%locked%'
     OR conname LIKE '%closed%';
```

### Verificar Triggers no Banco

```sql
-- Listar todos os triggers relacionados
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'gm_orders'
  AND trigger_name LIKE '%prevent%'
     OR trigger_name LIKE '%immutable%';
```

### Verificar State Machine no Código

```bash
# Buscar state machine no código
grep -r "VALID_TRANSITIONS\|StateMachine\|state.*machine" merchant-portal/src --include="*.ts" --include="*.tsx"
```

---

## ✅ CHECKLIST COMPLETO

### Database Triggers (CANONICAL - Usar TRIGGERS, não CHECK)
- [ ] `prevent_update_closed_orders_trigger` existe
- [ ] `prevent_delete_closed_orders_trigger` existe
- [ ] `payment_requires_finalized_order_trigger` existe (TRIGGER, não CHECK)
- [ ] `order_requires_active_session_trigger` existe (TRIGGER, não CHECK)
- [ ] `prevent_total_change_when_locked_trigger` existe
- [ ] `prevent_item_update_when_order_locked_trigger` existe
- [ ] `prevent_item_delete_when_order_locked_trigger` existe

**Total esperado:** 7 triggers

### API Validations
- [ ] API valida antes de criar pagamento
- [ ] API valida antes de criar pedido
- [ ] API valida antes de atualizar total
- [ ] API valida antes de atualizar itens

### State Machine
- [ ] State machine definida (JSON ou TypeScript)
- [ ] Executor tipado valida transições
- [ ] Testes validam transições válidas
- [ ] Testes validam transições inválidas

### Testes
- [ ] Testes validam UPDATE/DELETE em estados fechados
- [ ] Testes validam pagamento sem pedido finalizado
- [ ] Testes validam pedido sem sessão ativa
- [ ] Testes validam atualização de total em LOCKED
- [ ] Testes validam atualização de itens em LOCKED

---

## 🎯 COMO VALIDAR

### Script de Validação

```bash
# Executar validação das regras do Core
npm run audit:laws | grep -A 20 "PARTE 3"
```

### Validação Manual

1. **Verificar Constraints:**
   ```sql
   -- Executar no banco
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conrelid = 'gm_orders'::regclass;
   ```

2. **Verificar Triggers:**
   ```sql
   -- Executar no banco
   SELECT trigger_name, action_statement 
   FROM information_schema.triggers 
   WHERE event_object_table = 'gm_orders';
   ```

3. **Verificar State Machine:**
   ```bash
   # Buscar no código
   grep -r "VALID_TRANSITIONS\|StateMachine" merchant-portal/src
   ```

---

## 📚 DOCUMENTOS RELACIONADOS

- **[SYSTEM_TRUTH_CODEX.md](./SYSTEM_TRUTH_CODEX.md)** - Leis da verdade (seção 2)
- **[CHECKLIST_VERIFICACAO_COMPLETA_LEIS.md](./CHECKLIST_VERIFICACAO_COMPLETA_LEIS.md)** - Checklist completo
- **[SYSTEM_OF_RECORD_SPEC.md](./SYSTEM_OF_RECORD_SPEC.md)** - Garantias do sistema

---

## ⚠️ IMPORTÂNCIA

**Estas regras são inegociáveis.**

Elas garantem:
- ✅ Integridade financeira
- ✅ Consistência de dados
- ✅ Rastreabilidade
- ✅ Defensibilidade legal

**Qualquer violação destas regras compromete a integridade do sistema.**

---

**Última atualização:** 2026-01-24  
**Status:** ✅ **REGRAS OBRIGATÓRIAS**
