# Inventário + Estoque MVP - ChefIApp POS Core

**Data:** 2026-01-26  
**Status:** ✅ Implementado (Fase I - Foundation)

---

## 🎯 Objetivo

Transformar o ChefIApp de um "POS esperto" em um **Sistema Operacional de Restaurante** completo, conectando:

- **Menu** (o que vendemos)
- **Inventário** (equipamentos físicos)
- **Estoque** (ingredientes e quantidades)
- **Pedidos** (consumo em tempo real)
- **Task Engine** (reação a escassez, gargalos e rotinas)

---

## 📐 Arquitetura Mental

```
MENU
 ├─ define tempos
 ├─ define estação
 └─ define consumo (BOM)

INVENTÁRIO
 ├─ define equipamentos
 ├─ define capacidade
 └─ define localização

ESTOQUE
 ├─ entradas
 ├─ saídas
 └─ mínimos

PEDIDOS
 └─ consomem estoque

TASK ENGINE
 ├─ reage a atraso
 ├─ reage a escassez
 ├─ reage a gargalo
 └─ mantém operação viva
```

---

## 🗄️ Schema de Dados

### 1. Locais (`gm_locations`)

Onde as coisas existem fisicamente.

**Campos:**
- `restaurant_id` - Restaurante
- `name` - Nome do local (ex: "Cozinha Principal", "Bar")
- `kind` - Tipo: `KITCHEN`, `BAR`, `STORAGE`, `SERVICE`, `OTHER`

**Exemplo:**
```sql
INSERT INTO gm_locations (restaurant_id, name, kind) VALUES
  ('...', 'Cozinha Principal', 'KITCHEN'),
  ('...', 'Bar', 'BAR'),
  ('...', 'Estoque Seco', 'STORAGE');
```

---

### 2. Equipamentos (`gm_equipment`)

Inventário físico do restaurante.

**Campos:**
- `restaurant_id` - Restaurante
- `location_id` - Local onde está (opcional)
- `name` - Nome (ex: "Geladeira 1", "Chapa")
- `kind` - Tipo: `FRIDGE`, `FREEZER`, `OVEN`, `GRILL`, `PLANCHA`, `COFFEE_MACHINE`, `ICE_MACHINE`, `KEG_SYSTEM`, `SHELF`, `OTHER`
- `capacity_note` - Nota sobre capacidade (ex: "4 burgers simultâneos")
- `is_active` - Se está ativo

**Exemplo:**
```sql
INSERT INTO gm_equipment (restaurant_id, location_id, name, kind, capacity_note) VALUES
  ('...', (SELECT id FROM gm_locations WHERE name = 'Cozinha Principal'), 'Chapa', 'PLANCHA', '4 burgers simultâneos'),
  ('...', (SELECT id FROM gm_locations WHERE name = 'Bar'), 'Geladeira Bar', 'FRIDGE', NULL);
```

---

### 3. Ingredientes (`gm_ingredients`)

O que pode ser medido e consumido.

**Campos:**
- `restaurant_id` - Restaurante
- `name` - Nome (ex: "Carne", "Limão", "Gelo")
- `unit` - Unidade: `g`, `kg`, `ml`, `l`, `unit`

**Exemplo:**
```sql
INSERT INTO gm_ingredients (restaurant_id, name, unit) VALUES
  ('...', 'Carne', 'g'),
  ('...', 'Limão', 'unit'),
  ('...', 'Gelo', 'g'),
  ('...', 'Cerveja', 'ml');
```

---

### 4. Estoque por Local (`gm_stock_levels`)

Quantidade atual e mínimo por local.

**Campos:**
- `restaurant_id` - Restaurante
- `location_id` - Local
- `ingredient_id` - Ingrediente
- `qty` - Quantidade atual
- `min_qty` - Mínimo operacional (abaixo disso gera tarefa)

