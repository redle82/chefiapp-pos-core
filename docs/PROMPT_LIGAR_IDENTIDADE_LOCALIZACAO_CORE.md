# 🎯 PROMPT — LIGAR IDENTIDADE + LOCALIZAÇÃO AO CORE REAL
## Fase: Dar Vida ao Sistema (Arteria 1)

**Objetivo:** Conectar as seções IDENTIDADE e LOCALIZAÇÃO do Setup Tree ao Core real, persistindo dados no banco e gerando realidade operacional.

**Critério de Sucesso:** Após completar essas duas seções, o restaurante existe no banco com mesas reais, e o botão Publicar está habilitado.

---

## 📋 TAREFAS OBRIGATÓRIAS

### 🔧 1. IDENTIDADE — Persistir no Banco (2h)

**Arquivo:** `merchant-portal/src/pages/Onboarding/sections/IdentitySection.tsx`

**O que fazer:**

1. **Criar RPC no Core:**
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
       name, type, country, timezone, currency, locale, status
     ) VALUES (
       p_name, p_type, p_country, p_timezone, p_currency, p_locale, 'SETUP_IN_PROGRESS'
     ) RETURNING id INTO v_restaurant_id;
     
     RETURN v_restaurant_id;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Integrar IdentitySection com RPC:**
   - Ao completar formulário (todos campos válidos)
   - Chamar RPC `create_restaurant_identity()`
   - Salvar `restaurant_id` no contexto
   - Atualizar status para `COMPLETE`
   - Mostrar feedback: "Restaurante criado!"

3. **Hook de integração:**
   ```typescript
   // merchant-portal/src/features/onboarding/hooks/useCreateRestaurantIdentity.ts
   export function useCreateRestaurantIdentity() {
     const { data, error, mutate } = useMutation({
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
         return result;
       },
     });
     return { create: mutate, restaurantId: data, error, isLoading: !!data };
   }
   ```

**Critério de Pronto:**
- ✅ Formulário salva no banco ao completar
- ✅ `restaurant_id` gerado e salvo no contexto
- ✅ Status muda para verde na sidebar
- ✅ Progresso geral atualiza

---

### 🔧 2. LOCALIZAÇÃO — Persistir Mesas e Zonas (3-4h)

**Arquivo:** `merchant-portal/src/pages/Onboarding/sections/LocationSection.tsx`

**O que fazer:**

