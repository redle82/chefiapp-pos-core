# 🧠 Task Packs Architecture — OPS + COMPLIANCE

**Data:** 2026-01-26  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Objetivo

Sistema de **Task Packs** (OPS + COMPLIANCE) por país/região/organização, com execução idempotente e suporte a evidências para compliance.

---

## 🏗️ Arquitetura

### 1. Packs (Catálogo)

**Tabela:** `gm_task_packs`

**Campos principais:**
- `code`: Identificador único (ex: 'ops.core.v1', 'compliance.eu.generic.v1')
- `name`: Nome do pack
- `version`: Versão (ex: '1.0.0')
- `country_code`: País (NULL = universal)
- `region_code`: Região (NULL = todo país)
- `org_mode`: SOLO | SMB | ENTERPRISE

**Exemplos:**
- `ops.core.v1` → Universal, SOLO
- `compliance.eu.generic.v1` → EU, SOLO
- `ops.kitchen.v1` → Universal, SOLO

---

### 2. Templates (Tarefas dentro de Packs)

**Tabela:** `gm_task_templates`

**Campos principais:**
- `pack_id`: Pack pai
- `code`: Identificador único dentro do pack
- `title`: Título da tarefa
- `category`: OPS | COMPLIANCE | MAINTENANCE
- `department`: KITCHEN | BAR | SERVICE | MANAGEMENT
- `station`: BAR | KITCHEN | SERVICE | MANAGEMENT
- `role_targets`: JSONB com roles (['chef', 'waiter', 'manager'])
- `schedule_cron`: Cron expression (NULL = não agendado)
- `event_trigger`: Evento que dispara (NULL = não por evento)
- `required_evidence`: NONE | TEMP_LOG | PHOTO | SIGNATURE | TEXT
- `legal_weight`: NONE | RECOMMENDED | REQUIRED | AUDIT_CRITICAL

**Exemplos:**
- `daily_open` → schedule_cron: '0 8 * * *' (diário 8h)
- `temp_check_fridge` → schedule_cron: '0 8,14,20 * * *' (3x ao dia)
- `item_delay` → event_trigger: 'item_delay' (por evento)

---

### 3. Ativação por Restaurante

**Tabela:** `gm_restaurant_packs`

**Campos principais:**
- `restaurant_id`: Restaurante
- `pack_id`: Pack ativado
- `enabled`: Se está ativo
- `version_locked`: Versão fixa (NULL = sempre última)

**Regra:**
- Um restaurante pode ter múltiplos packs ativados
- Packs podem ser desativados sem deletar histórico

---

### 4. Tarefas Reais

**Tabela:** `gm_tasks` (atualizada)

**Novos campos:**
- `template_id`: Link para template (quando aplicável)
- `evidence_json`: Evidência coletada (temperatura, foto, texto)
- `date_bucket`: Data para idempotência (YYYY-MM-DD)

**Origens:**
- **Agendadas:** Geradas por `generate_scheduled_tasks` (cron)
- **Eventos:** Geradas por `generate_tasks_from_orders` (item atrasado, etc)

---

## 🔄 Fluxo de Geração

### Tarefas Agendadas

1. **Template com `schedule_cron`** → RPC `generate_scheduled_tasks`
2. **Parse de cron** → Verifica se deve rodar hoje/agora
3. **Idempotência** → Verifica `date_bucket` (restaurant_id + template_id + date)
4. **Cria tarefa** → Se não existe, cria `gm_task` com `template_id`

**Exemplo:**
- Template: `daily_open` (cron: '0 8 * * *')
- Se for 8h da manhã → Cria tarefa
- Se já existe tarefa hoje → Não cria (idempotente)

---

### Tarefas por Eventos

1. **Evento ocorre** → Item atrasa, pedido pronto sem entrega, etc
2. **RPC `generate_tasks_from_orders`** → Verifica condições
3. **Busca template** → Se existe template com `event_trigger` correspondente
4. **Cria tarefa** → Linka `template_id` se encontrado

**Exemplo:**
- Item atrasa >120% do tempo
- Busca template com `event_trigger = 'item_delay'`
- Cria tarefa `ATRASO_ITEM` com `template_id` linkado

---

## 🌍 Segmentação

### Por País

```sql
-- Pack específico para EU
INSERT INTO gm_task_packs (code, name, country_code, ...)
VALUES ('compliance.eu.generic.v1', 'Compliance EU', 'EU', ...);

-- Pack universal
INSERT INTO gm_task_packs (code, name, country_code, ...)
VALUES ('ops.core.v1', 'Operações Core', NULL, ...);
```

### Por Região

```sql
-- Pack específico para São Paulo
INSERT INTO gm_task_packs (code, name, country_code, region_code, ...)
VALUES ('compliance.br.sp.v1', 'Compliance SP', 'BR', 'SP', ...);
```

### Por Organização

```sql
-- Pack para empresas grandes
INSERT INTO gm_task_packs (code, name, org_mode, ...)
VALUES ('ops.enterprise.v1', 'Operações Enterprise', 'ENTERPRISE', ...);
```

