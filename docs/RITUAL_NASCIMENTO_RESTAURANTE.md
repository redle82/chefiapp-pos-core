# 🧬 RITUAL DE NASCIMENTO DO RESTAURANTE
## Wizard Obrigatório — ChefIApp

**Objetivo:** Criar o restaurante do zero antes de qualquer operação. Linear, impossível de pular, inspirado na GloriaFood mas superior.

**Filosofia:** O sistema só existe depois que o restaurante nasce.

---

## 🎯 VISÃO GERAL

### 7 Fases Obrigatórias (em ordem)

1. **IDENTIDADE** — Quem eu sou
2. **EXISTÊNCIA FÍSICA** — Onde eu estou
3. **TEMPO** — Quando eu funciono
4. **CARDÁPIO MÍNIMO VIVO** — O que eu vendo
5. **PESSOAS** — Quem trabalha aqui
6. **REALIDADE OPERACIONAL** — Como vou operar
7. **ATIVAÇÃO** — Abrir restaurante agora

**Critério de Sucesso:** Após o wizard, o restaurante está vivo, operacional, e pode receber o primeiro pedido real.

---

## 🧬 FASE 1: IDENTIDADE

### Pergunta: "Quem eu sou?"

### Tela: `Onboarding/IdentityStep.tsx`

**Componentes:**

```
┌─────────────────────────────────────────┐
│  ← Voltar    [1/7] IDENTIDADE          │
├─────────────────────────────────────────┤
│                                         │
│  🏢 Qual é o nome do seu restaurante?  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Sofia Gastrobar Ibiza          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📍 Tipo de estabelecimento            │
│                                         │
│  ○ Restaurante                          │
│  ○ Bar                                  │
│  ○ Hotel                                │
│  ○ Beach Club                           │
│  ○ Café                                 │
│  ○ Outro: [_____________]               │
│                                         │
│  🌍 País                                │
│  ┌─────────────────────────────────┐   │
│  │ Spain ▼                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⏰ Fuso horário                         │
│  ┌─────────────────────────────────┐   │
│  │ Europe/Madrid ▼                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  💰 Moeda                                │
│  ┌─────────────────────────────────┐   │
│  │ EUR (€) ▼                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🗣️ Idioma                               │
│  ┌─────────────────────────────────┐   │
│  │ Português (PT) ▼                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│              [Cancelar]  [Próximo →]   │
└─────────────────────────────────────────┘
```

**Validações:**
- Nome: mínimo 3 caracteres, máximo 100
- Tipo: obrigatório
- País: obrigatório
- Fuso horário: derivado do país (mas editável)
- Moeda: derivado do país (mas editável)
- Idioma: obrigatório

**Dados coletados:**
```typescript
{
  name: string;
  type: 'RESTAURANT' | 'BAR' | 'HOTEL' | 'BEACH_CLUB' | 'CAFE' | 'OTHER';
  country: string;
  timezone: string; // IANA timezone
  currency: string; // ISO 4217
  locale: string; // ISO 639-1
}
```

**Resultado no banco:**
- Cria `restaurant` com `restaurant_id` gerado
- Campos: `name`, `type`, `country`, `timezone`, `currency`, `locale`
- Status: `SETUP_IN_PROGRESS`

---

## 🗺️ FASE 2: EXISTÊNCIA FÍSICA

### Pergunta: "Onde eu estou?"

### Tela: `Onboarding/LocationStep.tsx`

**Componentes:**