**Exemplo:**
```sql
INSERT INTO gm_stock_levels (restaurant_id, location_id, ingredient_id, qty, min_qty) VALUES
  ('...', (SELECT id FROM gm_locations WHERE name = 'Cozinha Principal'), 
   (SELECT id FROM gm_ingredients WHERE name = 'Carne'), 5000, 1000),
  ('...', (SELECT id FROM gm_locations WHERE name = 'Bar'), 
   (SELECT id FROM gm_ingredients WHERE name = 'Limão'), 20, 10);
```

---

### 5. Receita do Produto (`gm_product_bom`)

Bill of Materials: liga produtos do menu aos ingredientes.

**Campos:**
- `restaurant_id` - Restaurante
- `product_id` - Produto (do menu)
- `ingredient_id` - Ingrediente
- `qty_per_unit` - Quantidade por unidade do produto (ex: 150g de carne por hambúrguer)
- `station` - Estação: `KITCHEN` ou `BAR`
- `preferred_location_kind` - Local preferencial (opcional)

**Exemplo:**
```sql
-- Hambúrguer Artesanal
INSERT INTO gm_product_bom (restaurant_id, product_id, ingredient_id, qty_per_unit, station) VALUES
  ('...', (SELECT id FROM gm_products WHERE name = 'Hambúrguer Artesanal'),
   (SELECT id FROM gm_ingredients WHERE name = 'Carne'), 150, 'KITCHEN'),
  ('...', (SELECT id FROM gm_products WHERE name = 'Hambúrguer Artesanal'),
   (SELECT id FROM gm_ingredients WHERE name = 'Pão'), 1, 'KITCHEN');

-- Mojito
INSERT INTO gm_product_bom (restaurant_id, product_id, ingredient_id, qty_per_unit, station) VALUES
  ('...', (SELECT id FROM gm_products WHERE name = 'Mojito'),
   (SELECT id FROM gm_ingredients WHERE name = 'Rum'), 50, 'BAR'),
  ('...', (SELECT id FROM gm_products WHERE name = 'Mojito'),
   (SELECT id FROM gm_ingredients WHERE name = 'Limão'), 1, 'BAR'),
  ('...', (SELECT id FROM gm_products WHERE name = 'Mojito'),
   (SELECT id FROM gm_ingredients WHERE name = 'Gelo'), 200, 'BAR');
```

---

### 6. Ledger de Movimentos (`gm_stock_ledger`)

Auditoria completa de movimentação de estoque.

**Campos:**
- `restaurant_id` - Restaurante
- `location_id` - Local
- `ingredient_id` - Ingrediente
- `order_id` - Pedido (opcional)
- `order_item_id` - Item do pedido (opcional)
- `action` - Ação: `IN`, `OUT`, `RESERVE`, `RELEASE`, `CONSUME`, `ADJUST`
- `qty` - Quantidade (sempre positiva)
- `reason` - Motivo (opcional)
- `created_by_role` - Role do criador
- `created_by_user_id` - ID do usuário

**Exemplo:**
```sql
-- Entrada de estoque
INSERT INTO gm_stock_ledger (restaurant_id, location_id, ingredient_id, action, qty, reason) VALUES
  ('...', '...', '...', 'IN', 5000, 'Compra de fornecedor');

-- Consumo de pedido
INSERT INTO gm_stock_ledger (restaurant_id, location_id, ingredient_id, order_id, order_item_id, action, qty) VALUES
  ('...', '...', '...', '...', '...', 'CONSUME', 150);
```

---

## 🔧 RPCs

### `simulate_order_stock_impact`

Simula o impacto de um pedido no estoque **antes** de criar o pedido.

**Parâmetros:**
- `p_restaurant_id` - UUID do restaurante
- `p_items` - JSONB com array de itens: `[{"product_id": "...", "quantity": 2}]`

**Retorno:**
```json
[
  {
    "ingredient_id": "...",
    "needed_qty": 450,
    "available_qty": 5000,
    "will_be": 4550,
    "below_min": false,
    "station": "KITCHEN"
  }
]
```

**Uso:**
```sql
SELECT simulate_order_stock_impact(
  '00000000-0000-0000-0000-000000000100',
  '[{"product_id": "00000000-0000-0000-0000-000000000001", "quantity": 3}]'::jsonb
);
```

