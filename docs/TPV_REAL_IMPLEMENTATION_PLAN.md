# TPV Real - Plano de Implementação

**Data**: 2025-01-27  
**Status**: 🚧 **EM IMPLEMENTAÇÃO**

---

## 🎯 Objetivo

Transformar o TPV do ChefIApp de mock visual para TPV REAL, funcional e superior ao Last App.

---

## 📊 Diagnóstico Honesto

### Estado Atual
- ✅ Design System: 80%
- ❌ Lógica de TPV: 0%
- ❌ Financeiro: 0%
- ❌ Fluxo de pedido: 0%
- ❌ Persistência real: 0%

**Veredito**: Não é um TPV. Ainda.

---

## 🔥 Módulos Obrigatórios

### 1. Order Engine (Núcleo)
- Pedido como entidade real
- Estado controlado (OPEN, IN_PREP, READY, PAID, CANCELED)
- Mutável
- Persistido no Supabase

### 2. Cart System
- Adicionar item
- Remover item
- Quantidade
- Modificadores
- Observações

### 3. Pricing Engine
- Subtotal
- Taxas
- Impostos
- Descontos
- Total real

### 4. Payment Engine
- Métodos (cash, card, pix)
- Status de pagamento
- Pagamento parcial
- Split (futuro)

### 5. Cash Register
- Abertura de caixa
- Fechamento
- Vendas do dia
- Relatório básico

### 6. Pedido → Cozinha
- Estados visuais
- Timeline
- Ordem de produção

---

## 📋 Schema de Banco (Verificar/Completar)

### Tabelas Existentes (Verificar)
- `gm_orders` - Pedidos
- `gm_order_items` - Itens do pedido
- `gm_payments` - Pagamentos
- `cash_registers` - Caixas (criar se não existir)

### Schema Necessário

```sql
-- gm_orders (verificar se existe e completar)
CREATE TABLE IF NOT EXISTS gm_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id),
    table_number INTEGER,
    table_id UUID,
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'IN_PREP', 'READY', 'PAID', 'CANCELLED')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
    total_cents INTEGER NOT NULL DEFAULT 0,
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'tpv' CHECK (source IN ('tpv', 'web', 'app')),
    operator_id UUID REFERENCES auth.users(id),
    cash_register_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- gm_order_items (verificar se existe)
CREATE TABLE IF NOT EXISTS gm_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES gm_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES menu_items(id),
    name_snapshot TEXT NOT NULL,
    price_snapshot INTEGER NOT NULL, -- em centavos
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal_cents INTEGER NOT NULL, -- quantity * price_snapshot
    modifiers JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cash_registers (criar se não existir)
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    opened_by UUID REFERENCES auth.users(id),
    closed_by UUID REFERENCES auth.users(id),
    opening_balance_cents INTEGER NOT NULL DEFAULT 0,
    closing_balance_cents INTEGER,
    total_sales_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🚀 Plano de Implementação (Sprints)

### Sprint 1: Order Engine (2-3 dias)
- [ ] Verificar/completar schema `gm_orders`
- [ ] Criar `OrderEngine` class
- [ ] Estados: OPEN, IN_PREP, READY, PAID, CANCELED
- [ ] Persistência no Supabase
- [ ] Testes básicos

### Sprint 2: Cart System (2 dias)
- [ ] Adicionar item ao pedido
- [ ] Remover item
- [ ] Incrementar/decrementar quantidade
- [ ] Modificadores (estrutura básica)
- [ ] Observações

### Sprint 3: Pricing Engine (1-2 dias)
- [ ] Calcular subtotal
- [ ] Aplicar taxas (configurável)
- [ ] Aplicar impostos (configurável)
- [ ] Aplicar descontos
- [ ] Total final

### Sprint 4: Payment Engine (2 dias)
- [ ] Métodos de pagamento (cash, card, pix)
- [ ] Criar pagamento
- [ ] Atualizar status do pedido
- [ ] Integração com `gm_payments`

### Sprint 5: Cash Register (2 dias)
- [ ] Abrir caixa
- [ ] Fechar caixa
- [ ] Total do dia REAL
- [ ] Relatório básico

### Sprint 6: UI Real (2 dias)
- [ ] Remover mocks
- [ ] Conectar com Order Engine
- [ ] Feedback visual de ações
- [ ] Estados visuais corretos

---

## 📝 Regras Absolutas

- ❌ NÃO inventar UX nova
- ❌ NÃO criar fluxo experimental
- ❌ NÃO mudar estrutura visual principal
- ❌ NÃO criar feature fake
- ✅ Tudo precisa funcionar de verdade

---

## 🎯 Resultado Esperado

Um garçom consegue:
- Abrir pedido
- Adicionar itens
- Cobrar
- Fechar caixa

**Sem explicação. Sem mock. Sem mentira visual.**

---

**Status**: 🚧 **INICIANDO SPRINT 1 - ORDER ENGINE**

