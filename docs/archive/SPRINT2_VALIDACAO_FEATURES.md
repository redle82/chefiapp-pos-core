# SPRINT 2 — VALIDAÇÃO DE FEATURES JÁ IMPLEMENTADAS

**Data:** 2026-01-17  
**Objetivo:** Validar Divisão de Conta + Gestão de Mesas (DIA 3-6)  
**Status:** ⏳ **INICIANDO**

---

## 📋 FEATURE 1: DIVISÃO DE CONTA (DIA 3-4)

### ✅ Status: IMPLEMENTADO

**Arquivos Criados:**
- ✅ `supabase/migrations/20260116000001_consumption_groups.sql` — Schema completo
- ✅ `merchant-portal/src/pages/TPV/types/ConsumptionGroup.ts` — Types
- ✅ `merchant-portal/src/pages/TPV/hooks/useConsumptionGroups.ts` — Hook React
- ✅ `merchant-portal/src/pages/TPV/components/GroupSelector.tsx` — UI de seleção
- ✅ `merchant-portal/src/pages/TPV/components/CreateGroupModal.tsx` — Modal de criação
- ✅ `server/web-module-api-server.ts` — 5 endpoints API criados

**Integração:**
- ✅ `TPV.tsx` — Integrado no fluxo de adicionar item
- ✅ `PaymentModal.tsx` — Modo "Pagar por Grupo" implementado
- ✅ `OrderEngine.ts` — Suporta `consumption_group_id`
- ✅ `OrderContextReal.tsx` — Passa `consumptionGroupId` para OrderEngine

**Documentação:**
- ✅ `DIVISAO_CONTA_STATUS.md` — Status completo

---

### 📋 CHECKLIST DE VALIDAÇÃO

#### 1. Schema SQL (5min)
- [ ] Verificar que migration `20260116000001_consumption_groups.sql` foi aplicada
- [ ] Verificar que tabela `consumption_groups` existe
- [ ] Verificar que coluna `consumption_group_id` existe em `gm_order_items`
- [ ] Verificar que função `create_default_consumption_group` existe
- [ ] Verificar que view `consumption_groups_with_totals` existe

**Queries de Validação:**
```sql
-- Verificar tabela
SELECT * FROM information_schema.tables 
WHERE table_name = 'consumption_groups';

-- Verificar coluna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gm_order_items' 
  AND column_name = 'consumption_group_id';

-- Verificar função
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'create_default_consumption_group';

-- Verificar view
SELECT * FROM information_schema.views 
WHERE table_name = 'consumption_groups_with_totals';
```

---

#### 2. API Endpoints (10min)
- [ ] `GET /api/consumption-groups?order_id=...` — Lista grupos de um pedido
- [ ] `POST /api/consumption-groups` — Cria novo grupo
- [ ] `PATCH /api/consumption-groups/:id` — Atualiza grupo
- [ ] `POST /api/consumption-groups/:id/pay` — Paga grupo
- [ ] `PATCH /api/order-items/:id/group` — Move item entre grupos

**Testes Manuais:**
```bash
# 1. Criar grupo
curl -X POST http://localhost:3099/api/consumption-groups \
  -H "Content-Type: application/json" \
  -H "X-ChefiApp-Token: YOUR_TOKEN" \
  -d '{
    "orderId": "ORDER_UUID",
    "label": "Mesa 1 - Grupo A",
    "color": "#FF5733"
  }'

# 2. Listar grupos
curl -X GET "http://localhost:3099/api/consumption-groups?order_id=ORDER_UUID" \
  -H "X-ChefiApp-Token: YOUR_TOKEN"

# 3. Mover item para grupo
curl -X PATCH http://localhost:3099/api/order-items/ITEM_UUID/group \
  -H "Content-Type: application/json" \
  -H "X-ChefiApp-Token: YOUR_TOKEN" \
  -d '{
    "consumptionGroupId": "GROUP_UUID"
  }'
```

---

#### 3. UI Components (15min)
- [ ] `GroupSelector` aparece ao adicionar item em pedido com grupos
- [ ] `CreateGroupModal` permite criar novo grupo
- [ ] `PaymentModal` mostra opção "Pagar por Grupo"
- [ ] `PaymentModal` lista grupos com totais
- [ ] `PaymentModal` permite selecionar múltiplos grupos para pagar