```
┌─────────────────────────────────────────┐
│  ← Voltar    [2/7] EXISTÊNCIA FÍSICA   │
├─────────────────────────────────────────┤
│                                         │
│  📍 Endereço completo                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Calle des caló, 109             │   │
│  │ cerca del hotel Can Salia        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Cidade: [Sant Josep de sa Talaia]     │
│  CEP:    [07829]                        │
│  Estado: [Balears ▼]                    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │      [MAPA GOOGLE]              │   │
│  │      (marcador no endereço)     │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✅ Endereço confirmado no mapa         │
│                                         │
│  ───────────────────────────────────   │
│                                         │
│  🪑 Capacidade                          │
│                                         │
│  Quantas pessoas cabem simultaneamente?│
│  ┌─────────────────────────────────┐   │
│  │ 50 pessoas                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📊 Mesas (geradas automaticamente)     │
│                                         │
│  Baseado na capacidade, sugerimos:     │
│  • 10 mesas de 2 pessoas                │
│  • 5 mesas de 4 pessoas                 │
│  • 2 mesas de 6 pessoas                 │
│                                         │
│  [Editar mesas]                         │
│                                         │
│  🏢 Zonas                               │
│                                         │
│  Quais áreas existem no restaurante?    │
│                                         │
│  ☑ Bar                                  │
│  ☑ Salão                                │
│  ☑ Cozinha                              │
│  ☑ Esplanada                            │
│  ☐ Terraço                              │
│                                         │
│              [Cancelar]  [Próximo →]   │
└─────────────────────────────────────────┘
```

**Validações:**
- Endereço: obrigatório, validar com geocoding
- Mapa: usuário deve confirmar localização
- Capacidade: mínimo 1, máximo 1000
- Mesas: gerar automaticamente baseado em capacidade, mas permitir edição
- Zonas: pelo menos 1 obrigatória

**Dados coletados:**
```typescript
{
  address: string;
  city: string;
  postal_code: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity: number;
  tables: Array<{
    number: string;
    capacity: number;
    zone: string;
  }>;
  zones: string[]; // ['BAR', 'SALON', 'KITCHEN', 'TERRACE']
}
```

**Resultado no banco:**
- Atualiza `restaurant` com `address`, `city`, `postal_code`, `state`, `latitude`, `longitude`, `capacity`
- Cria `tables[]` (uma por mesa)
- Cria `zones[]` (uma por zona)

**Geração automática de mesas:**
- Algoritmo: `capacity / 2.5` = número de mesas
- Distribuir: 60% mesas de 2, 30% mesas de 4, 10% mesas de 6
- Nomear: "Mesa 1", "Mesa 2", etc.

---

## ⏰ FASE 3: TEMPO

### Pergunta: "Quando eu funciono?"

### Tela: `Onboarding/ScheduleStep.tsx`

**Componentes:**

```
┌─────────────────────────────────────────┐
│  ← Voltar    [3/7] TEMPO               │
├─────────────────────────────────────────┤
│                                         │
│  🕐 Horários de funcionamento           │
│                                         │
│  Segunda-feira                          │
│  ☑ Aberto                               │
│  ┌──────────┐  até  ┌──────────┐      │
│  │ 08:00 ▼  │       │ 22:00 ▼  │      │
│  └──────────┘       └──────────┘      │
│                                         │
│  Terça-feira                            │
│  ☑ Aberto                               │
│  ┌──────────┐  até  ┌──────────┐      │
│  │ 08:00 ▼  │       │ 22:00 ▼  │      │
│  └──────────┘       └──────────┘      │
│                                         │
│  ... (todos os dias)                   │
│                                         │
│  [Aplicar a todos os dias]             │
│                                         │
│  ───────────────────────────────────   │
│                                         │
│  📅 Dias especiais                       │
│                                         │
│  ☑ Feriados (fechado)                  │
│  ☑ Aniversário do restaurante          │
│                                         │
│  [Adicionar dia especial]              │
│                                         │
│  ───────────────────────────────────   │
│                                         │
│  👥 Turnos padrão                       │
│                                         │
│  Turno Manhã: 08:00 - 14:00            │
│  Turno Tarde: 14:00 - 22:00            │
│                                         │
│  [Editar turnos]                       │
│                                         │
│              [Cancelar]  [Próximo →]   │
└─────────────────────────────────────────┘
```

**Validações:**
- Pelo menos 1 dia da semana aberto
- Horário de abertura < horário de fechamento
- Turnos não podem sobrepor

**Dados coletados:**
```typescript
{
  opening_hours: {
    monday: { open: true, start: '08:00', end: '22:00' },
    tuesday: { open: true, start: '08:00', end: '22:00' },
    // ... todos os dias
  };
  special_days: Array<{
    date: string; // ISO date
    type: 'HOLIDAY' | 'ANNIVERSARY' | 'SPECIAL';
    open: boolean;
  }>;
  default_shifts: Array<{
    name: string; // "Manhã", "Tarde", "Noite"
    start: string; // "08:00"
    end: string; // "14:00"
  }>;
}
```

