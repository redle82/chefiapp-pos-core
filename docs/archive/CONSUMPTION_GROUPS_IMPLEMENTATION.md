# 🎭 Consumption Groups — Guia de Implementação

**Data**: 2025-01-02  
**Status**: ✅ Schema Pronto | ⏳ UI Pendente  
**Frase-Chave**: "Conta dividida não é uma ação. É um estado da mesa."

---

## ✅ O Que Já Está Pronto

### 1. Schema SQL
- ✅ Tabela `consumption_groups`
- ✅ Coluna `consumption_group_id` em `gm_order_items`
- ✅ Função `create_default_consumption_group()` (auto-cria grupo padrão)
- ✅ Função `get_consumption_group_total()` (calcula total do grupo)
- ✅ View `consumption_groups_with_totals` (grupos com totais)
- ✅ RLS Policies
- ✅ Indexes
- ✅ Feature Flag `consumption_groups_enabled` no GovernManage

### 2. Event Bus
- ✅ Novos tipos de evento adicionados ao enum:
  - `consumption_group_created`
  - `item_assigned_to_group`
  - `item_moved_between_groups`
  - `consumption_group_paid`
  - `partial_table_paid`

### 3. Documentação
- ✅ `CONSUMPTION_GROUPS.md` — Conceito e arquitetura
- ✅ `CONSUMPTION_GROUPS_IMPLEMENTATION.md` — Este guia

---

## ⏳ O Que Falta Implementar

### 1. UI AppStaff (Garçom)

#### Ao Adicionar Item

**Localização**: `merchant-portal/src/pages/Waiter/TablePanel.tsx`

**Mudança necessária**:
- Antes de confirmar item, mostrar seletor de grupo
- Default: grupo ativo mais recente (ou grupo padrão)
- UI: Chips grandes (🟢 Grupo A, 🔵 Grupo B, etc.)

**Exemplo de código**:
```tsx
// No ProductCard ou QuantityPicker
{consumptionGroupsEnabled && (
  <GroupSelector
    groups={activeGroups}
    selectedGroup={selectedGroup}
    onSelect={(groupId) => setSelectedGroup(groupId)}
  />
)}
```

#### Criar Novo Grupo

**Localização**: `merchant-portal/src/pages/Waiter/TablePanel.tsx`

**Botão**: "➕ Criar grupo" (discreto, no topo)

**Modal simples**:
- Input: Nome do grupo (ex: "Casal", "Amigos")
- Color picker: Escolher cor
- Botão: "Criar"

#### Mover Item Entre Grupos

**Localização**: `merchant-portal/src/pages/Waiter/TablePanel.tsx`

**Ação**: Pressão longa no item

**Menu**: Lista de grupos disponíveis

**Ação**: Atualizar `consumption_group_id` do item

---

### 2. UI TPV (Caixa)

#### Visualização de Grupos

**Localização**: `merchant-portal/src/pages/TPV/TPV.tsx`

**Mudança necessária**:
- Mostrar grupos com totais
- Cores visuais (🟢, 🔵, 🟣)
- Status (ativo, pago)

**Exemplo**:
```
Mesa 7
────────────
Grupo A (🟢) — 38,50€ [Ativo]
Grupo B (🔵) — 22,00€ [Ativo]
Grupo C (🟣) — 18,00€ [Pago ✓]
────────────
Total: 78,50€
```

#### Pagamento por Grupo

**Localização**: `merchant-portal/src/pages/TPV/TPV.tsx`

**Opções**:
- Botão: "Pagar Grupo A"
- Botão: "Pagar Grupo B"
- Botão: "Pagar tudo junto"
- Checkbox: Seleção múltipla (ex: Grupo A + B)

**Ação**:
- Marcar grupo(s) como `status = 'paid'`
- Emitir evento `consumption_group_paid`
- Emitir ticket (se necessário)

---

### 3. Backend (API)

#### Endpoints Necessários

**GET `/api/consumption-groups?order_id=...`**
- Retorna grupos de um pedido
- Inclui totais calculados

**POST `/api/consumption-groups`**
- Cria novo grupo
- Body: `{ order_id, label, color }`

**PATCH `/api/consumption-groups/:id`**
- Atualiza grupo (label, color, status)

**POST `/api/consumption-groups/:id/pay`**
- Marca grupo como pago
- Body: `{ payment_method, amount }`

**PATCH `/api/order-items/:id/group`**
- Move item para outro grupo
- Body: `{ consumption_group_id }`

---

### 4. Event Bus Integration

#### Emitir Eventos

**Localização**: `server/operational-event-bus/event-bus.ts`

**Quando criar grupo**:
```typescript
await emitEvent({
  event_type: 'consumption_group_created',
  context: { order_id, group_id, label },
  priority: 'P2'
});
```

**Quando atribuir item**:
```typescript
await emitEvent({
  event_type: 'item_assigned_to_group',
  context: { item_id, group_id, previous_group_id },
  priority: 'P2'
});
```

**Quando pagar grupo**:
```typescript
await emitEvent({
  event_type: 'consumption_group_paid',
  context: { group_id, amount, payment_method },
  priority: 'P1'
});
```

---

### 5. Why Badge (Futuro)

**Localização**: `merchant-portal/src/pages/Waiter/TablePanel.tsx`

**Exemplo**:
```tsx
<WhyBadge
  taskId={item.id}
  message="Este item pertence ao Grupo B porque foi atribuído pelo garçom às 21:14"
  decisionId={decisionId}
/>
```

**Endpoint**: `GET /api/govern-manage/tasks/:id/why`

---

## 🧭 Ordem de Implementação Recomendada

### Fase 1: Backend (Base)
1. ✅ Schema SQL
2. ⏳ Endpoints API
3. ⏳ Event Bus integration

### Fase 2: UI AppStaff (Garçom)
4. ⏳ Criar grupo
5. ⏳ Selecionar grupo ao adicionar item
6. ⏳ Mover item entre grupos

### Fase 3: UI TPV (Caixa)
7. ⏳ Visualizar grupos com totais
8. ⏳ Pagar por grupo

### Fase 4: Refinamento
9. ⏳ Why Badge
10. ⏳ Analytics
11. ⏳ Testes E2E

---

## 🚦 Feature Flag

### Ativação

**Via GovernManage UI**: `/app/govern-manage`

**Feature Key**: `consumption_groups_enabled`

**Default**: `false` (desabilitado)

**Quando ativar**:
- Restaurantes que pedem
- Contas médias/altas
- Operações mais complexas

---

## 🧪 Testes

### Cenários de Teste

1. **Criar grupo**
   - Criar grupo em pedido existente
   - Verificar grupo padrão criado automaticamente

2. **Atribuir item a grupo**
   - Adicionar item e selecionar grupo
   - Verificar `consumption_group_id` atualizado

3. **Mover item entre grupos**
   - Mover item de Grupo A para Grupo B
   - Verificar total dos grupos atualizado

4. **Pagar grupo**
   - Pagar Grupo A
   - Verificar status = 'paid'
   - Verificar evento emitido

5. **Pagar mesa parcialmente**
   - Pagar Grupo A + B
   - Verificar Grupo C ainda ativo
   - Verificar evento `partial_table_paid`

---

## 📊 Métricas

### O Que Medir

- % de mesas com múltiplos grupos
- Tempo médio para criar grupo
- Taxa de erro (itens sem grupo)
- Satisfação do garçom

---

**Mensagem**: "Schema pronto. UI pendente. Implementação incremental."

