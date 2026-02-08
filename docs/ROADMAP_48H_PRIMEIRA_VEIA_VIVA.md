# 🗺️ ROADMAP 48H — PRIMEIRA VEIA VIVA
## De "Base Sólida" para "Sistema Operacional Real"

**Objetivo:** Ligar IDENTIDADE + LOCALIZAÇÃO ao Core real, habilitando publicação e gerando primeira realidade operacional.

**Tempo estimado:** 6-8 horas (1 dia de trabalho focado)

---

## 🎯 FASE 1: IDENTIDADE → CORE (2h)

### Tarefa 1.1: Criar RPC no Core
**Arquivo:** `docker-core/schema/migrations/20260127_create_restaurant_identity_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION create_restaurant_identity(
  p_name VARCHAR,
  p_type VARCHAR,
  p_country VARCHAR,
  p_timezone VARCHAR,
  p_currency VARCHAR,
  p_locale VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  INSERT INTO restaurant (
    name, type, country, timezone, currency, locale, status, created_at
  ) VALUES (
    p_name, p_type, p_country, p_timezone, p_currency, p_locale, 
    'SETUP_IN_PROGRESS', NOW()
  ) RETURNING id INTO v_restaurant_id;
  
  RETURN v_restaurant_id;
END;
$$ LANGUAGE plpgsql;
```

### Tarefa 1.2: Criar Hook de Integração
**Arquivo:** `merchant-portal/src/features/onboarding/hooks/useCreateRestaurantIdentity.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../core/supabase';

export interface IdentityFormData {
  name: string;
  type: string;
  country: string;
  timezone: string;
  currency: string;
  locale: string;
}

export function useCreateRestaurantIdentity() {
  return useMutation({
    mutationFn: async (data: IdentityFormData) => {
      const { data: result, error } = await supabase.rpc('create_restaurant_identity', {
        p_name: data.name,
        p_type: data.type,
        p_country: data.country,
        p_timezone: data.timezone,
        p_currency: data.currency,
        p_locale: data.locale,
      });
      
      if (error) throw error;
      return result as string; // UUID
    },
  });
}
```

### Tarefa 1.3: Integrar IdentitySection
**Arquivo:** `merchant-portal/src/pages/Onboarding/sections/IdentitySection.tsx`

**Mudanças:**
- Importar `useCreateRestaurantIdentity`
- Ao completar formulário, chamar `create.mutate()`
- Salvar `restaurantId` no contexto: `updateRestaurantId(result)`
- Atualizar status para `COMPLETE`
- Mostrar feedback: "Restaurante criado!"

**Critério de Pronto:**
- ✅ Formulário salva no banco
- ✅ `restaurant_id` gerado e salvo
- ✅ Status verde na sidebar
- ✅ Progresso atualiza

---

## 🎯 FASE 2: LOCALIZAÇÃO → CORE (3-4h)

### Tarefa 2.1: Criar RPCs no Core
**Arquivo:** `docker-core/schema/migrations/20260127_create_location_rpcs.sql`