**Resultado no banco:**
- Cria `schedules[]` (um por dia da semana)
- Cria `shifts_templates[]` (templates de turnos)

---

## 🍽️ FASE 4: CARDÁPIO MÍNIMO VIVO

### Pergunta: "O que eu vendo?"

### Tela: `Onboarding/MenuStep.tsx`

**Componentes:**

```
┌─────────────────────────────────────────┐
│  ← Voltar    [4/7] CARDÁPIO MÍNIMO      │
├─────────────────────────────────────────┤
│                                         │
│  Crie pelo menos 3 produtos            │
│  (você pode adicionar mais depois)     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Produto 1                        │   │
│  ├─────────────────────────────────┤   │
│  │ Nome: [Hambúrguer Artesanal]     │   │
│  │ Preço: [R$ 25,00]                │   │
│  │ Categoria: [Comida ▼]            │   │
│  │ Estação: [KITCHEN ▼]             │   │
│  │                                   │   │
│  │ 📦 Consome estoque?               │   │
│  │ ☑ Sim                             │   │
│  │                                   │   │
│  │ Ingredientes:                     │   │
│  │ • Pão (1 un)                      │   │
│  │ • Carne (200g)                    │   │
│  │ • Queijo (50g)                    │   │
│  │                                   │   │
│  │ [Adicionar ingrediente]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Produto 2                        │   │
│  ├─────────────────────────────────┤   │
│  │ Nome: [Coca-Cola]                │   │
│  │ Preço: [R$ 5,00]                 │   │
│  │ Categoria: [Bebida ▼]            │   │
│  │ Estação: [BAR ▼]                 │   │
│  │                                   │   │
│  │ 📦 Consome estoque?               │   │
│  │ ☑ Sim                             │   │
│  │                                   │   │
│  │ Ingredientes:                     │   │
│  │ • Coca-Cola (330ml)               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [+ Adicionar Produto]            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⚠️ Cada produto deve ter:               │
│  • Nome                                │
│  • Preço                                │
│  • Estação (BAR / KITCHEN)             │
│  • Ingredientes (se consome estoque)   │
│                                         │
│              [Cancelar]  [Próximo →]   │
└─────────────────────────────────────────┘
```

**Validações:**
- Mínimo 3 produtos
- Cada produto: nome, preço > 0, estação obrigatória
- Se "consome estoque": pelo menos 1 ingrediente
- Ingredientes devem existir no estoque (ou criar automaticamente)

**Dados coletados:**
```typescript
{
  products: Array<{
    name: string;
    price: number;
    category: 'FOOD' | 'DRINK';
    station: 'BAR' | 'KITCHEN';
    consumes_stock: boolean;
    ingredients: Array<{
      item_name: string; // "Pão", "Carne", "Queijo"
      quantity: number;
      unit: string; // "un", "g", "ml"
    }>;
  }>;
}
```

**Resultado no banco:**
- Cria `products[]` (um por produto)
- Cria `recipes[]` (receitas com ingredientes)
- Cria `inventory_items[]` automaticamente para ingredientes que não existem
- Cria `stations[]` (BAR, KITCHEN) se não existirem

**Lógica especial:**
- Se ingrediente não existe no estoque → criar automaticamente com estoque inicial = 0
- Mostrar alerta: "Estes itens foram criados no estoque. Configure quantidades mínimas depois."

---

## 👥 FASE 5: PESSOAS

### Pergunta: "Quem trabalha aqui?"

### Tela: `Onboarding/PeopleStep.tsx`

**Componentes:**

