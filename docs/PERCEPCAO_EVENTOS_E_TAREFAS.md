# Percepção Operacional — Modelo de Eventos e Integração com Tarefas

**Data:** 2026-01-29  
**Referência:** [PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md](PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md)  
**Objetivo:** Definir os tipos de evento do módulo Percepção, o contrato de dados e a integração com tarefas (gm_tasks) e alertas (AlertEngine / Dashboard).

---

## 1. Tipos de evento (Percepção)

Eventos gerados pela **Camada 2 (Observação)** e **Camada 3 (Inferência)** do módulo Percepção. São a saída estruturada, não “descrição de cena”.

| Tipo (source_event) | Significado | Prioridade sugerida |
|---------------------|-------------|----------------------|
| `PERCEPTION_ZONE_IDLE` | Zona sem movimento há X minutos (acima do limiar configurado) | ALTA |
| `PERCEPTION_MOVEMENT_OUTSIDE_HOURS` | Movimento detetado em zona fora do horário esperado (ex.: estoque após fecho) | ALTA / CRITICA |
| `PERCEPTION_UNEXPECTED_ACTIVITY` | Atividade não esperada (ex.: após fechamento, zona que deveria estar vazia) | ALTA |

**Nomenclatura:** Prefixo `PERCEPTION_` para filtrar no Core e em dashboards; evita colisão com outros `source_event`.

---

## 2. Payload do evento (observação / inferência)

Contrato mínimo que quem gera o evento (backend de visão, worker, ou mock) deve enviar.

### 2.1 Estrutura comum

```ts
interface PerceptionEventPayload {
  /** Zona da câmera (obrigatório) */
  zone: "kitchen" | "floor" | "storage" | "cash" | "entrance" | string;
  /** Tipo de evento (igual a source_event) */
  event_type: "PERCEPTION_ZONE_IDLE" | "PERCEPTION_MOVEMENT_OUTSIDE_HOURS" | "PERCEPTION_UNEXPECTED_ACTIVITY";
  /** Timestamp ISO do evento */
  timestamp: string;
  /** Confiança 0–1 (opcional) */
  confidence?: number;
  /** Dados específicos por tipo (ver abaixo) */
  [key: string]: unknown;
}
```

### 2.2 Por tipo

**PERCEPTION_ZONE_IDLE**

```json
{
  "zone": "kitchen",
  "event_type": "PERCEPTION_ZONE_IDLE",
  "timestamp": "2026-01-29T14:30:00Z",
  "confidence": 0.82,
  "duration_minutes": 6,
  "movement": "low"
}
```

**PERCEPTION_MOVEMENT_OUTSIDE_HOURS**

```json
{
  "zone": "storage",
  "event_type": "PERCEPTION_MOVEMENT_OUTSIDE_HOURS",
  "timestamp": "2026-01-29T23:15:00Z",
  "confidence": 0.9,
  "expected_quiet_after": "22:00",
  "detected_at": "23:15"
}
```

**PERCEPTION_UNEXPECTED_ACTIVITY**

```json
{
  "zone": "floor",
  "event_type": "PERCEPTION_UNEXPECTED_ACTIVITY",
  "timestamp": "2026-01-29T01:00:00Z",
  "confidence": 0.75,
  "reason": "after_hours",
  "details": "Movimento após horário de fecho"
}
```

---

## 3. Integração com gm_tasks (Core)

### 3.1 Novos task_type (recomendado)

Para o Core refletir explicitamente a origem Percepção, adicionar ao `CHECK` de `gm_tasks.task_type`:

- `ZONA_PARADA` — mapeia de `PERCEPTION_ZONE_IDLE`
- `MOVIMENTO_FORA_HORARIO` — mapeia de `PERCEPTION_MOVEMENT_OUTSIDE_HOURS`
- `ATIVIDADE_INESPERADA` — mapeia de `PERCEPTION_UNEXPECTED_ACTIVITY`

**Migração (exemplo):** em `docker-core/schema/migrations/`, criar migração que faz `DROP CONSTRAINT gm_tasks_task_type_check` e `ADD CONSTRAINT ... IN (..., 'ZONA_PARADA', 'MOVIMENTO_FORA_HORARIO', 'ATIVIDADE_INESPERADA')`.

### 3.2 Fallback sem migração

Enquanto a migração não existir, usar um único tipo existente (ex.: `EQUIPAMENTO_CHECK`) e preencher:

- `source_event`: `PERCEPTION_ZONE_IDLE` | `PERCEPTION_MOVEMENT_OUTSIDE_HOURS` | `PERCEPTION_UNEXPECTED_ACTIVITY`
- `context`: incluir `zone`, `event_type`, `duration_minutes`, `confidence`, etc., conforme payload acima.

Assim o frontend e relatórios podem filtrar por `source_event LIKE 'PERCEPTION_%'` ou por `context->>'event_type'`.

### 3.3 Mapeamento evento → tarefa (EventTaskGenerator)

No `EventTaskGenerator` (ou equivalente) adicionar:

**taskTypeMap (quando existir migração):**

