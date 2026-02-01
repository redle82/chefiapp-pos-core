# ⏱️ Timer por Item + Separação BAR/KITCHEN — Implementação Profissional

**Data:** 2026-01-26  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Problema Resolvido

**Antes (Errado):**
- Timer único por pedido
- Regra fixa genérica (5 min verde, 15 min vermelho)
- Não refletia realidade da cozinha
- Falsos alertas (água de 30s vs hambúrguer de 12min)

**Depois (Correto):**
- Timer por item (não por pedido)
- Status baseado em desvio relativo (não tempo absoluto)
- Pedido herda estado do item mais crítico
- Sem falsos alertas

---

## ✅ Implementação Completa

### Passo 1: Schema (Produtos)

**Arquivo:** `docker-core/schema/migrations/20260126_add_prep_time.sql` + `20260126_add_station.sql`

```sql
-- Prep time
ALTER TABLE public.gm_products
ADD COLUMN prep_time_seconds INTEGER DEFAULT 300,
ADD COLUMN prep_category TEXT DEFAULT 'main' CHECK (prep_category IN ('drink', 'starter', 'main', 'dessert'));

-- Station (BAR vs KITCHEN)
ALTER TABLE public.gm_products
ADD COLUMN station TEXT DEFAULT 'KITCHEN' CHECK (station IN ('BAR', 'KITCHEN'));
```

**Valores padrão por categoria:**
- `drink`: 45s (água, refrigerante)
- `starter`: 240s (4 min - bruschetta, nachos)
- `main`: 720s (12 min - hambúrguer, pizza)
- `dessert`: 300s (5 min)

### Passo 2: Schema (Order Items)

```sql
ALTER TABLE public.gm_order_items
ADD COLUMN prep_time_seconds INTEGER, -- Snapshot do produto
ADD COLUMN prep_category TEXT, -- Snapshot da categoria
ADD COLUMN station TEXT CHECK (station IN ('BAR', 'KITCHEN')); -- Snapshot da station
```

**Regra:** Snapshot no momento do pedido (produto pode mudar depois).

### Passo 3: RPC (create_order_atomic)

**Arquivo:** `docker-core/schema/core_schema.sql`

A função `create_order_atomic` agora:
1. Busca `prep_time_seconds` e `prep_category` do produto
2. Copia para `gm_order_items` como snapshot
3. Usa valores padrão se produto não encontrado

### Passo 4: Tipos TypeScript

**Arquivo:** `merchant-portal/src/core-boundary/docker-core/types.ts`

```typescript
export interface CoreOrderItem {
  // ...
  prep_time_seconds: number | null;
  prep_category: 'drink' | 'starter' | 'main' | 'dessert' | null;
  station: 'BAR' | 'KITCHEN' | null; // Snapshot da station
}
```

**Arquivo:** `merchant-portal/src/core-boundary/readers/ProductReader.ts`

```typescript
export interface CoreProduct {
  // ...
  prep_time_seconds?: number | null;
  prep_category?: 'drink' | 'starter' | 'main' | 'dessert' | null;
}
```

### Passo 5: Lógica de Cálculo

**Arquivo:** `merchant-portal/src/pages/KDSMinimal/OrderStatusCalculator.ts`

**Função:** `calculateOrderStatus(order, items)`

**Lógica:**
1. Para cada item, calcula:
   - `expected_ready_at = item.created_at + item.prep_time_seconds`
   - `delay_seconds = now - expected_ready_at`
   - `delay_ratio = delay_seconds / prep_time_seconds`

2. Encontra item mais crítico (maior `delay_ratio`)

3. Determina estado do pedido:
   - 🟢 **Normal**: `delay_ratio < 0.1` (até 10% de tolerância)
   - 🟡 **Atenção**: `0.1 <= delay_ratio < 0.25` (10-25% atrasado)
   - 🔴 **Atraso**: `delay_ratio >= 0.25` (+25% ou mais)

**Regra de ouro:** O pedido herda o estado do item mais crítico.

**Station dominante:** O pedido também herda a station do item mais crítico (BAR ou KITCHEN).

### Passo 6: Timer por Item

**Arquivo:** `merchant-portal/src/pages/KDSMinimal/ItemTimer.tsx`

**Componente:** `<ItemTimer item={item} />`

**Exibe:**
- Tempo restante (se dentro do prazo)
- `+X min` (se atrasado)
- Cor baseada em desvio relativo

### Passo 7: KDS Minimal (UI Completa)

**Arquivo:** `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`

**Mudanças:**
- ❌ Removido: `OrderTimer` (timer por pedido)
- ✅ Adicionado: `calculateOrderStatus` (status por item)
- ✅ Adicionado: `ItemTimer` (timer por item)
- ✅ Border color baseado no item mais crítico
- ✅ Cada item mostra seu próprio timer
- ✅ **Filtro por Station:** Seletor para filtrar BAR vs KITCHEN
- ✅ **Badge de Station:** Cada item mostra se é BAR ou KITCHEN
- ✅ **Status mostra station dominante:** "🔴 BAR Atrasado" ou "🟡 COZINHA Atenção"