```sql
-- Atualizar localização
CREATE OR REPLACE FUNCTION update_restaurant_location(
  p_restaurant_id UUID,
  p_address TEXT,
  p_city VARCHAR,
  p_postal_code VARCHAR,
  p_state VARCHAR,
  p_capacity INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE restaurant
  SET 
    address = p_address,
    city = p_city,
    postal_code = p_postal_code,
    state = p_state,
    capacity = p_capacity
  WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql;

-- Criar zonas
CREATE OR REPLACE FUNCTION create_zones_batch(
  p_restaurant_id UUID,
  p_zones TEXT[]
) RETURNS VOID AS $$
DECLARE
  v_zone TEXT;
BEGIN
  FOR v_zone IN SELECT unnest(p_zones)
  LOOP
    INSERT INTO zones (restaurant_id, name, type)
    VALUES (p_restaurant_id, v_zone, v_zone)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Criar mesas automaticamente
CREATE OR REPLACE FUNCTION create_tables_batch(
  p_restaurant_id UUID,
  p_capacity INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_num_tables INTEGER;
  v_table_num INTEGER := 1;
  v_zone_id UUID;
  v_table_capacity INTEGER;
BEGIN
  v_num_tables := CEIL(p_capacity / 2.5);
  
  -- Pegar primeira zona ou criar padrão
  SELECT id INTO v_zone_id FROM zones 
  WHERE restaurant_id = p_restaurant_id 
  LIMIT 1;
  
  IF v_zone_id IS NULL THEN
    INSERT INTO zones (restaurant_id, name, type)
    VALUES (p_restaurant_id, 'SALON', 'SALON')
    RETURNING id INTO v_zone_id;
  END IF;
  
  -- Criar mesas (60% de 2, 30% de 4, 10% de 6)
  FOR i IN 1..v_num_tables LOOP
    IF i <= FLOOR(v_num_tables * 0.6) THEN
      v_table_capacity := 2;
    ELSIF i <= FLOOR(v_num_tables * 0.6) + FLOOR(v_num_tables * 0.3) THEN
      v_table_capacity := 4;
    ELSE
      v_table_capacity := 6;
    END IF;
    
    INSERT INTO tables (restaurant_id, number, capacity, zone_id)
    VALUES (p_restaurant_id, 'Mesa ' || v_table_num, v_table_capacity, v_zone_id);
    
    v_table_num := v_table_num + 1;
  END LOOP;
  
  RETURN v_num_tables;
END;
$$ LANGUAGE plpgsql;
```

### Tarefa 2.2: Criar Hook de Integração
**Arquivo:** `merchant-portal/src/features/onboarding/hooks/useCreateLocation.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../core/supabase';

export interface LocationFormData {
  address: string;
  city: string;
  postalCode: string;
  state: string;
  capacity: number;
  zones: string[];
}

export function useCreateLocation() {
  return useMutation({
    mutationFn: async (data: LocationFormData & { restaurantId: string }) => {
      // 1. Atualizar localização
      const { error: locError } = await supabase.rpc('update_restaurant_location', {
        p_restaurant_id: data.restaurantId,
        p_address: data.address,
        p_city: data.city,
        p_postal_code: data.postalCode,
        p_state: data.state,
        p_capacity: data.capacity,
      });
      if (locError) throw locError;
      
      // 2. Criar zonas
      const { error: zonesError } = await supabase.rpc('create_zones_batch', {
        p_restaurant_id: data.restaurantId,
        p_zones: data.zones,
      });
      if (zonesError) throw zonesError;
      
      // 3. Criar mesas
      const { data: numTables, error: tablesError } = await supabase.rpc('create_tables_batch', {
        p_restaurant_id: data.restaurantId,
        p_capacity: data.capacity,
      });
      if (tablesError) throw tablesError;
      
      return { numTables };
    },
  });
}
```

### Tarefa 2.3: Integrar LocationSection
**Arquivo:** `merchant-portal/src/pages/Onboarding/sections/LocationSection.tsx`

**Mudanças:**
- Importar `useCreateLocation`
- Buscar `restaurantId` do contexto
- Ao completar formulário, chamar `create.mutate()`
- Mostrar preview: "X mesas criadas automaticamente"
- Atualizar status para `COMPLETE`

**Critério de Pronto:**
- ✅ Endereço salvo no banco
- ✅ Zonas criadas no banco
- ✅ Mesas geradas no banco
- ✅ Status verde na sidebar
- ✅ Preview mostra quantas mesas foram criadas

---

## 🎯 FASE 3: PUBLICAR → ATIVAÇÃO REAL (2h)