```
┌─────────────────────────────────────────┐
│  ← Voltar    [5/7] PESSOAS             │
├─────────────────────────────────────────┤
│                                         │
│  👤 Criar Gerente                       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Nome: [João Silva]              │   │
│  │ Email: [joao@restaurante.com]   │   │
│  │ Função: [Gerente ▼]             │   │
│  │                                   │   │
│  │ Este será o primeiro usuário     │   │
│  │ com acesso ao sistema.           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ───────────────────────────────────   │
│                                         │
│  👤 Criar Funcionário                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Nome: [Maria Santos]            │   │
│  │ Email: [maria@restaurante.com]  │   │
│  │ Função: [Garçom ▼]              │   │
│  │                                   │   │
│  │ Funções disponíveis:             │   │
│  │ • Garçom                          │   │
│  │ • Cozinha                         │   │
│  │ • Bar                             │   │
│  │ • Limpeza                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Adicionar mais funcionários]         │
│                                         │
│  ⚠️ Você pode adicionar mais pessoas   │
│  depois no módulo "Pessoas".            │
│                                         │
│              [Cancelar]  [Próximo →]   │
└─────────────────────────────────────────┘
```

**Validações:**
- Gerente: obrigatório, email válido
- Funcionário: pelo menos 1 obrigatório
- Email: único no sistema

**Dados coletados:**
```typescript
{
  manager: {
    name: string;
    email: string;
    role: 'MANAGER';
  };
  employees: Array<{
    name: string;
    email: string;
    role: 'WAITER' | 'KITCHEN' | 'BAR' | 'CLEANING';
  }>;
}
```

**Resultado no banco:**
- Cria `users[]` (gerente + funcionários)
- Cria `user_roles[]` (permissões)
- Envia email de boas-vindas (opcional)

---

## 💳 FASE 6: REALIDADE OPERACIONAL

### Pergunta: "Como vou operar?"

### Tela: `Onboarding/OperationalStep.tsx`

**Componentes:**

```
┌─────────────────────────────────────────┐
│  ← Voltar    [6/7] REALIDADE           │
├─────────────────────────────────────────┤
│                                         │
│  🎯 Modo de operação                    │
│                                         │
│  ○ Modo Treino                          │
│    • Pedidos não geram cobrança real    │
│    • Ideal para aprender o sistema      │
│    • Você pode mudar depois             │
│                                         │
│  ● Modo Produção                        │
│    • Pedidos geram cobrança real        │
│    • Integração com TPV                 │
│    • Dados reais desde o início         │
│                                         │
│  ───────────────────────────────────   │
│                                         │
│  💰 Pagamento                            │
│                                         │
│  Como você vai receber pagamentos?      │
│                                         │
│  ☑ Dinheiro                             │
│  ☑ Cartão (débito/crédito)             │
│  ☑ PIX                                  │
│  ☐ Vale-refeição                       │
│                                         │
│  ───────────────────────────────────   │
│                                         │
│  📊 Integrações                          │
│                                         │
│  Você já tem algum sistema?            │
│                                         │
│  ☐ TPV (Terminal de Pagamento)         │
│  ☐ Delivery (iFood, Uber Eats)        │
│  ☐ Contabilidade                       │
│                                         │
│  [Configurar depois]                   │
│                                         │
│  ⚠️ Você pode configurar integrações   │
│  depois no módulo "Configurações".     │
│                                         │
│              [Cancelar]  [Próximo →]   │
└─────────────────────────────────────────┘
```

**Validações:**
- Modo: obrigatório
- Pelo menos 1 método de pagamento

**Dados coletados:**
```typescript
{
  mode: 'TRAINING' | 'LIVE';
  payment_methods: Array<'CASH' | 'CARD' | 'PIX' | 'MEAL_VOUCHER'>;
  integrations: {
    tpv: boolean;
    delivery: boolean;
    accounting: boolean;
  };
}
```

**Resultado no banco:**
- Atualiza `restaurant` com `mode`, `payment_methods`
- Cria `integrations[]` (se aplicável)

---

## 🚀 FASE 7: ATIVAÇÃO

### Pergunta: "Abrir restaurante agora?"

### Tela: `Onboarding/ActivationStep.tsx`

**Componentes:**

