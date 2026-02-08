# 🧾 Regra de Divisão de Conta — Mesa QR (Grupo)

**Data:** 2026-01-26  
**Status:** ✅ Implementado

---

## 🎯 Regra de Ouro (Não Negociar)

> **Pedido é da MESA.**  
> **Itens são das PESSOAS.**  
> **Pagamento respeita os ITENS.**

---

## 👥 Quem Pode Criar Pedidos

### ✅ Perfis que PODEM criar pedidos

| Perfil | Quando | Origem | Acesso |
|--------|--------|--------|--------|
| **`waiter` (Garçom)** | Sempre | `APPSTAFF` | ✅ MiniPOS sempre |
| **`manager` (Gerente)** | Quando não há garçom (fallback) | `APPSTAFF_MANAGER` | ✅ MiniPOS quando necessário |
| **`owner` (Dono)** | Contexto excepcional | `APPSTAFF_OWNER` | ✅ MiniPOS quando necessário |
| **QR Mesa (Cliente)** | Sempre | `QR_MESA` | ✅ Via QR Code |

### ❌ Perfis que NÃO criam pedidos

- `kitchen` — Apenas visualiza (KDS)
- `cleaning` — Apenas checklist
- `worker` — Apenas tarefas genéricas

---

## 🏗️ Modelo de Dados

### Schema: `gm_order_items`

Cada item do pedido tem **autoria clara**:

```sql
CREATE TABLE public.gm_order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    product_id UUID,
    name_snapshot TEXT NOT NULL,
    price_snapshot INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal_cents INTEGER NOT NULL,
    
    -- ✅ AUTORIA DO ITEM (para divisão de conta)
    created_by_user_id UUID,        -- ID do usuário que criou o item
    created_by_role TEXT,           -- 'waiter', 'manager', 'owner', 'QR_MESA'
    device_id TEXT,                 -- Opcional: identificador do dispositivo (QR Mesa)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Origem do Pedido

O campo `origin` em `gm_orders` diferencia quem criou o pedido:

- `APPSTAFF` — Garçom
- `APPSTAFF_MANAGER` — Gerente
- `APPSTAFF_OWNER` — Dono
- `QR_MESA` — Cliente via QR Code
- `CAIXA` — TPV/Caixa
- `WEB` — Pedido web
- `TPV` — TPV

---

## 🔄 Fluxo Real

### Cenário: Mesa 12 (Grupo com QR)

```
Mesa 12 (Pedido Único)
│
├─ Cliente A (QR Mesa)
│  ├── Item 1 (Hambúrguer)
│  │   └── created_by_user_id: session_a
│  │   └── created_by_role: 'QR_MESA'
│  │   └── device_id: 'device_a'
│  │
│  └── Item 2 (Batata)
│      └── created_by_user_id: session_a
│      └── created_by_role: 'QR_MESA'
│      └── device_id: 'device_a'
│
├─ Cliente B (QR Mesa)
│  └── Item 3 (Refrigerante)
│      └── created_by_user_id: session_b
│      └── created_by_role: 'QR_MESA'
│      └── device_id: 'device_b'
│
├─ Garçom (AppStaff)
│  └── Item 4 (Sobremesa)
│      └── created_by_user_id: user_waiter_123
│      └── created_by_role: 'waiter'
│      └── device_id: null
│
└─ Gerente (AppStaff - Fallback)
   └── Item 5 (Água)
       └── created_by_user_id: user_manager_456
       └── created_by_role: 'manager'
       └── device_id: null
```

### Divisão da Conta

```sql
-- Agrupar itens por autor para divisão
SELECT 
    created_by_user_id,
    created_by_role,
    device_id,
    SUM(subtotal_cents) as total_cents
