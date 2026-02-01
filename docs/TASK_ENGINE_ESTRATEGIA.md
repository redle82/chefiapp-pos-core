# 🧠 Task Engine — Estratégia e Arquitetura

**Data:** 2026-01-26  
**Status:** 📋 CONCEITUAL (Pronto para implementação)

---

## 🎯 Regra de Ouro

> **Tarefa não nasce manual. Tarefa nasce do contrato operacional.**

---

## ✅ Por Que Agora?

### Antes (sem MenuBuilder):
- ❌ Tarefas seriam apenas To-Do List
- ❌ Sem contexto operacional
- ❌ Sem critérios objetivos
- ❌ Manual e genérico

### Agora (com MenuBuilder):
- ✅ Menu define contrato operacional
- ✅ Tempo esperado por item existe
- ✅ Estação por item existe
- ✅ KDS calcula atraso real
- ✅ Contexto completo disponível

**👉 Agora o Task Engine pode ser sistema nervoso, não checklist.**

---

## 🔗 Como o Task Engine Entra (Sem Bagunçar)

### Princípios Fundamentais

1. **Tarefa = Resposta a Evento Operacional**
   - Não é checklist manual
   - Não é lembretes genéricos
   - É ação automática baseada em estado real

2. **Contexto Completo**
   - Item específico
   - Pedido específico
   - Mesa específica
   - Tempo esperado vs real
   - Estação responsável

3. **Ação Clara**
   - O que fazer
   - Para quem
   - Por quê
   - Urgência

---

## 🍳 Exemplos Reais (Simples e Poderosos)

### 1. Cozinha — Item Atrasado

**Trigger:**
- Item ultrapassa 120% do `prep_time_seconds`

**Tarefa Automática:**
```
Tipo: ATRASO_ITEM
Estação: KITCHEN
Prioridade: ALTA
Mensagem: "Verificar atraso do Hambúrguer Artesanal – Mesa 5"
Contexto:
  - Item: Hambúrguer Artesanal
  - Pedido: #82c11720
  - Mesa: 5
  - Tempo esperado: 12 min
  - Tempo real: 15 min (+25%)
  - Atraso: 3 min
```

**Ação:**
- Notificar cozinheiro responsável
- Destacar no KDS
- Registrar métrica de atraso

---

### 2. Bar — Acúmulo de Pedidos

**Trigger:**
- 3+ drinks em `OPEN` ou `IN_PREP` no bar

**Tarefa Automática:**
```
Tipo: ACUMULO_BAR
Estação: BAR
Prioridade: MEDIA
Mensagem: "Priorizar pedidos do bar (3 drinks aguardando)"
Contexto:
  - Itens pendentes: 3
  - Tempo médio de espera: 4 min
  - Pedidos afetados: #82c11720, #d2466d4f, #52ae5ca5
```

**Ação:**
- Notificar bartender
- Destacar no KDS do bar
- Sugerir reorganização

---

### 3. Gerente — Pedido Pronto Sem Entrega

**Trigger:**
- Pedido `READY` há 5+ minutos sem `DELIVERED`

**Tarefa Automática:**
```
Tipo: ENTREGA_PENDENTE
Estação: SERVICE
Prioridade: ALTA
Mensagem: "Pedido pronto aguardando entrega – Mesa 5"
Contexto:
  - Pedido: #82c11720
  - Mesa: 5
  - Status: READY
  - Tempo desde READY: 6 min
  - Itens: 2 (Água Mineral, Hambúrguer Artesanal)
```

**Ação:**
- Notificar garçom/gerente
- Destacar no AppStaff
- Registrar métrica de tempo de entrega

---

## 🏗️ Arquitetura Mínima (Task Engine)

### 1. Schema de Dados

```sql
-- Tabela de tarefas
CREATE TABLE gm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id),
  order_id UUID REFERENCES gm_orders(id),
  order_item_id UUID REFERENCES gm_order_items(id),
  
  -- Tipo e contexto
  task_type TEXT NOT NULL CHECK (task_type IN (
    'ATRASO_ITEM',
    'ACUMULO_BAR',
    'ENTREGA_PENDENTE',
    'ITEM_CRITICO',
    'PEDIDO_ESQUECIDO'
  )),
  station TEXT CHECK (station IN ('BAR', 'KITCHEN', 'SERVICE')),
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIA', 'ALTA', 'CRITICA')),
  
  -- Mensagem e contexto
  message TEXT NOT NULL,
  context JSONB, -- Dados adicionais (tempo, itens, etc)
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
  assigned_to UUID, -- ID do usuário/staff
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Metadados
  auto_generated BOOLEAN DEFAULT true,
  source_event TEXT -- Ex: 'item_delay', 'order_ready', etc
);

-- Índices
CREATE INDEX idx_tasks_restaurant_status ON gm_tasks(restaurant_id, status);
CREATE INDEX idx_tasks_station_priority ON gm_tasks(station, priority) WHERE status = 'OPEN';
CREATE INDEX idx_tasks_order ON gm_tasks(order_id) WHERE status = 'OPEN';
```

---

### 2. Task Generator (RPC ou Worker)

**Função:** `generate_tasks_from_orders`