```
┌─────────────────────────────────────────┐
│  ← Voltar    [7/7] ATIVAÇÃO            │
├─────────────────────────────────────────┤
│                                         │
│  ✅ Resumo do que será criado:          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🏢 Restaurante                   │   │
│  │ Sofia Gastrobar Ibiza            │   │
│  │                                   │   │
│  │ 🪑 17 mesas                       │   │
│  │ 🏢 4 zonas (Bar, Salão, etc.)    │   │
│  │ ⏰ Horários configurados          │   │
│  │ 🍽️ 3 produtos no cardápio         │   │
│  │ 👥 2 pessoas (1 gerente, 1 func) │   │
│  │ 💳 Modo: Produção                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ───────────────────────────────────   │
│                                         │
│  🎯 O que acontece ao ativar:           │
│                                         │
│  ✓ Restaurante fica operacional        │
│  ✓ Primeiro pedido de teste é criado   │
│  ✓ Aparece no KDS                       │
│  ✓ Consome estoque                      │
│  ✓ Gera SLA                             │
│  ✓ Mentor IA comenta                   │
│                                         │
│  ───────────────────────────────────   │
│                                         │
│  ⚠️ Você pode editar tudo depois        │
│  no módulo "Configurações".             │
│                                         │
│              [Cancelar]  [ATIVAR 🚀]   │
└─────────────────────────────────────────┘
```

**Ao clicar em "ATIVAR":**

1. **Criar restaurante completo no banco**
2. **Criar primeiro pedido de teste:**
   - Mesa: "Mesa 1"
   - Itens: 1 produto do cardápio
   - Status: OPEN
3. **Processar pedido:**
   - Aparece no KDS
   - Consome estoque (se aplicável)
   - Gera SLA
4. **Mentor IA comenta:**
   - "Seu primeiro pedido foi criado! Veja no KDS."
5. **Redirecionar para `/owner/vision`**
   - Dashboard mostra dados reais
   - Primeiro pedido visível
   - Sistema "vivo"

**Resultado no banco:**
- Atualiza `restaurant` com `status = 'ACTIVE'`
- Cria `order` (primeiro pedido de teste)
- Cria `kds_items[]` (itens do pedido)
- Cria `tasks[]` (tasks automáticas)
- Cria `events[]` (eventos de criação)

---

## 📊 SCHEMA SQL NECESSÁRIO

### Tabelas que já existem (verificar se têm todos os campos):

```sql
-- Restaurant (já existe, adicionar campos se faltarem)
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS currency VARCHAR(10);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS locale VARCHAR(10);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'TRAINING';
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS payment_methods JSONB;
ALTER TABLE restaurant ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'SETUP_IN_PROGRESS';

-- Tables (já existe, verificar campos)
-- Zones (criar se não existir)
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'BAR', 'SALON', 'KITCHEN', 'TERRACE'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules (criar se não existir)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id),
  day_of_week INTEGER NOT NULL, -- 0 = domingo, 6 = sábado
  open BOOLEAN DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, day_of_week)
);

-- Shift Templates (criar se não existir)
CREATE TABLE IF NOT EXISTS shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id),
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (já existe, verificar campos)
-- Recipes (criar se não existir)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (já existe, verificar campos)
-- User Roles (já existe, verificar campos)
```

---

## 🎯 FLUXO COMPLETO DO WIZARD

### Navegação:
- **Linear:** Só pode avançar após completar fase atual
- **Voltar:** Sempre permitido (exceto Fase 7)
- **Cancelar:** Salva progresso e permite continuar depois
- **Progresso:** Mostrar [X/7] em cada tela

### Persistência:
- Salvar progresso após cada fase
- Se usuário sair, retomar de onde parou
- Dados em `localStorage` + banco (draft)

### Validações:
- Não permitir avançar sem validar fase atual
- Mostrar erros inline
- Mensagens claras e acionáveis

### Feedback:
- Loading durante criação
- Mensagens de sucesso após cada fase
- Confirmação antes de ativar (Fase 7)

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar wizard** (7 telas)
2. **Criar RPCs** para cada fase
3. **Integrar com Core** (criar dados reais)
4. **Testar fluxo completo** (criar restaurante do zero)
5. **Ativar primeiro restaurante** (Sofia Gastrobar?)

---

**Documento criado em:** 26/01/2026  
**Status:** ✅ Pronto para implementação
