# 🍺🍳 Separação BAR vs KITCHEN — Implementação

**Data:** 2026-01-26  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Objetivo

Separar fluxos de **Bar** e **Cozinha** no sistema, pois são:
- **Ritmos diferentes** (bar = rápido, cozinha = mais longo)
- **Expectativas diferentes** (água atrasar 1 min = grave, hambúrguer atrasar 1 min = normal)
- **Fluxos independentes** (barista vs cozinheiro)

---

## ✅ Implementação

### 1. Schema (Produtos)

**Arquivo:** `docker-core/schema/migrations/20260126_add_station.sql`

```sql
ALTER TABLE public.gm_products
ADD COLUMN station TEXT DEFAULT 'KITCHEN' CHECK (station IN ('BAR', 'KITCHEN'));
```

**Valores padrão:**
- `prep_category = 'drink'` → `station = 'BAR'`
- Outros → `station = 'KITCHEN'`

### 2. Schema (Order Items)

```sql
ALTER TABLE public.gm_order_items
ADD COLUMN station TEXT CHECK (station IN ('BAR', 'KITCHEN'));
```

**Regra:** Snapshot no momento do pedido (produto pode mudar depois).

### 3. RPC (create_order_atomic)

A função agora copia `station` do produto para o item como snapshot.

### 4. Tipos TypeScript

```typescript
export interface CoreOrderItem {
  // ...
  station: 'BAR' | 'KITCHEN' | null;
}

export interface CoreProduct {
  // ...
  station?: 'BAR' | 'KITCHEN' | null;
}
```

### 5. OrderStatusCalculator

Agora retorna `dominantStation` (station do item mais crítico):

```typescript
export interface OrderStatusResult {
  // ...
  dominantStation: 'BAR' | 'KITCHEN' | null;
}
```

### 6. KDS Minimal (UI)

**Filtro por Station:**
- Seletor no topo: "Todas" | "🍳 Cozinha" | "🍺 Bar"
- Filtra pedidos/itens baseado no station selecionado

**Visual:**
- Cada item mostra badge: `🍺 BAR` ou `🍳 COZ`
- Status do pedido mostra station dominante: "🔴 BAR Atrasado" ou "🟡 COZINHA Atenção"

---

## 📊 Exemplos

### Exemplo 1: Pedido Misto

**Pedido:**
- Água (BAR, 30s)
- Hambúrguer (KITCHEN, 12 min)

**Após 14 minutos:**
- Água: ✅ Pronto (já passou)
- Hambúrguer: 🟡 +2 min (14 min / 12 min = 1.17 = 17% atrasado)

**Status do pedido:** 🟡 COZINHA Atenção (herda do item mais crítico)

**Filtro "🍳 Cozinha":**
- Mostra só o hambúrguer
- Status: 🟡 COZINHA Atenção

**Filtro "🍺 Bar":**
- Mostra só a água
- Status: 🟢 No prazo

### Exemplo 2: Pedido Só Bar

**Pedido:**
- Água (BAR, 30s)
- Cerveja (BAR, 45s)

**Após 2 minutos:**
- Água: 🔴 +90s (2 min / 30s = 4x = 300% atrasado)
- Cerveja: 🔴 +75s (2 min / 45s = 2.67x = 167% atrasado)

**Status do pedido:** 🔴 BAR Atrasado (herda do item mais crítico)

---

## 🎨 Regras de Cores (por Station)

| Station | Ritmo | Tolerância |
|---------|-------|------------|
| 🍺 BAR | Rápido (30-60s) | Menos tolerante (água atrasar 1 min = grave) |
| 🍳 KITCHEN | Longo (4-15 min) | Mais tolerante (hambúrguer atrasar 1 min = normal) |

**Cálculo é o mesmo** (desvio relativo), mas a percepção é diferente:
- Bar: 1 min de atraso em item de 30s = 200% atrasado = 🔴 Crítico
- Cozinha: 1 min de atraso em item de 12 min = 8% atrasado = 🟢 Normal

---

## 🔧 Configuração

**Quem define:**
- Dono / Gerente / Cozinheiro líder (quem entende da operação)

**Onde:**
- No Menu / Produto (não no pedido, não no KDS)

**Valores padrão:**
- `prep_category = 'drink'` → `station = 'BAR'`
- Outros → `station = 'KITCHEN'`

**Pode ser editado:**
- Exemplo: Pizza pode ser `station = 'KITCHEN'` mesmo sendo "comida"
- Exemplo: Refrigerante pode ser `station = 'BAR'` mesmo sendo "bebida"

---

## ✅ Status da Implementação

- ✅ Schema de produtos atualizado
- ✅ Schema de order_items atualizado
- ✅ RPC create_order_atomic atualizado
- ✅ Tipos TypeScript atualizados
- ✅ OrderStatusCalculator atualizado
- ✅ KDS Minimal com filtro implementado
- ✅ Badge de station nos itens
- ✅ Status mostra station dominante

---

## 🚀 Próximos Passos (Opcional)

1. **BDS (Bar Display System) separado:**
   - Tela dedicada só para bar
   - Filtro fixo em `station = 'BAR'`
   - Alertas mais agressivos

2. **Configuração de prep_time por station:**
   - Valores padrão diferentes para BAR vs KITCHEN
   - Interface para configurar tempos por station

3. **Notificações por station:**
   - Alertar barista quando item BAR atrasa
   - Alertar cozinheiro quando item KITCHEN atrasa

---

**Implementado por:** Auto (Cursor AI)  
**Data:** 2026-01-26  
**Status:** ✅ PRONTO PARA TESTE