1. **Criar RPCs no Core:**
   ```sql
   -- Atualizar localização do restaurante
   CREATE OR REPLACE FUNCTION update_restaurant_location(
     p_restaurant_id UUID,
     p_address TEXT,
     p_city VARCHAR,
     p_postal_code VARCHAR,
     p_state VARCHAR,
     p_latitude DECIMAL,
     p_longitude DECIMAL,
     p_capacity INTEGER
   ) RETURNS VOID AS $$
   BEGIN
     UPDATE restaurant
     SET 
       address = p_address,
       city = p_city,
       postal_code = p_postal_code,
       state = p_state,
       latitude = p_latitude,
       longitude = p_longitude,
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
   BEGIN
     -- Calcular número de mesas
     v_num_tables := CEIL(p_capacity / 2.5);
     
     -- Pegar primeira zona (ou criar padrão)
     SELECT id INTO v_zone_id FROM zones 
     WHERE restaurant_id = p_restaurant_id 
     LIMIT 1;
     
     IF v_zone_id IS NULL THEN
       INSERT INTO zones (restaurant_id, name, type)
       VALUES (p_restaurant_id, 'SALON', 'SALON')
       RETURNING id INTO v_zone_id;
     END IF;
     
     -- Criar mesas
     FOR i IN 1..v_num_tables LOOP
       -- Distribuir: 60% mesas de 2, 30% de 4, 10% de 6
       DECLARE
         v_table_capacity INTEGER;
       BEGIN
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
       END;
     END LOOP;
     
     RETURN v_num_tables;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Integrar LocationSection com RPCs:**
   - Ao completar formulário
   - Chamar `update_restaurant_location()`
   - Chamar `create_zones_batch()` com zonas selecionadas
   - Chamar `create_tables_batch()` com capacidade
   - Mostrar preview: "X mesas criadas automaticamente"
   - Atualizar status para `COMPLETE`

3. **Hook de integração:**
   ```typescript
   // merchant-portal/src/features/onboarding/hooks/useCreateLocation.ts
   export function useCreateLocation() {
     const { mutate, error, isLoading } = useMutation({
       mutationFn: async (data: LocationFormData & { restaurantId: string }) => {
         // 1. Atualizar localização
         await supabase.rpc('update_restaurant_location', {
           p_restaurant_id: data.restaurantId,
           p_address: data.address,
           p_city: data.city,
           p_postal_code: data.postalCode,
           p_state: data.state,
           p_capacity: data.capacity,
         });
         
         // 2. Criar zonas
         await supabase.rpc('create_zones_batch', {
           p_restaurant_id: data.restaurantId,
           p_zones: data.zones,
         });
         
         // 3. Criar mesas
         const { data: numTables } = await supabase.rpc('create_tables_batch', {
           p_restaurant_id: data.restaurantId,
           p_capacity: data.capacity,
         });
         
         return { numTables };
       },
     });
     return { create: mutate, error, isLoading };
   }
   ```

**Critério de Pronto:**
- ✅ Endereço salvo no banco
- ✅ Zonas criadas no banco
- ✅ Mesas geradas automaticamente no banco
- ✅ Status muda para verde na sidebar
- ✅ Preview mostra quantas mesas foram criadas

---

### 🔧 3. BOTÃO PUBLICAR — Ativação Real (2h)

**Arquivo:** `merchant-portal/src/pages/Onboarding/sections/PublishSection.tsx`

**O que fazer:**

1. **Criar RPC de Ativação:**
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
       INSERT INTO orders (restaurant_id, table_id, status, source)
       VALUES (p_restaurant_id, v_first_table_id, 'OPEN', 'TEST')
       RETURNING id INTO v_order_id;
       
       -- 5. Adicionar item ao pedido (se produto existir)
       IF v_first_product_id IS NOT NULL THEN
         INSERT INTO order_items (order_id, product_id, quantity, status)
         VALUES (v_order_id, v_first_product_id, 1, 'PENDING');
       END IF;
     END IF;
     
     RETURN v_order_id;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Integrar PublishSection:**
   - Ao clicar "Publicar Restaurante"
   - Chamar RPC `activate_restaurant()`
   - Mostrar loading
   - Redirecionar para `/owner/vision`
   - Dashboard mostra dados reais

**Critério de Pronto:**
- ✅ Restaurante fica `status = 'ACTIVE'`
- ✅ Primeiro pedido criado
- ✅ Pedido aparece no KDS
- ✅ Dashboard mostra dados reais

---

## 🧪 TESTE DE VALIDAÇÃO

**Cenário End-to-End:**

1. Acessar `/onboarding?section=identity`
2. Preencher formulário completo
3. Verificar: `restaurant_id` gerado, status verde
4. Navegar para `?section=location`
5. Preencher endereço, capacidade, zonas
6. Verificar: mesas criadas no banco, status verde
7. Navegar para `?section=publish`
8. Verificar: botão "Publicar" habilitado
9. Clicar "Publicar Restaurante"
10. Verificar: redireciona para `/owner/vision`
11. Verificar: dashboard mostra dados reais (1 restaurante, 1 pedido)

**Critério de Pronto:**
- ✅ Fluxo completo funciona
- ✅ Dados persistem no banco
- ✅ Primeiro pedido aparece no KDS
- ✅ Sistema "vivo" e operacional

---

## 📝 ESTRUTURA DE ARQUIVOS

```
merchant-portal/src/
├── features/
│   └── onboarding/
│       ├── hooks/
│       │   ├── useCreateRestaurantIdentity.ts (NOVO)
│       │   └── useCreateLocation.ts (NOVO)
│       └── services/
│           └── onboardingService.ts (NOVO)
├── pages/
│   └── Onboarding/
│       └── sections/
│           ├── IdentitySection.tsx (MODIFICAR)
│           ├── LocationSection.tsx (MODIFICAR)
│           └── PublishSection.tsx (MODIFICAR)
└── context/
    └── OnboardingContext.tsx (MODIFICAR - salvar restaurant_id)
```

---

## 🎯 CRITÉRIO DE SUCESSO FINAL

✅ **Sistema está "vivo" quando:**
- Posso criar restaurante completo em 5 minutos
- Dados persistem no banco (não só localStorage)
- Primeiro pedido aparece no KDS automaticamente
- Dashboard mostra dados reais
- **Zero placeholders visíveis**
- **Todas as ações têm consequência real**

---

**Prompt criado em:** 27/01/2026  
**Status:** ✅ Pronto para execução
