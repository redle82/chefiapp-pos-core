# 🎯 PROMPT — IMPLEMENTAR RITUAL DE NASCIMENTO DO RESTAURANTE

**Role:** Você é um Full-Stack Engineer sênior especializado em React + TypeScript + Supabase/PostgreSQL, responsável por implementar o wizard completo de criação de restaurante no ChefIApp.

**Contexto:** O ChefIApp tem Core e UI prontos, mas falta o "Ritual de Nascimento" — um wizard obrigatório que cria o restaurante antes de qualquer operação.

**Objetivo:** Implementar wizard linear de 7 fases que cria restaurante completo do zero, inspirado na GloriaFood mas superior.

---

## 📋 TAREFAS OBRIGATÓRIAS (EM ORDEM)

### 🧬 FASE 1: IDENTIDADE

**Arquivo:** `merchant-portal/src/pages/Onboarding/IdentityStep.tsx` (criar)

**Componentes:**
- Input: Nome do restaurante (mínimo 3 caracteres)
- Radio buttons: Tipo (Restaurante / Bar / Hotel / Beach Club / Café / Outro)
- Select: País (com busca)
- Select: Fuso horário (derivado do país, mas editável)
- Select: Moeda (derivado do país, mas editável)
- Select: Idioma

**Validações:**
- Nome: obrigatório, 3-100 caracteres
- Tipo: obrigatório
- País: obrigatório
- Fuso horário: obrigatório
- Moeda: obrigatório
- Idioma: obrigatório

**Integração:**
- RPC: `create_restaurant_identity(name, type, country, timezone, currency, locale)` → retorna `restaurant_id`
- Salvar `restaurant_id` no contexto do wizard
- Status: `SETUP_IN_PROGRESS`

**Navegação:**
- Botão "Próximo" → avança para Fase 2
- Botão "Cancelar" → salva draft e volta para login

---

### 🗺️ FASE 2: EXISTÊNCIA FÍSICA

**Arquivo:** `merchant-portal/src/pages/Onboarding/LocationStep.tsx` (criar)

**Componentes:**
- Input: Endereço completo (com autocomplete)
- Input: Cidade
- Input: CEP
- Select: Estado
- **Mapa Google Maps:** Mostrar endereço, permitir arrastar marcador
- Input numérico: Capacidade (pessoas)
- **Geração automática de mesas:** Baseado em capacidade
- Checkboxes: Zonas (Bar, Salão, Cozinha, Esplanada, Terraço)

**Validações:**
- Endereço: obrigatório, validar com geocoding
- Mapa: usuário deve confirmar localização
- Capacidade: mínimo 1, máximo 1000
- Mesas: gerar automaticamente, mas permitir edição
- Zonas: pelo menos 1 obrigatória

**Algoritmo de geração de mesas:**
```typescript
const numTables = Math.ceil(capacity / 2.5);
const tables = [];
let tableNum = 1;

// 60% mesas de 2
for (let i = 0; i < Math.floor(numTables * 0.6); i++) {
  tables.push({ number: `Mesa ${tableNum++}`, capacity: 2, zone: 'SALON' });
}

// 30% mesas de 4
for (let i = 0; i < Math.floor(numTables * 0.3); i++) {
  tables.push({ number: `Mesa ${tableNum++}`, capacity: 4, zone: 'SALON' });
}

// 10% mesas de 6
for (let i = 0; i < Math.ceil(numTables * 0.1); i++) {
  tables.push({ number: `Mesa ${tableNum++}`, capacity: 6, zone: 'SALON' });
}
```

**Integração:**
- RPC: `update_restaurant_location(restaurant_id, address, city, postal_code, state, latitude, longitude, capacity)`
- RPC: `create_tables(restaurant_id, tables[])` → cria todas as mesas
- RPC: `create_zones(restaurant_id, zones[])` → cria todas as zonas

**Navegação:**
- Botão "Voltar" → volta para Fase 1
- Botão "Próximo" → avança para Fase 3

---

### ⏰ FASE 3: TEMPO

**Arquivo:** `merchant-portal/src/pages/Onboarding/ScheduleStep.tsx` (criar)

**Componentes:**
- Para cada dia da semana (Seg-Sab):
  - Checkbox: Aberto
  - Select: Horário início
  - Select: Horário fim
- Botão: "Aplicar a todos os dias"
- Seção: Dias especiais (feriados, aniversário)
- Seção: Turnos padrão (Manhã, Tarde, Noite)

**Validações:**
- Pelo menos 1 dia da semana aberto
- Horário início < horário fim
- Turnos não podem sobrepor

