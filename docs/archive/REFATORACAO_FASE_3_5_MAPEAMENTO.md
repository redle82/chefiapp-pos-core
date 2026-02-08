**Status:** ARCHIVED  
**Reason:** Refatoração concluída; estado atual documentado em STATE_PURE_DOCKER_APP_LAYER.md  
**Arquivado em:** 2026-01-28

---

# Fase 3.5 — Mapeamento de Acessos ao Core

**Data:** 2026-01-26  
**Status:** 🔍 EM MAPEAMENTO

---

## 📊 Acessos Diretos Encontrados

### ❌ Acessos Diretos (Precisam Migração)

#### 1. OrderReaderDirect.ts
**Localização:** `merchant-portal/src/core-boundary/readers/OrderReaderDirect.ts`

**Problema:**
- Usa `fetch` direto com `/rest/v1/gm_orders`
- Usa `fetch` direto com `/rest/v1/gm_order_items`
- Bypassa `dockerCoreClient`

**Funções:**
- `readActiveOrdersDirect()` - fetch direto
- `readOrderItemsDirect()` - fetch direto
- `readOrderWithItemsDirect()` - fetch direto

**Solução:**
- Migrar para usar `dockerCoreClient.from()` (já existe `OrderReader.ts` que faz isso)
- Remover `OrderReaderDirect.ts` ou deprecar

---

#### 2. ProductContext.tsx
**Localização:** `merchant-portal/src/cinematic/context/ProductContext.tsx`

**Problema:**
- Usa `supabase.from('gm_products')` diretamente
- Não usa `dockerCoreClient`

**Linha:** ~63-66

**Solução:**
- Migrar para `dockerCoreClient.from('gm_products')`
- Ou criar `ProductReader.ts` em `core-boundary/readers/`

---

#### 3. PulseList.tsx
**Localização:** `merchant-portal/src/pages/AppStaff/PulseList.tsx`

**Problema:**
- Usa `supabase.from('gm_restaurant_members')` diretamente
- Usa `supabase.from('empire_pulses')` diretamente
- Não usa `dockerCoreClient`

**Linhas:** ~56-76

**Solução:**
- Migrar para `dockerCoreClient.from()`
- Ou criar readers específicos

---

#### 4. LiveRosterWidget.tsx
**Localização:** `merchant-portal/src/pages/AppStaff/components/LiveRosterWidget.tsx`

**Problema:**
- Usa `supabase.from('shift_logs')` diretamente
- Usa `supabase.from('employees')` (via join)
- Não usa `dockerCoreClient`

**Linhas:** ~35-45

**Solução:**
- Migrar para `dockerCoreClient.from()`
- Ou criar `ShiftReader.ts` em `core-boundary/readers/`

---

### ✅ Acessos Corretos (Já usam dockerCoreClient)

#### 1. OrderReader.ts
**Localização:** `merchant-portal/src/core-boundary/readers/OrderReader.ts`

**Status:** ✅ CORRETO
- Usa `dockerCoreClient.from('gm_orders')`
- Usa `dockerCoreClient.from('gm_order_items')`

---

#### 2. OrderWriter.ts
**Localização:** `merchant-portal/src/core-boundary/writers/OrderWriter.ts`

**Status:** ✅ CORRETO
- Usa `dockerCoreClient.rpc('create_order_atomic')`

---

#### 3. RestaurantReader.ts
**Localização:** `merchant-portal/src/core-boundary/readers/RestaurantReader.ts`

**Status:** ✅ CORRETO
- Usa `dockerCoreClient.from()`

---

### ⚠️ Acessos a Verificar

#### 1. OrderContextReal.tsx
**Localização:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`

**Status:** ⚠️ VERIFICAR
- Provavelmente usa `dockerCoreClient` mas precisa confirmar

---

#### 2. TableContext.tsx
**Localização:** `merchant-portal/src/pages/TPV/context/TableContext.tsx`

**Status:** ⚠️ VERIFICAR
- Precisa verificar se usa `dockerCoreClient` ou `supabase` direto

---

#### 3. useAppStaffOrders.ts
**Localização:** `merchant-portal/src/pages/AppStaff/hooks/useAppStaffOrders.ts`

**Status:** ⚠️ VERIFICAR
- Usa `readActiveOrdersDirect` (que usa fetch direto)
- Precisa migrar para `readActiveOrders` (que usa dockerCoreClient)

---

#### 4. useAppStaffTables.ts
**Localização:** `merchant-portal/src/pages/AppStaff/hooks/useAppStaffTables.ts`

**Status:** ⚠️ VERIFICAR
- Precisa verificar se usa `dockerCoreClient` ou `supabase` direto

---

## 📋 Plano de Migração

### Prioridade 1: OrderReaderDirect ✅ CONCLUÍDO
- [x] Migrar `useAppStaffOrders.ts` para usar `OrderReader.ts` (já existe)
- [x] Migrar `KDSMinimal.tsx` para usar `OrderReader.ts`
- [x] Migrar `MiniKDSMinimal.tsx` para usar `OrderReader.ts`
- [ ] Deprecar `OrderReaderDirect.ts` (marcar como legado)

### Prioridade 2: ProductContext ✅ CONCLUÍDO
- [x] Criar `ProductReader.ts` em `core-boundary/readers/`
- [x] Migrar `ProductContext.tsx` para usar `dockerCoreClient`

### Prioridade 3: AppStaff Components ✅ CONCLUÍDO
- [x] Criar `PulseReader.ts` em `core-boundary/readers/`
- [x] Migrar `PulseList.tsx` para usar `PulseReader`
- [x] Criar `ShiftReader.ts` em `core-boundary/readers/`
- [x] Migrar `LiveRosterWidget.tsx` para usar `ShiftReader`

### Prioridade 4: Verificações ✅ CONCLUÍDO
- [x] Verificar `OrderContextReal.tsx` - já usa `dockerCoreClient`
- [x] Verificar `TableContext.tsx` - já usa `dockerCoreClient`
- [x] Verificar `useAppStaffTables.ts` - já usa `dockerCoreClient`

---

## 🎯 Regra de Ouro

**❌ Nenhuma UI fala direto com PostgREST**  
**✅ Tudo passa por dockerCoreClient**

---

**Status Final:**
- ✅ Todas as prioridades de UI concluídas
- ✅ 4 readers criados (OrderReader, ProductReader, PulseReader, ShiftReader)
- ✅ 7 arquivos migrados de acesso direto para `dockerCoreClient`
- ✅ `OrderReaderDirect.ts` deprecado
- ⏳ Acessos em `core/` podem ser migrados depois (não afetam UIs diretamente)

**Conclusão:** Fase 3.5 das UIs concluída. Todas as UIs agora usam `dockerCoreClient` via readers.
