# 💾 PERSISTÊNCIA DO ONBOARDING NO BANCO DE DADOS
## Status Atual e Implementação

**Data:** 27/01/2026  
**Status:** ⚠️ **PARCIALMENTE IMPLEMENTADO**

---

## 🔍 SITUAÇÃO ATUAL

### ❌ O que NÃO está sendo salvo no banco:
1. **IdentitySection**: Dados apenas em estado local
2. **LocationSection**: Dados apenas em estado local
3. **ScheduleSection**: Dados apenas em estado local
4. **MenuSection**: Dados apenas em estado local
5. **InventorySection**: Dados apenas em estado local
6. **PeopleSection**: Dados apenas em estado local
7. **OnboardingContext**: Apenas `localStorage` (linha 76)

### ✅ O que JÁ está sendo salvo:
- **BootstrapPage**: Cria `gm_restaurants` e `restaurant_members` (antes do onboarding)

---

## 🎯 O QUE PRECISA SER IMPLEMENTADO

### 1. Identity → `gm_restaurants`
**Campos a salvar:**
- `name` → `name`
- `type` → `type` (precisa adicionar coluna se não existir)
- `country` → `country`
- `timezone` → `timezone` (precisa adicionar coluna)
- `currency` → `currency` (precisa adicionar coluna)
- `locale` → `locale` (precisa adicionar coluna)

**Quando salvar:** Ao preencher e validar (debounce de 1-2s)

### 2. Location → `gm_restaurants` + `gm_tables`
**Campos a salvar:**
- `address` → `address` (precisa adicionar coluna)
- `city` → `city`
- `postalCode` → `postal_code` (precisa adicionar coluna)
- `state` → `state` (precisa adicionar coluna)
- `capacity` → `capacity` (precisa adicionar coluna)
- `zones` → Criar registros em `gm_locations` (tabela já existe)

**Mesas:** Criar registros em `gm_tables` baseado em `capacity`

**Quando salvar:** Ao preencher e validar (debounce de 1-2s)

### 3. Schedule → Nova tabela ou `gm_shifts`
**Tabela sugerida:** `restaurant_schedules` ou usar `gm_shifts`
- `day_of_week` (0-6)
- `open` (boolean)
- `start_time` (TIME)
- `end_time` (TIME)

**Quando salvar:** Ao preencher e validar

### 4. Menu → `gm_products` + `gm_menu_categories`
**Já existe estrutura:**
- `gm_menu_categories` (categorias)
- `gm_products` (produtos)

**Quando salvar:** Ao criar/editar produtos

### 5. Inventory → `gm_inventory_items` (se existir)
**Verificar se tabela existe:** `gm_inventory_items` ou `gm_stock_items`

**Quando salvar:** Ao criar/editar ingredientes

### 6. People → `gm_restaurant_members`
**Tabela já existe:**
- `gm_restaurant_members` (user_id, restaurant_id, role)

**Quando salvar:** Ao adicionar funcionários

### 7. publishRestaurant → Atualizar `gm_restaurants.status`
**Ação:**
- Atualizar `status = 'active'` em `gm_restaurants`
- Criar pedido de teste (opcional)
- Redirecionar para dashboard

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Preparar Schema (SQL)
1. Adicionar colunas faltantes em `gm_restaurants`:
   - `type` (TEXT)
   - `timezone` (TEXT)
   - `currency` (TEXT)
   - `locale` (TEXT)
   - `address` (TEXT)
   - `postal_code` (TEXT)
   - `state` (TEXT)
   - `capacity` (INTEGER)

2. Criar tabela `restaurant_schedules` (se não existir)

3. Criar tabela `restaurant_setup_status` (para salvar progresso):
   ```sql
   CREATE TABLE IF NOT EXISTS restaurant_setup_status (
     restaurant_id UUID PRIMARY KEY REFERENCES gm_restaurants(id),
     sections JSONB NOT NULL,
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

### Fase 2: Implementar Salvamento em Cada Seção
1. **IdentitySection**: Salvar em `gm_restaurants` (debounce)
2. **LocationSection**: Salvar em `gm_restaurants` + criar `gm_tables`
3. **ScheduleSection**: Salvar em `restaurant_schedules`
4. **MenuSection**: Já deve salvar em `gm_products` (verificar)
5. **InventorySection**: Salvar em `gm_inventory_items` (verificar)
6. **PeopleSection**: Salvar em `gm_restaurant_members`

### Fase 3: Implementar publishRestaurant Real
1. Atualizar `gm_restaurants.status = 'active'`
2. Criar pedido de teste (opcional)
3. Redirecionar para dashboard

---

## 🔧 FUNÇÕES HELPER NECESSÁRIAS

### `saveIdentityToDatabase(restaurantId, formData)`
Salva dados de identidade em `gm_restaurants`

### `saveLocationToDatabase(restaurantId, formData)`
Salva dados de localização em `gm_restaurants` e cria mesas em `gm_tables`

### `saveScheduleToDatabase(restaurantId, scheduleData)`
Salva horários em `restaurant_schedules`

### `publishRestaurantToDatabase(restaurantId)`
Atualiza `status = 'active'` e finaliza onboarding

---

## ⚠️ IMPORTANTE

1. **Debounce**: Usar debounce de 1-2s para evitar muitas chamadas ao banco
2. **Validação**: Só salvar se dados estiverem válidos
3. **Error Handling**: Tratar erros graciosamente (não quebrar UX)
4. **Loading States**: Mostrar feedback visual ao salvar
5. **Restaurant ID**: Garantir que `restaurantId` existe antes de salvar

---

## 📊 STATUS DE IMPLEMENTAÇÃO

| Seção | Estado | Tabela | Status |
|-------|--------|--------|--------|
| Identity | ❌ Não salva | `gm_restaurants` | Pendente |
| Location | ❌ Não salva | `gm_restaurants` + `gm_tables` | Pendente |
| Schedule | ❌ Não salva | `restaurant_schedules` | Pendente |
| Menu | ⚠️ Verificar | `gm_products` | Verificar |
| Inventory | ⚠️ Verificar | `gm_inventory_items` | Verificar |
| People | ⚠️ Verificar | `gm_restaurant_members` | Verificar |
| Publish | ❌ Simula | `gm_restaurants.status` | Pendente |

---

**Documento criado em:** 27/01/2026  
**Status:** ⚠️ **ANÁLISE COMPLETA - IMPLEMENTAÇÃO PENDENTE**