**Integração:**
- RPC: `create_schedules(restaurant_id, opening_hours[])` → cria horários
- RPC: `create_shift_templates(restaurant_id, shifts[])` → cria templates de turnos

**Navegação:**
- Botão "Voltar" → volta para Fase 2
- Botão "Próximo" → avança para Fase 4

---

### 🍽️ FASE 4: CARDÁPIO MÍNIMO VIVO

**Arquivo:** `merchant-portal/src/pages/Onboarding/MenuStep.tsx` (criar)

**Componentes:**
- Formulário repetível para produtos:
  - Input: Nome
  - Input: Preço (número, formato moeda)
  - Select: Categoria (Comida / Bebida)
  - Select: Estação (BAR / KITCHEN)
  - Checkbox: Consome estoque?
  - Se "Sim": Lista de ingredientes:
    - Input: Nome do ingrediente
    - Input: Quantidade
    - Select: Unidade (un, g, ml, kg, L)
    - Botão: Adicionar ingrediente
- Botão: "+ Adicionar Produto"
- Validação visual: mínimo 3 produtos

**Validações:**
- Mínimo 3 produtos
- Cada produto: nome, preço > 0, estação obrigatória
- Se "consome estoque": pelo menos 1 ingrediente
- Ingredientes: criar automaticamente no estoque se não existirem

**Integração:**
- RPC: `create_products(restaurant_id, products[])` → cria produtos
- RPC: `create_recipes(product_id, ingredients[])` → cria receitas
- RPC: `create_inventory_items_if_not_exists(restaurant_id, item_names[])` → cria itens no estoque automaticamente

**Lógica especial:**
- Se ingrediente não existe → criar com estoque inicial = 0
- Mostrar alerta: "Estes itens foram criados no estoque. Configure quantidades mínimas depois."

**Navegação:**
- Botão "Voltar" → volta para Fase 3
- Botão "Próximo" → avança para Fase 5

---

### 👥 FASE 5: PESSOAS

**Arquivo:** `merchant-portal/src/pages/Onboarding/PeopleStep.tsx` (criar)

**Componentes:**
- Seção: Criar Gerente
  - Input: Nome
  - Input: Email
  - Select: Função (sempre "Gerente")
- Seção: Criar Funcionário
  - Input: Nome
  - Input: Email
  - Select: Função (Garçom / Cozinha / Bar / Limpeza)
- Botão: "Adicionar mais funcionários"

**Validações:**
- Gerente: obrigatório, email válido
- Funcionário: pelo menos 1 obrigatório
- Email: único no sistema

**Integração:**
- RPC: `create_user(restaurant_id, name, email, role)` → cria usuário
- RPC: `assign_user_role(user_id, role)` → atribui permissões
- Opcional: Enviar email de boas-vindas

**Navegação:**
- Botão "Voltar" → volta para Fase 4
- Botão "Próximo" → avança para Fase 6

---

### 💳 FASE 6: REALIDADE OPERACIONAL

**Arquivo:** `merchant-portal/src/pages/Onboarding/OperationalStep.tsx` (criar)

**Componentes:**
- Radio buttons: Modo de operação
  - Modo Treino (pedidos não geram cobrança)
  - Modo Produção (pedidos reais)
- Checkboxes: Métodos de pagamento
  - Dinheiro
  - Cartão (débito/crédito)
  - PIX
  - Vale-refeição
- Checkboxes: Integrações (opcional)
  - TPV
  - Delivery
  - Contabilidade

**Validações:**
- Modo: obrigatório
- Pelo menos 1 método de pagamento

**Integração:**
- RPC: `update_restaurant_operational(restaurant_id, mode, payment_methods, integrations)`

**Navegação:**
- Botão "Voltar" → volta para Fase 5
- Botão "Próximo" → avança para Fase 7

---

### 🚀 FASE 7: ATIVAÇÃO

**Arquivo:** `merchant-portal/src/pages/Onboarding/ActivationStep.tsx` (criar)

**Componentes:**
- Resumo visual do que será criado:
  - Nome do restaurante
  - Número de mesas
  - Número de zonas
  - Horários configurados
  - Número de produtos
  - Número de pessoas
  - Modo de operação
- Lista: O que acontece ao ativar
- Botão grande: "ATIVAR RESTAURANTE 🚀"

**Ao clicar em "ATIVAR":**

1. **Atualizar restaurante:**
   - RPC: `activate_restaurant(restaurant_id)` → `status = 'ACTIVE'`