**Integração:**
- Chamar antes de criar pedido em QR/TPV/AppStaff
- Se `below_min = true`, mostrar aviso (não bloquear no MVP)
- Usar para gerar tarefas de estoque crítico

---

## 🎯 Tipos de Tarefa (Task Engine)

Novos tipos adicionados:

1. **`ESTOQUE_CRITICO`** - Estoque abaixo do mínimo após consumo
2. **`RUPTURA_PREVISTA`** - Estoque vai acabar antes de atender pedidos abertos
3. **`EQUIPAMENTO_CHECK`** - Rotinas de manutenção/higiene por equipamento

**Exemplo de tarefa gerada:**
```json
{
  "task_type": "ESTOQUE_CRITICO",
  "station": "BAR",
  "priority": "ALTA",
  "message": "Estoque crítico: Limão (BAR) — repor antes do pico",
  "context": {
    "ingredient": "Limão",
    "location": "Bar",
    "will_be": 8,
    "min_qty": 10,
    "impacted_products": ["Mojito", "Caipirinha"]
  }
}
```

---

## 📋 Fluxo de Consumo (Futuro - Fase IV)

Quando um pedido é criado:

1. **Calcular ingredientes necessários** (via BOM)
2. **Criar ledger RESERVE** (ou CONSUME direto)
3. **Decrementar `gm_stock_levels.qty`**
4. **Se `qty <= min_qty` após consumo:**
   - Gerar tarefa `ESTOQUE_CRITICO`
   - Station inferido pelo BOM
   - Contexto com ingrediente, local, produtos impactados

**Nota:** Isso será implementado no hook do `create_order_atomic` na Fase IV.

---

## 🧪 Testes

### Script de Teste

```bash
./scripts/test-stock-simulate.sh
```

O script:
1. Cria dados seed mínimos (local, ingredientes, estoque, BOM)
2. Chama `simulate_order_stock_impact` com itens fake
3. Valida JSON de retorno

---

## 📁 Estrutura de Arquivos

```
docker-core/schema/migrations/
  ├── 20260126_create_inventory_stock.sql      # Tabelas base
  └── 20260126_add_stock_task_types_and_rpc.sql # Tipos de tarefa + RPC

docs/
  └── INVENTARIO_ESTOQUE_MVP.md                # Esta documentação

scripts/
  └── test-stock-simulate.sh                   # Script de teste
```

---

## ✅ Checklist de Implementação

### Fase I — Foundation ✅
- [x] Criar tabelas: `gm_locations`, `gm_equipment`, `gm_ingredients`, `gm_stock_levels`, `gm_stock_ledger`, `gm_product_bom`
- [x] Seeds mínimos (1 restaurante piloto + locais padrão)
- [x] Teste: criar ingrediente + stock_level via SQL

### Fase II — Receitas (BOM) 🔄
- [ ] Criar `gm_product_bom`
- [ ] UI mínima `/ops-setup/recipes`
- [ ] Teste: SQL calcula "needed"

### Fase III — Simulação 🔄
- [x] RPC `simulate_order_stock_impact`
- [ ] QR/TPV/AppStaff chamam simulação antes de enviar
- [ ] Teste: pedido de 2 hambúrgueres acusa carne abaixo do mínimo

### Fase IV — Consumo Real 🔄
- [ ] Hook no `create_order_atomic`: ledger + decremento de stock
- [ ] Task Engine: `ESTOQUE_CRITICO`
- [ ] Teste: criar pedido -> estoque cai -> tarefa nasce

---

## 🚀 Próximos Passos

1. **UI Setup Operacional** (`/ops-setup/inventory`, `/ops-setup/stock`, `/ops-setup/recipes`)
2. **Integração de Aviso** (QR/TPV/AppStaff mostram aviso quando `below_min`)
3. **Hook de Consumo** (integrar consumo real no `create_order_atomic`)
4. **Tarefas Automáticas** (gerar tarefas de estoque crítico)

---

*"Inventário e estoque não são features extras. São parte estrutural do sistema de tarefas."*