```ts
PERCEPTION_ZONE_IDLE: "ZONA_PARADA",
PERCEPTION_MOVEMENT_OUTSIDE_HOURS: "MOVIMENTO_FORA_HORARIO",
PERCEPTION_UNEXPECTED_ACTIVITY: "ATIVIDADE_INESPERADA",
```

**getDefaultTitle / getDefaultDescription / getDefaultPriority** para estes três `eventType`, usando `eventData.zone`, `eventData.duration_minutes`, etc., e prioridade ALTA/CRITICA conforme tipo.

**station:** derivar de `zone` quando possível (ex.: `kitchen` → KITCHEN, `floor` → SERVICE, `storage` → null ou BAR conforme convenção da casa).

### 3.4 Inserção em gm_tasks

- `restaurant_id`, `task_type`, `message` (título), `context` (payload completo + description), `status: 'OPEN'`, `auto_generated: true`, `source_event: event_type`.
- `order_id` / `order_item_id`: null para eventos de Percepção.
- `date_bucket`: opcional; usar para idempotência (ex.: um evento “zona parada” por zona por hora ou por intervalo configurável).

---

## 4. Idempotência / deduplicação

Evitar múltiplas tarefas iguais para o mesmo facto:

- **ZONA_PARADA:** mesma `zone` + mesmo `date_bucket` (ex.: hora ou 15 min) → no máximo uma tarefa OPEN por zona por bucket.
- **MOVIMENTO_FORA_HORARIO / ATIVIDADE_INESPERADA:** mesma `zone` + janela temporal (ex.: 30 min) → no máximo uma tarefa OPEN por zona nessa janela.

Implementação: antes de `INSERT`, fazer `SELECT` em `gm_tasks` por `restaurant_id`, `source_event`, `context->>'zone'`, e `date_bucket` ou `created_at` na janela; se existir OPEN, não inserir (ou atualizar mensagem/context se fizer sentido).

---

## 5. Integração com AlertEngine (frontend)

Para aparecer na lista de alertas e no Dashboard:

- **alertType:** igual a `event_type` (ex.: `PERCEPTION_ZONE_IDLE`).
- **category:** `operational`.
- **severity:** `high` ou `critical` conforme tipo (ex.: MOVEMENT_OUTSIDE_HOURS → critical).
- **title / message:** derivados do payload (ex.: “Cozinha sem movimento há 6 min”, “Movimento no estoque fora de horário”).
- **details:** objeto com `zone`, `duration_minutes`, `timestamp`, etc., para UI e histórico.

Quem emite o evento (worker/backend) pode chamar `AlertEngine.create()` com estes campos; ou um bridge no frontend escuta eventos de Percepção e chama `AlertEngine.create` + `EventTaskGenerator.generateFromEvent()` quando recebe o payload.

---

## 6. Onde os eventos aparecem

| Local | O quê |
|-------|--------|
| **Dashboard** | Cards de alertas / sugestões (ex.: “Cozinha parada há 6 min”; “Movimento no estoque fora de horário”). |
| **Alertas** | Lista do módulo Alertas: mesmo `alertType` e `details` para filtrar por Percepção. |
| **Tarefas** | Lista de tarefas (gm_tasks): tarefas com `source_event LIKE 'PERCEPTION_%'` ou `task_type IN ('ZONA_PARADA', ...)`. |
| **AppStaff / Equipe** | Opcional: tarefas com `station` e `assigneeRole` derivados da zona para atribuição. |

---

## 7. Resumo de implementação (ordem sugerida)

1. **Migração Core:** adicionar `ZONA_PARADA`, `MOVIMENTO_FORA_HORARIO`, `ATIVIDADE_INESPERADA` ao `task_type` em `gm_tasks`.
2. **EventTaskGenerator:** estender `taskTypeMap`, `getDefaultTitle`, `getDefaultDescription`, `getDefaultPriority` (e opcionalmente `calculateDueAt`) para os três `PERCEPTION_*`.
3. **Bridge de eventos:** quando o sistema receber um evento de Percepção (API, worker, ou mock), chamar `eventTaskGenerator.generateFromEvent(restaurantId, eventType, eventData)` com o payload normalizado; opcionalmente chamar `AlertEngine.create()` para aparecer nos alertas.
4. **Idempotência:** na lógica de criação de tarefa, usar `date_bucket` ou janela por zona + `source_event` para não duplicar.
5. **UI:** garantir que listas de tarefas e de alertas mostrem título/mensagem e filtros por Percepção (ex.: “Percepção” ou por `source_event`/task_type).

---

## Referências

- [PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md](PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md) — SPEC oficial do módulo
- `merchant-portal/src/core/tasks/EventTaskGenerator.ts` — geração de tarefas a partir de eventos
- `merchant-portal/src/core-boundary/docker-core/types.ts` — interface `CoreTask`
- `merchant-portal/src/core/alerts/AlertEngine.ts` — criação de alertas
- `docker-core/schema/migrations/20260126_add_stock_task_types_and_rpc.sql` — exemplo de migração para novos `task_type`