2. **Criar primeiro pedido de teste:**
   - RPC: `create_test_order(restaurant_id)` → cria pedido na "Mesa 1" com 1 produto

3. **Processar pedido:**
   - Aparece no KDS automaticamente
   - Consome estoque (se aplicável)
   - Gera SLA

4. **Mentor IA comenta:**
   - Criar evento: `MENTOR_WELCOME_MESSAGE`
   - Mensagem: "Seu primeiro pedido foi criado! Veja no KDS."

5. **Redirecionar:**
   - Para `/owner/vision` (ou `/manager/dashboard` se role = manager)
   - Dashboard mostra dados reais
   - Primeiro pedido visível

**Navegação:**
- Botão "Voltar" → volta para Fase 6
- Botão "ATIVAR" → executa ativação e redireciona

---

## 🏗️ ESTRUTURA DE ARQUIVOS

```
merchant-portal/src/
├── pages/
│   └── Onboarding/
│       ├── OnboardingWizard.tsx (container principal)
│       ├── IdentityStep.tsx
│       ├── LocationStep.tsx
│       ├── ScheduleStep.tsx
│       ├── MenuStep.tsx
│       ├── PeopleStep.tsx
│       ├── OperationalStep.tsx
│       └── ActivationStep.tsx
├── context/
│   └── OnboardingContext.tsx (gerencia estado do wizard)
└── features/
    └── onboarding/
        ├── hooks/
        │   ├── useCreateRestaurant.ts
        │   ├── useCreateTables.ts
        │   ├── useCreateProducts.ts
        │   └── useActivateRestaurant.ts
        └── services/
            └── onboardingService.ts
```

---

## 🔧 RPCs NECESSÁRIOS (criar no Core)