---

## 📋 Compliance (Sem Prometer Lei)

**Regra de Ouro:**

> Templates de compliance são **genéricos** e **versionados**. Não prometem lei específica.

**Exemplos:**
- ✅ "Registro de Temperaturas (quando aplicável)"
- ✅ "Registro de Alergénios (quando aplicável)"
- ❌ "Conforme Portaria 1234/2020" (não fazer)

**Legal Weight:**
- `NONE`: Sem peso legal
- `RECOMMENDED`: Recomendado
- `REQUIRED`: Obrigatório (genérico)
- `AUDIT_CRITICAL`: Crítico para auditoria

---

## 🔍 Evidências

### Tipos de Evidência

1. **TEMP_LOG**: Temperatura (número)
2. **PHOTO**: Foto (URL)
3. **SIGNATURE**: Assinatura (texto/base64)
4. **TEXT**: Texto livre
5. **NONE**: Sem evidência

### Armazenamento

```json
{
  "evidence_json": {
    "temperature": 4.5,
    "photo_url": "https://...",
    "text": "Observações...",
    "signature": "..."
  }
}
```

---

## 🚀 Como Adicionar Novo País/Pack

### 1. Criar Pack

```sql
INSERT INTO gm_task_packs (code, name, version, country_code, org_mode)
VALUES ('compliance.br.v1', 'Compliance Brasil', '1.0.0', 'BR', 'SOLO');
```

### 2. Criar Templates

```sql
INSERT INTO gm_task_templates (
  pack_id, code, title, category, department,
  schedule_cron, required_evidence, legal_weight
)
SELECT 
  p.id,
  'temp_log_daily',
  'Registro Diário de Temperaturas',
  'COMPLIANCE',
  'KITCHEN',
  '0 8,14,20 * * *',
  'TEMP_LOG',
  'AUDIT_CRITICAL'
FROM gm_task_packs p
WHERE p.code = 'compliance.br.v1';
```

### 3. Ativar no Restaurante

```sql
INSERT INTO gm_restaurant_packs (restaurant_id, pack_id, enabled)
SELECT 
  'restaurant-id'::UUID,
  p.id,
  true
FROM gm_task_packs p
WHERE p.code = 'compliance.br.v1';
```

---

## 📊 Packs Mínimos Implementados

### 1. OPS.CORE.V1 (Universal)
- 10 templates universais
- Abertura/fechamento, limpeza, reposição, etc
- `country_code`: NULL (universal)

### 2. OPS.KITCHEN.V1
- 5 templates específicos para cozinha
- Temperatura, mise-en-place, validade, limpeza profunda

### 3. OPS.BAR.V1
- 5 templates específicos para bar
- Temperatura, preparação, estoque, limpeza

### 4. COMPLIANCE.EU.GENERIC.V1
- 5 templates genéricos de compliance
- Temperaturas, alergénios, limpeza profunda, rastreio, HACCP
- `country_code`: 'EU'
- Sem prometer lei específica

---

## 🔧 RPCs

### `generate_scheduled_tasks(p_restaurant_id, p_now)`

**Funcionalidade:**
- Gera tarefas a partir de templates com `schedule_cron`
- Idempotente por `date_bucket`
- Retorna número de tarefas criadas

**Uso:**
```sql
SELECT public.generate_scheduled_tasks('restaurant-id'::UUID);
```

### `generate_tasks_from_orders(p_restaurant_id)`

**Funcionalidade:**
- Gera tarefas a partir de eventos (item atrasado, etc)
- Linka com templates quando `event_trigger` corresponde
- Retorna número de tarefas criadas

**Uso:**
```sql
SELECT public.generate_tasks_from_orders('restaurant-id'::UUID);
```

---

## 🎨 UI Mínima

### KDSMinimal
- **TaskPanel** exibido na tab "Cozinha"
- Mostra tarefas abertas ordenadas por prioridade
- Campos de evidência (TEMP_LOG, TEXT)
- Botões "Reconhecer" e "Resolver"

### AppStaffMinimal
- **Aba "Tarefas"** adicionada
- Mostra todas as tarefas abertas
- Filtro por estação (opcional)
- Suporte a evidências

---

## ✅ Status

**Implementado:**
- ✅ Schema completo (packs, templates, restaurant_packs)
- ✅ Seeds mínimos (4 packs, 25+ templates)
- ✅ RPCs (generate_scheduled_tasks, generate_tasks_from_orders atualizado)
- ✅ Core-boundary (TaskReader, TaskWriter atualizados)
- ✅ UI mínima (KDSMinimal, AppStaffMinimal)
- ✅ Script de teste (test-task-packs-level1.sh)

**Próximos passos:**
- Expandir para outros países
- Adicionar mais templates
- Suporte a PHOTO e SIGNATURE
- Dashboard de compliance

---

**Status:** ✅ Task Packs implementado e funcionando