FROM gm_order_items
WHERE order_id = 'order_123'
GROUP BY created_by_user_id, created_by_role, device_id;
```

**Resultado:**

| Autor | Role | Total |
|-------|------|-------|
| `session_a` | `QR_MESA` | R$ 45,00 |
| `session_b` | `QR_MESA` | R$ 8,00 |
| `user_waiter_123` | `waiter` | R$ 12,00 |
| `user_manager_456` | `manager` | R$ 3,00 |

**Total do Pedido:** R$ 68,00

---

## 💻 Implementação

### 1. Schema Atualizado

**Arquivo:** `docker-core/schema/core_schema.sql`

```sql
-- 6. Order Items
CREATE TABLE IF NOT EXISTS public.gm_order_items (
    -- ... campos existentes ...
    
    -- ✅ AUTORIA DO ITEM (para divisão de conta)
    created_by_user_id UUID,
    created_by_role TEXT, -- 'waiter', 'manager', 'owner', 'QR_MESA', etc.
    device_id TEXT, -- Opcional: identificador do dispositivo (QR Mesa)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Função RPC Atualizada

**Arquivo:** `docker-core/schema/core_schema.sql`

```sql
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_restaurant_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cash',
    p_sync_metadata JSONB DEFAULT NULL
) RETURNS JSONB
-- ...
    -- 3. Insert Order Items (com autoria para divisão de conta)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.gm_order_items (
            order_id,
            product_id,
            name_snapshot,
            price_snapshot,
            quantity,
            subtotal_cents,
            -- ✅ Autoria do item
            created_by_user_id,
            created_by_role,
            device_id
        )
        VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_unit_price,
            v_qty,
            v_unit_price * v_qty,
            -- Extrair autoria do item (se presente)
            (v_item->>'created_by_user_id')::UUID,
            v_item->>'created_by_role',
            v_item->>'device_id'
        );
    END LOOP;
```

### 3. Frontend: TablePanel

**Arquivo:** `merchant-portal/src/pages/Waiter/TablePanel.tsx`

```typescript
const handleSendOrder = async () => {
  // Obter autoria (user_id e role)
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;
  
  // Detectar contexto e role
  const isAppStaff = window.location.pathname.includes('/app/staff');
  let userRole: string = 'waiter';
  let orderOrigin: string = 'CAIXA';
  
  if (isAppStaff) {
    if (role === 'manager') {
      userRole = 'manager';
      orderOrigin = 'APPSTAFF_MANAGER';
    } else if (role === 'owner') {
      userRole = 'owner';
      orderOrigin = 'APPSTAFF_OWNER';
    } else {
      userRole = 'waiter';
      orderOrigin = 'APPSTAFF';
    }
  }

  await createOrder({
    tableId: table.id,
    tableNumber: table.number,
    items: orderItems.map(item => ({
      // ... campos do item ...
      // ✅ Autoria do item
      created_by_user_id: userId,
      created_by_role: userRole
    })),
    syncMetadata: {
      origin: orderOrigin,
      created_by_user_id: userId,
      created_by_role: userRole
    }
  });
};
```

### 4. Frontend: OrderContextReal

**Arquivo:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`

```typescript
// DOCKER CORE: Criar pedido diretamente via RPC create_order_atomic
const rpcItems = (orderInput.items || []).map((item: any) => ({
  product_id: item.productId,
  name: item.name,
  quantity: item.quantity,
  unit_price: Math.round(item.price * 100),
  // ✅ Autoria do item (para divisão de conta)
  created_by_user_id: item.created_by_user_id || null,
  created_by_role: item.created_by_role || null,
  device_id: item.device_id || null
}));
```

### 5. AppStaff: DominantTool

**Arquivo:** `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx`

```typescript
// Regra operacional: Garçom sempre pode criar pedidos.
// Gerente e Dono podem criar pedidos quando necessário (fallback).
const dominantTool = useMemo((): DominantTool => {
  if (shiftState === 'offline') return 'hands';
  
  // Waiter: sempre pode criar pedidos
  if (activeRole === 'waiter') return 'order';
  
  // Manager: pode criar pedidos (fallback quando não há garçom)
  if (activeRole === 'manager') return 'order'; // ✅ Permite acesso ao MiniPOS
  
  // Owner: pode criar pedidos (contexto excepcional)
  if (activeRole === 'owner') return 'order'; // ✅ Permite acesso ao MiniPOS
  
  // ... outros perfis ...
}, [shiftState, activeRole, orders]);
```

---

## 📊 Exemplo Prático

### Cenário: Restaurante Pequeno, Turno Vazio

**Situação:**
- Não há garçom disponível
- Gerente atende mesa 5
- Cliente também faz pedido via QR Mesa

**Fluxo:**

1. **Gerente cria pedido:**
   - `origin: 'APPSTAFF_MANAGER'`
   - Item: `created_by_role: 'manager'`

2. **Cliente adiciona item via QR:**
   - `origin: 'QR_MESA'` (mantém origem do pedido original)
   - Item: `created_by_role: 'QR_MESA'`
   - Item: `device_id: 'device_cliente_xyz'`

3. **Divisão na hora de pagar:**
   ```sql
   -- Itens do gerente
   SELECT SUM(subtotal_cents) 
   FROM gm_order_items 
   WHERE order_id = 'order_123' 
     AND created_by_role = 'manager';
   -- Resultado: R$ 25,00
   
   -- Itens do cliente (QR Mesa)
   SELECT SUM(subtotal_cents) 
   FROM gm_order_items 
   WHERE order_id = 'order_123' 
     AND created_by_role = 'QR_MESA';
   -- Resultado: R$ 15,00
   ```

---

## ✅ Validações

### Regras de Negócio

1. ✅ **Pedido é da MESA** — Um pedido por mesa (constraint `idx_one_open_order_per_table`)
2. ✅ **Itens são das PESSOAS** — Cada item tem autoria clara
3. ✅ **Pagamento respeita ITENS** — Divisão por agrupamento de autoria

### Constraints

- ✅ `created_by_user_id` pode ser `NULL` (para compatibilidade com pedidos antigos)
- ✅ `created_by_role` pode ser `NULL` (para compatibilidade)
- ✅ `device_id` é opcional (apenas para QR Mesa)

---

## 🔍 Queries Úteis

### Divisão de Conta por Autor

```sql
-- Agrupar itens por autor
SELECT 
    created_by_user_id,
    created_by_role,
    device_id,
    COUNT(*) as item_count,
    SUM(subtotal_cents) as total_cents,
    SUM(quantity) as total_quantity
FROM gm_order_items
WHERE order_id = $1
GROUP BY created_by_user_id, created_by_role, device_id
ORDER BY total_cents DESC;
```

### Itens por Role

```sql
-- Ver itens criados por cada role
SELECT 
    created_by_role,
    COUNT(*) as item_count,
    SUM(subtotal_cents) as total_cents
FROM gm_order_items
WHERE order_id = $1
GROUP BY created_by_role;
```

### Histórico de Autoria

```sql
-- Ver histórico de quem criou o quê
SELECT 
    oi.name_snapshot,
    oi.quantity,
    oi.subtotal_cents,
    oi.created_by_role,
    oi.created_by_user_id,
    oi.device_id,
    oi.created_at
FROM gm_order_items oi
WHERE oi.order_id = $1
ORDER BY oi.created_at;
```

---

## 📝 Notas de Implementação

### Compatibilidade

- ✅ Pedidos antigos (sem autoria) continuam funcionando
- ✅ `created_by_user_id` e `created_by_role` são opcionais
- ✅ Sistema funciona mesmo se autoria não for fornecida

### QR Mesa

- ✅ Cada dispositivo QR Mesa deve ter um `device_id` único
- ✅ `created_by_user_id` pode ser `session_id` ou `device_id`
- ✅ `created_by_role` sempre será `'QR_MESA'`

### AppStaff

- ✅ Garçom sempre pode criar pedidos (`dominantTool = 'order'`)
- ✅ Gerente pode criar pedidos quando necessário (fallback)
- ✅ Dono pode criar pedidos em contexto excepcional
- ✅ Origem diferencia: `APPSTAFF`, `APPSTAFF_MANAGER`, `APPSTAFF_OWNER`

---

## 🎯 Conclusão

**Regra implementada:**

1. ✅ **Pedido é da MESA** — Um pedido aberto por mesa
2. ✅ **Itens são das PESSOAS** — Cada item tem autoria clara
3. ✅ **Pagamento respeita ITENS** — Divisão perfeita por agrupamento de autoria

**Funciona para:**
- ✅ Restaurante grande (múltiplos garçons)
- ✅ Restaurante pequeno (gerente atendendo)
- ✅ Bar (dono atendendo)
- ✅ Mesa com QR (grupo, conta dividida)
- ✅ Qualquer combinação dos acima

---

**Documentação criada em:** 2026-01-26