```sql
-- Fase 1: Identidade
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
  INSERT INTO restaurant (name, type, country, timezone, currency, locale, status)
  VALUES (p_name, p_type, p_country, p_timezone, p_currency, p_locale, 'SETUP_IN_PROGRESS')
  RETURNING id INTO v_restaurant_id;
  
  RETURN v_restaurant_id;
END;
$$ LANGUAGE plpgsql;

-- Fase 2: Localização
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
  SET address = p_address,
      city = p_city,
      postal_code = p_postal_code,
      state = p_state,
      latitude = p_latitude,
      longitude = p_longitude,
      capacity = p_capacity
  WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_tables_batch(
  p_restaurant_id UUID,
  p_tables JSONB
) RETURNS VOID AS $$
DECLARE
  v_table JSONB;
BEGIN
  FOR v_table IN SELECT * FROM jsonb_array_elements(p_tables)
  LOOP
    INSERT INTO tables (restaurant_id, number, capacity, zone_id)
    VALUES (
      p_restaurant_id,
      v_table->>'number',
      (v_table->>'capacity')::INTEGER,
      (SELECT id FROM zones WHERE restaurant_id = p_restaurant_id AND name = v_table->>'zone')
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fase 3: Horários
CREATE OR REPLACE FUNCTION create_schedules_batch(
  p_restaurant_id UUID,
  p_schedules JSONB
) RETURNS VOID AS $$
DECLARE
  v_schedule JSONB;
BEGIN
  FOR v_schedule IN SELECT * FROM jsonb_array_elements(p_schedules)
  LOOP
    INSERT INTO schedules (restaurant_id, day_of_week, open, start_time, end_time)
    VALUES (
      p_restaurant_id,
      (v_schedule->>'day_of_week')::INTEGER,
      (v_schedule->>'open')::BOOLEAN,
      (v_schedule->>'start_time')::TIME,
      (v_schedule->>'end_time')::TIME
    )
    ON CONFLICT (restaurant_id, day_of_week) DO UPDATE
    SET open = EXCLUDED.open,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fase 4: Produtos
CREATE OR REPLACE FUNCTION create_products_batch(
  p_restaurant_id UUID,
  p_products JSONB
) RETURNS VOID AS $$
DECLARE
  v_product JSONB;
  v_product_id UUID;
  v_ingredient JSONB;
BEGIN
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    INSERT INTO products (restaurant_id, name, price, category, station)
    VALUES (
      p_restaurant_id,
      v_product->>'name',
      (v_product->>'price')::DECIMAL,
      v_product->>'category',
      v_product->>'station'
    )
    RETURNING id INTO v_product_id;
    
    -- Criar receita (ingredientes)
    IF (v_product->>'consumes_stock')::BOOLEAN THEN
      FOR v_ingredient IN SELECT * FROM jsonb_array_elements(v_product->'ingredients')
      LOOP
        -- Criar item no estoque se não existir
        INSERT INTO inventory_items (restaurant_id, name, unit, current_stock)
        VALUES (p_restaurant_id, v_ingredient->>'item_name', v_ingredient->>'unit', 0)
        ON CONFLICT DO NOTHING;
        
        -- Criar receita
        INSERT INTO recipes (product_id, inventory_item_id, quantity, unit)
        VALUES (
          v_product_id,
          (SELECT id FROM inventory_items WHERE restaurant_id = p_restaurant_id AND name = v_ingredient->>'item_name'),
          (v_ingredient->>'quantity')::DECIMAL,
          v_ingredient->>'unit'
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fase 5: Pessoas
CREATE OR REPLACE FUNCTION create_user_with_role(
  p_restaurant_id UUID,
  p_name VARCHAR,
  p_email VARCHAR,
  p_role VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO users (restaurant_id, name, email, role)
  VALUES (p_restaurant_id, p_name, p_email, p_role)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Fase 6: Operacional
CREATE OR REPLACE FUNCTION update_restaurant_operational(
  p_restaurant_id UUID,
  p_mode VARCHAR,
  p_payment_methods JSONB,
  p_integrations JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE restaurant
  SET mode = p_mode,
      payment_methods = p_payment_methods,
      integrations = p_integrations
  WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql;

-- Fase 7: Ativação
CREATE OR REPLACE FUNCTION activate_restaurant(
  p_restaurant_id UUID
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- Ativar restaurante
  UPDATE restaurant
  SET status = 'ACTIVE'
  WHERE id = p_restaurant_id;
  
  -- Criar primeiro pedido de teste
  INSERT INTO orders (restaurant_id, table_id, status, source)
  VALUES (
    p_restaurant_id,
    (SELECT id FROM tables WHERE restaurant_id = p_restaurant_id ORDER BY number LIMIT 1),
    'OPEN',
    'TEST'
  )
  RETURNING id INTO v_order_id;
  
  -- Adicionar 1 item ao pedido (primeiro produto do cardápio)
  INSERT INTO order_items (order_id, product_id, quantity, status)
  VALUES (
    v_order_id,
    (SELECT id FROM products WHERE restaurant_id = p_restaurant_id ORDER BY created_at LIMIT 1),
    1,
    'PENDING'
  );
  
  -- Criar evento de mentoria
  INSERT INTO events (restaurant_id, event_type, payload)
  VALUES (
    p_restaurant_id,
    'MENTOR_WELCOME_MESSAGE',
    jsonb_build_object(
      'message', 'Seu primeiro pedido foi criado! Veja no KDS.',
      'order_id', v_order_id
    )
  );
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 TESTE DE VALIDAÇÃO

**Cenário End-to-End:**
1. Acessar `/onboarding`
2. Completar Fase 1 (Identidade)
3. Completar Fase 2 (Localização) → verificar mesas geradas
4. Completar Fase 3 (Horários)
5. Completar Fase 4 (Cardápio) → criar 3 produtos com ingredientes
6. Completar Fase 5 (Pessoas) → criar gerente + funcionário
7. Completar Fase 6 (Operacional)
8. Ativar (Fase 7) → verificar:
   - Restaurante ativo
   - Primeiro pedido criado
   - Pedido aparece no KDS
   - Mentor IA comenta
   - Dashboard mostra dados reais

**Critério de Pronto:**
- ✅ Wizard completo funciona sem erros
- ✅ Dados persistem no banco
- ✅ Após ativar, restaurante está operacional
- ✅ Primeiro pedido visível no KDS
- ✅ Dashboard mostra dados reais (não placeholders)

---

## ⚠️ REGRAS IMPORTANTES

1. **Linear e obrigatório:** Não pode pular fases
2. **Persistência:** Salvar progresso após cada fase
3. **Validações:** Não avançar sem validar fase atual
4. **Feedback:** Loading, sucesso, erros claros
5. **Cancelar:** Salvar draft e permitir continuar depois

---

## 🎯 CRITÉRIO DE SUCESSO FINAL

✅ **Wizard está pronto quando:**
- Posso criar restaurante completo em 5-10 minutos
- Todas as 7 fases funcionam
- Dados persistem no banco
- Após ativar, restaurante está "vivo"
- Primeiro pedido aparece no KDS
- Dashboard mostra dados reais
- **Zero placeholders visíveis**

---

**Prompt criado em:** 26/01/2026  
**Status:** ✅ Pronto para execução
