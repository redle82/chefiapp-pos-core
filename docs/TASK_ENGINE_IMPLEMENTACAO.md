# ✅ Task Engine — Implementação Completa

**Data:** 2026-01-26  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Objetivo

Sistema de tarefas automáticas baseado em eventos operacionais. Tarefas não nascem manualmente — nascem do contrato operacional.

---

## ✅ O Que Foi Implementado

### 1. Schema `gm_tasks`

**Arquivo:** `docker-core/schema/migrations/20260126_create_task_engine.sql`

**Campos principais:**
- `task_type`: Tipo de tarefa (ATRASO_ITEM, ACUMULO_BAR, etc)
- `station`: Estação responsável (BAR, KITCHEN, SERVICE)
- `priority`: Prioridade (LOW, MEDIA, ALTA, CRITICA)
- `message`: Mensagem da tarefa
- `context`: JSONB com dados adicionais (tempo, itens, etc)
- `status`: Estado (OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED)
- `auto_generated`: Se foi gerada automaticamente

**Índices:**
- `idx_tasks_restaurant_status`
- `idx_tasks_station_priority`
- `idx_tasks_order`
- `idx_tasks_order_item`

---

### 2. RPC `generate_tasks_from_orders`

**Arquivo:** `docker-core/schema/rpc_generate_tasks.sql`

**Funcionalidade:**
- Gera tarefas automáticas baseadas em eventos operacionais
- **Foco inicial:** Cozinha (atraso de item >120% do tempo)
- Prioridade baseada em `delay_ratio`:
  - `>50%` → CRITICA
  - `>25%` → ALTA
  - `>20%` → MEDIA

**Trigger:**
- Item ultrapassa 120% do `prep_time_seconds`
- Item não está pronto (`ready_at IS NULL`)
- Item pertence à estação KITCHEN
- Não existe tarefa aberta para o item

---

### 3. Types TypeScript

**Arquivo:** `merchant-portal/src/core-boundary/docker-core/types.ts`

**Interface `CoreTask`:**
```typescript
export interface CoreTask {
  id: string;
  restaurant_id: string;
  order_id: string | null;
  order_item_id: string | null;
  task_type: 'ATRASO_ITEM' | 'ACUMULO_BAR' | 'ENTREGA_PENDENTE' | ...;
  station: 'BAR' | 'KITCHEN' | 'SERVICE' | null;
  priority: 'LOW' | 'MEDIA' | 'ALTA' | 'CRITICA';
  message: string;
  context: { ... };
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  ...
}
```

---

### 4. Readers/Writers

**Arquivo:** `merchant-portal/src/core-boundary/readers/TaskReader.ts`

**Funções:**
- `readOpenTasks(restaurantId, station?)`: Lê tarefas abertas
- `readTasksByOrder(orderId)`: Lê tarefas de um pedido
- `readTasksByItem(itemId)`: Lê tarefas de um item

**Arquivo:** `merchant-portal/src/core-boundary/writers/TaskWriter.ts`

**Funções:**
- `generateTasks(restaurantId)`: Gera tarefas automáticas
- `acknowledgeTask(taskId)`: Marca como reconhecida
- `resolveTask(taskId)`: Marca como resolvida
- `dismissTask(taskId)`: Dispensa tarefa

---

### 5. TaskPanel Component

**Arquivo:** `merchant-portal/src/pages/KDSMinimal/TaskPanel.tsx`

**Funcionalidades:**
- Exibe tarefas abertas
- Cores por prioridade (CRITICA=vermelho, ALTA=laranja, etc)
- Botões "Reconhecer" e "Resolver"
- Auto-gera tarefas a cada 10 segundos
- Atualiza a cada 5 segundos

---

### 6. Integração no KDS

**Arquivo:** `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`

**Funcionalidades:**
- TaskPanel exibido na tab "Cozinha"
- Highlight visual em itens com tarefa aberta:
  - Borda vermelha (2px)
  - Background vermelho claro
  - Badge "🧠 TAREFA"
  - Box shadow para destaque
- Carrega tarefas junto com pedidos

---

## 🎯 Fluxo Completo

1. **Item atrasa** (>120% do tempo esperado)
2. **RPC gera tarefa** automaticamente
3. **TaskPanel exibe** tarefa com prioridade
4. **KDS destaca** item com highlight vermelho
5. **Cozinheiro reconhece** ou resolve tarefa
6. **Tarefa fecha** e highlight desaparece

---

## 📊 Exemplo de Tarefa Gerada

```json
{
  "task_type": "ATRASO_ITEM",
  "station": "KITCHEN",
  "priority": "ALTA",
  "message": "Verificar atraso do Hambúrguer Artesanal – Mesa 5",
  "context": {
    "item_name": "Hambúrguer Artesanal",
    "expected_seconds": 720,
    "elapsed_seconds": 900,
    "delay_seconds": 180,
    "delay_ratio": 0.25,
    "table_number": 5
  }
}
```

---

## ✅ Status

**Todas as tarefas concluídas:**
- ✅ Schema `gm_tasks` criado
- ✅ RPC `generate_tasks_from_orders` criado
- ✅ Types TypeScript adicionados
- ✅ Readers/Writers implementados
- ✅ TaskPanel criado
- ✅ Integração no KDS completa
- ✅ Highlight visual implementado

---

## 🚀 Próximos Passos (Opcional)

1. **Acúmulo no Bar:** 3+ drinks acumulados → tarefa
2. **Entrega Pendente:** Pedido READY há 5+ min → tarefa
3. **Notificações:** Push notifications no AppStaff
4. **Métricas:** Dashboard de tarefas resolvidas

---

**Status:** ✅ Task Engine mínimo implementado e funcionando

**Foco inicial:** Cozinha (atraso de item)

**Próximo movimento:** Expandir para Bar e Gerente quando necessário