**Visual:**
```
Pedido #82c11720
🟡 COZINHA Atenção
--------------------------------
🍳 COZ 🍔 Hambúrguer (12 min)   ⏱️ 14 min
🍳 COZ 🥗 Bruschetta (4 min)    ✅
🍺 BAR 🥤 Água                  ✅
```

**Filtro por Station:**
- **Todas:** Mostra todos os itens
- **🍳 Cozinha:** Só itens `station = 'KITCHEN'`
- **🍺 Bar:** Só itens `station = 'BAR'`

### Passo 8: Mini KDS (AppStaff)

**Arquivo:** `merchant-portal/src/pages/AppStaff/components/MiniKDSMinimal.tsx`

**Mudanças:**
- ❌ Removido: `OrderTimer` (números)
- ✅ Adicionado: Apenas status visual (🟢🟡🔴)
- ✅ Border color baseado no item mais crítico

**Regra:** Mini KDS não mostra números → menos stress → mais decisão.

---

## 📊 Exemplos de Uso

### Exemplo 1: Pedido com Itens Diferentes

**Pedido:**
- Água (30s esperado)
- Bruschetta (4 min esperado)
- Hambúrguer (12 min esperado)

**Após 14 minutos:**
- Água: ✅ Pronto (já passou)
- Bruschetta: ✅ Pronto (já passou)
- Hambúrguer: 🟡 +2 min (14 min / 12 min = 1.17 = 17% atrasado)

**Status do pedido:** 🟡 Atenção (herda do item mais crítico)

### Exemplo 2: Pedido com Itens Rápidos

**Pedido:**
- Água (30s esperado)
- Refrigerante (45s esperado)

**Após 2 minutos:**
- Água: ✅ Pronto
- Refrigerante: ✅ Pronto

**Status do pedido:** 🟢 No prazo (nenhum item crítico)

---

## 🎨 Regras de Cores (Desvio Relativo)

| Estado | Lógica | Cor | Exemplo |
|--------|--------|-----|---------|
| 🟢 Normal | `delay_ratio < 0.1` | Verde | Dentro do prazo ou até 10% de tolerância |
| 🟡 Atenção | `0.1 <= delay_ratio < 0.25` | Amarelo | 10-25% atrasado |
| 🔴 Atraso | `delay_ratio >= 0.25` | Vermelho | +25% ou mais atrasado |
| ⚫ Pronto | Item já entregue | Cinza | Item rápido já finalizado |

---

## 🔧 Valores Padrão Configurados

Produtos existentes foram atualizados com valores realistas:

```sql
-- Bebidas
UPDATE gm_products SET prep_time_seconds = 45, prep_category = 'drink'
WHERE name ILIKE '%água%' OR name ILIKE '%refrigerante%';

-- Entradas
UPDATE gm_products SET prep_time_seconds = 240, prep_category = 'starter'
WHERE name ILIKE '%bruschetta%' OR name ILIKE '%nachos%';

-- Principais
UPDATE gm_products SET prep_time_seconds = 720, prep_category = 'main'
WHERE name ILIKE '%hambúrguer%' OR name ILIKE '%pizza%';
```

---

## ✅ Status da Implementação

- ✅ **Passo 1:** Schema de produtos atualizado
- ✅ **Passo 2:** Schema de order_items atualizado
- ✅ **Passo 3:** RPC create_order_atomic atualizado
- ✅ **Passo 4:** Tipos TypeScript atualizados
- ✅ **Passo 5:** Lógica de cálculo implementada
- ✅ **Passo 6:** Timer por item implementado
- ✅ **Passo 7:** KDS Minimal atualizado
- ✅ **Passo 8:** Mini KDS atualizado (apenas status)
- ✅ **Passo 9:** Station (BAR/KITCHEN) adicionado ao schema
- ✅ **Passo 10:** Filtro por station no KDS implementado

---

## 🚀 Próximos Passos (Opcional)

1. **Configuração de prep_time por produto:**
   - Interface para restaurante configurar tempos
   - Valores padrão por categoria como fallback

2. **Histórico de tempos reais:**
   - Coletar tempos reais de preparo
   - Ajustar `prep_time_seconds` automaticamente

3. **Notificações inteligentes:**
   - Alertar apenas quando realmente atrasado
   - Não alertar para itens rápidos já prontos

---

## 📝 Notas Técnicas

- **Snapshot no momento do pedido:** Se o produto mudar `prep_time` depois, o pedido mantém o valor original
- **Valores padrão:** Se produto não tiver `prep_time`, usa 300s (5 min)
- **Cálculo em tempo real:** Timer atualiza a cada 5s para feedback visual
- **Performance:** Cálculo é O(n) onde n = número de itens (muito rápido)

---

**Implementado por:** Auto (Cursor AI)  
**Data:** 2026-01-26  
**Status:** ✅ PRONTO PARA TESTE
