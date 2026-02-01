# ⚠️ STATUS: PERSISTÊNCIA DO ONBOARDING

**Data:** 27/01/2026  
**Resposta:** ❌ **NÃO, os dados NÃO estão sendo salvos no banco**

---

## 🔍 SITUAÇÃO ATUAL

### O que está acontecendo:
1. **OnboardingContext** salva apenas no `localStorage` (linha 76)
2. **IdentitySection**, **LocationSection**, etc. apenas gerenciam estado local
3. **Nenhuma chamada ao Supabase** para persistir dados
4. **publishRestaurant** apenas simula (não atualiza banco)

### O que JÁ está sendo salvo:
- **BootstrapPage** cria `gm_restaurants` e `restaurant_members` (ANTES do onboarding)
- Mas os dados preenchidos no onboarding ficam apenas em memória/localStorage

---

## 📋 O QUE PRECISA SER FEITO

### 1. Identity → Salvar em `gm_restaurants`
- `name`, `type`, `country`, `timezone`, `currency`, `locale`

### 2. Location → Salvar em `gm_restaurants` + criar `gm_tables`
- `address`, `city`, `postal_code`, `capacity`
- Criar mesas automaticamente

### 3. Schedule → Criar tabela `restaurant_schedules`
- Horários de funcionamento

### 4. Menu → Já deve salvar em `gm_products` (verificar)

### 5. Inventory → Verificar se salva em `gm_inventory_items`

### 6. People → Verificar se salva em `gm_restaurant_members`

### 7. Publish → Atualizar `gm_restaurants.status = 'active'`

---

## 🚀 PRÓXIMOS PASSOS

1. Criar migration SQL para adicionar colunas faltantes em `gm_restaurants`
2. Implementar salvamento em cada seção (com debounce)
3. Implementar `publishRestaurant` real

---

**Status:** ⚠️ **IMPLEMENTAÇÃO NECESSÁRIA**