### Tarefa 3.1: Criar RPC de Ativação
**Arquivo:** `docker-core/schema/migrations/20260127_activate_restaurant_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION activate_restaurant(
  p_restaurant_id UUID
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_first_table_id UUID;
  v_first_product_id UUID;
BEGIN
  -- 1. Ativar restaurante
  UPDATE restaurant
  SET status = 'ACTIVE'
  WHERE id = p_restaurant_id;
  
  -- 2. Pegar primeira mesa
  SELECT id INTO v_first_table_id
  FROM tables
  WHERE restaurant_id = p_restaurant_id
  ORDER BY number
  LIMIT 1;
  
  -- 3. Pegar primeiro produto (se existir)
  SELECT id INTO v_first_product_id
  FROM products
  WHERE restaurant_id = p_restaurant_id
  ORDER BY created_at
  LIMIT 1;
  
  -- 4. Criar pedido de teste
  IF v_first_table_id IS NOT NULL THEN
    INSERT INTO orders (restaurant_id, table_id, status, source, created_at)
    VALUES (p_restaurant_id, v_first_table_id, 'OPEN', 'TEST', NOW())
    RETURNING id INTO v_order_id;
    
    -- 5. Adicionar item ao pedido (se produto existir)
    IF v_first_product_id IS NOT NULL THEN
      INSERT INTO order_items (order_id, product_id, quantity, status, created_at)
      VALUES (v_order_id, v_first_product_id, 1, 'PENDING', NOW());
    END IF;
  END IF;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
```

### Tarefa 3.2: Integrar PublishSection
**Arquivo:** `merchant-portal/src/pages/Onboarding/sections/PublishSection.tsx`

**Mudanças:**
- Importar hook de ativação
- Buscar `restaurantId` do contexto
- Ao clicar "Publicar", chamar RPC
- Mostrar loading
- Redirecionar para `/owner/vision`

**Critério de Pronto:**
- ✅ Restaurante fica `status = 'ACTIVE'`
- ✅ Primeiro pedido criado
- ✅ Redirecionamento funciona
- ✅ Dashboard mostra dados reais

---

## 🧪 TESTE DE VALIDAÇÃO FINAL

**Cenário End-to-End:**

1. Acessar `/onboarding?section=identity`
2. Preencher e salvar → Verificar banco: `restaurant` criado
3. Navegar para `?section=location`
4. Preencher e salvar → Verificar banco: `tables` e `zones` criados
5. Navegar para `?section=publish`
6. Verificar: botão habilitado
7. Clicar "Publicar" → Verificar banco: `status = 'ACTIVE'`, `order` criado
8. Verificar: redireciona para `/owner/vision`
9. Verificar: dashboard mostra dados reais

**Critério de Pronto:**
- ✅ Fluxo completo funciona
- ✅ Dados persistem no banco
- ✅ Primeiro pedido aparece no KDS
- ✅ Sistema "vivo" e operacional

---

## 📊 RESULTADO ESPERADO

### Antes
- Setup Tree funcional, mas dados só em localStorage
- Publicação não cria nada real
- Dashboard mostra placeholders

### Depois
- Restaurante existe no banco
- Mesas reais criadas
- Primeiro pedido aparece no KDS
- Dashboard mostra dados reais
- **Sistema operacional de verdade**

---

## ⏱️ ESTIMATIVA DE TEMPO

- **FASE 1 (Identidade):** 2h
- **FASE 2 (Localização):** 3-4h
- **FASE 3 (Publicar):** 2h
- **Testes:** 1h

**Total:** 8-9 horas (1 dia de trabalho focado)

---

## ✅ CRITÉRIO DE SUCESSO FINAL

**Sistema está "vivo" quando:**
- ✅ Posso criar restaurante completo em 5 minutos
- ✅ Dados persistem no banco (não só localStorage)
- ✅ Primeiro pedido aparece no KDS automaticamente
- ✅ Dashboard mostra dados reais
- ✅ Zero placeholders visíveis
- ✅ Todas as ações têm consequência real

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Pronto para execução