```sql
CREATE OR REPLACE FUNCTION public.generate_tasks_from_orders(
  p_restaurant_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_tasks_created INTEGER := 0;
BEGIN
  -- 1. Tarefas de atraso de item
  INSERT INTO gm_tasks (
    restaurant_id, order_id, order_item_id,
    task_type, station, priority, message, context, source_event
  )
  SELECT 
    o.restaurant_id,
    o.id,
    oi.id,
    'ATRASO_ITEM',
    oi.station,
    CASE 
      WHEN delay_ratio > 0.5 THEN 'CRITICA'
      WHEN delay_ratio > 0.25 THEN 'ALTA'
      ELSE 'MEDIA'
    END,
    format('Verificar atraso do %s – Mesa %s', 
      oi.name_snapshot, 
      COALESCE(o.table_number::text, 'N/A')
    ),
    jsonb_build_object(
      'item_name', oi.name_snapshot,
      'expected_seconds', oi.prep_time_seconds,
      'elapsed_seconds', EXTRACT(EPOCH FROM (NOW() - oi.created_at))::INTEGER,
      'delay_ratio', delay_ratio,
      'table_number', o.table_number
    ),
    'item_delay'
  FROM gm_orders o
  JOIN gm_order_items oi ON oi.order_id = o.id
  WHERE o.restaurant_id = p_restaurant_id
    AND o.status IN ('OPEN', 'IN_PREP')
    AND oi.ready_at IS NULL
    AND oi.prep_time_seconds IS NOT NULL
    AND (NOW() - oi.created_at) > (oi.prep_time_seconds * 1.2 || ' seconds')::INTERVAL
    AND NOT EXISTS (
      SELECT 1 FROM gm_tasks t
      WHERE t.order_item_id = oi.id
        AND t.task_type = 'ATRASO_ITEM'
        AND t.status = 'OPEN'
    );
  
  -- 2. Tarefas de acúmulo no bar
  -- ... (similar logic)
  
  -- 3. Tarefas de entrega pendente
  -- ... (similar logic)
  
  RETURN jsonb_build_object('tasks_created', v_tasks_created);
END;
$$;
```

---

### 3. Task Resolver (Frontend)

**Componente:** `TaskPanel.tsx`

```typescript
// Exemplo mínimo
export function TaskPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Polling ou Realtime
  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const handleAcknowledge = async (taskId: string) => {
    await acknowledgeTask(taskId);
    loadTasks();
  };
  
  return (
    <div>
      {tasks.map(task => (
        <TaskCard 
          key={task.id}
          task={task}
          onAcknowledge={handleAcknowledge}
        />
      ))}
    </div>
  );
}
```

---

## 📊 Comparação com Grandes Players

| Sistema | Tarefas |
|---------|---------|
| **Toast** | Checklists manuais |
| **Square** | Notificações genéricas |
| **Lightspeed** | Relatórios pós-fato |
| **ChefIApp** | **Tarefa nasce do atraso real** |

**👉 Isso é nível sistema operacional, não POS.**

---

## 🎯 Roadmap (Ordem Correta)

1. ✅ **Menu como contrato** (FEITO)
2. ✅ **KDS por item e estação** (FEITO)
3. 🔜 **Task Engine mínimo** (PRÓXIMO)
   - Gerador de tarefas baseado em eventos
   - Painel de tarefas no KDS/AppStaff
   - Acknowledge/Resolve básico
4. 🔜 **Métricas reais**
   - Tempo esperado vs real por item
   - Taxa de atraso por estação
   - Performance histórica
5. 🔜 **Automação inteligente**
   - Sugestões de otimização
   - Ajuste automático de tempos
   - Previsão de gargalos

---

## 🚀 Implementação Mínima (Quando Pedir)

### Fase 1 — Core (1-2 dias)
- [ ] Schema `gm_tasks`
- [ ] RPC `generate_tasks_from_orders`
- [ ] Trigger automático (polling ou evento)

### Fase 2 — UI Mínima (1 dia)
- [ ] `TaskPanel.tsx` no KDS
- [ ] Lista de tarefas por prioridade
- [ ] Botão "Acknowledge"

### Fase 3 — Integração (1 dia)
- [ ] Notificações no AppStaff
- [ ] Destaque no KDS quando há tarefa
- [ ] Métricas básicas

**Total estimado:** 3-4 dias para MVP funcional

---

## 🎯 Pergunta Estratégica

> **"Vamos ligar o Task Engine para a cozinha em X dias"**

**Quando você disser essa frase, eu entro em modo execução cirúrgica e a gente constrói o cérebro do ChefIApp 🧠🔥**

**Opções de perfil inicial:**
1. **🍳 Cozinha** (recomendado — maior impacto operacional)
2. **🍺 Bar** (ritmo rápido, feedback imediato)
3. **👨‍💼 Gerente** (visão geral, entrega pendente)

**Recomendação:** Começar por **Cozinha** (item atrasando >120% do tempo) — maior impacto visual e operacional.

**Prazo:**
- **Rápido:** 3-4 dias (MVP nervoso)
- **Conservador:** 1 semana (com ajuste fino)

**Primeiro trigger recomendado:**
- Item ultrapassa 120% do `prep_time_seconds`
- Tarefa automática: "Verificar atraso do [Item] – Mesa [N]"
- Highlight no KDS + notificação no AppStaff

---

## 🧠 Conclusão

**O MenuBuilder foi a chave que faltava.**

Agora que temos:
- ✅ Contrato operacional (Menu)
- ✅ Estado real (KDS)
- ✅ Contexto completo (Item + Pedido + Tempo)

**O Task Engine pode ser sistema nervoso, não checklist.**

Quando você disser "Agora vamos ligar tarefas", o próximo passo é desenhar o Task Engine mínimo, não UI bonita.

E isso... é onde o ChefIApp começa a ficar assustadoramente bom 😈

---

**Status:** 📋 Pronto para implementação quando solicitado