**Testes Manuais:**
1. Criar pedido no TPV
2. Adicionar item → Verificar que `GroupSelector` aparece
3. Criar novo grupo → Verificar que grupo é criado
4. Adicionar mais itens → Verificar que itens podem ser atribuídos a grupos
5. Abrir modal de pagamento → Verificar opção "Pagar por Grupo"
6. Selecionar grupos → Verificar que totais são calculados corretamente
7. Pagar grupo → Verificar que apenas itens do grupo são marcados como pagos

---

#### 4. Integração com OrderEngine (10min)
- [ ] `OrderEngine.createOrder` aceita `consumptionGroupId`
- [ ] `OrderEngine.addItemToOrder` aceita `consumptionGroupId`
- [ ] `create_order_atomic` RPC inclui `consumption_group_id` nos items
- [ ] Grupo padrão "Mesa Inteira" é criado automaticamente

**Testes:**
- Criar pedido via `OrderEngine.createOrder` com `consumptionGroupId`
- Verificar que grupo padrão é criado automaticamente
- Adicionar item com `consumptionGroupId` específico
- Verificar que item é atribuído ao grupo correto no banco

---

### 🎯 RESULTADOS ESPERADOS

| Item | Status | Notas |
|------|--------|-------|
| Schema SQL | ⏳ | Aguardando validação |
| API Endpoints | ⏳ | Aguardando validação |
| UI Components | ⏳ | Aguardando validação |
| Integração OrderEngine | ⏳ | Aguardando validação |

---

## 📋 FEATURE 2: GESTÃO DE MESAS VIA UI (DIA 5-6)

### ✅ Status: IMPLEMENTADO

**Arquivos Criados:**
- ✅ `merchant-portal/src/pages/Settings/TableManager.tsx` — Componente completo
- ✅ `supabase/migrations/20260116000000_add_seats_to_tables.sql` — Coluna `seats` adicionada
- ✅ Integrado em `Settings.tsx`

**Funcionalidades:**
- ✅ Lista todas as mesas do restaurante
- ✅ Criar nova mesa (número, capacidade, status)
- ✅ Editar mesa existente
- ✅ Deletar mesa (soft delete)
- ✅ Visualização em grid/cards

---

### 📋 CHECKLIST DE VALIDAÇÃO

#### 1. Schema SQL (5min)
- [ ] Verificar que migration `20260116000000_add_seats_to_tables.sql` foi aplicada
- [ ] Verificar que coluna `seats` existe em `gm_tables`

**Query de Validação:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'gm_tables' 
  AND column_name = 'seats';
```

---

#### 2. UI Component (15min)
- [ ] `TableManager` é acessível via `/app/settings/tables`
- [ ] Lista mesas do restaurante atual
- [ ] Botão "Criar Mesa" funciona
- [ ] Modal de criação permite definir número, capacidade, status
- [ ] Botão "Editar" em cada mesa funciona
- [ ] Botão "Deletar" em cada mesa funciona
- [ ] Mudanças são persistidas no banco

**Testes Manuais:**
1. Acessar `/app/settings/tables`
2. Verificar que mesas existentes são listadas
3. Criar nova mesa → Verificar que aparece na lista
4. Editar mesa → Verificar que mudanças são salvas
5. Deletar mesa → Verificar que mesa é removida (soft delete)

---

#### 3. Integração com TPV (10min)
- [ ] Mesas criadas aparecem no TPV
- [ ] Mesas podem ser selecionadas ao criar pedido
- [ ] Capacidade (`seats`) é exibida (se implementado)

**Testes:**
- Criar mesa no `TableManager`
- Abrir TPV → Verificar que nova mesa aparece na lista
- Criar pedido na nova mesa → Verificar que funciona

---

### 🎯 RESULTADOS ESPERADOS

| Item | Status | Notas |
|------|--------|-------|
| Schema SQL | ⏳ | Aguardando validação |
| UI Component | ⏳ | Aguardando validação |
| Integração TPV | ⏳ | Aguardando validação |

---

## 📊 RESUMO GERAL

### Divisão de Conta
- **Status:** ✅ Implementado
- **Validação:** ⏳ Pendente
- **Tempo Estimado:** 40min

### Gestão de Mesas
- **Status:** ✅ Implementado
- **Validação:** ⏳ Pendente
- **Tempo Estimado:** 30min

**Total:** 1h10min de validação

---

## 🎯 PRÓXIMOS PASSOS

1. **Validar Divisão de Conta** → Seguir checklist acima
2. **Validar Gestão de Mesas** → Seguir checklist acima
3. **Documentar resultados** → Atualizar este arquivo
4. **Marcar DIA 3-6 como completo** → Se tudo validado

---

**Tempo Estimado:** 1h10min  
**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**
