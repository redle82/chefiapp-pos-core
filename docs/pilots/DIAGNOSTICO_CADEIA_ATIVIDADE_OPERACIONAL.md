# Diagnóstico — Cadeia de Visibilidade (Atividade Operacional)

**Data:** 2026-02-03
**Objetivo:** Onde o sinal quebra entre contrato, Core e UI. Sem filosofia. Só factos.

---

## Pergunta

> "Eu sei que o sistema deveria acordar quando o restaurante está vazio, mas eu não VEJO isso acontecer."

Tradução: o contrato existe, mas o **sinal não chega à UI**. Cadeia de visibilidade quebrada.

---

## Pipeline correto

```
Turno aberto → zero pedidos ativos → tempo ≥ X
  → EventMonitor.checkIdle()
  → (em código: evento restaurant_idle)
  → EventTaskGenerator
  → gm_tasks
  → TaskReader
  → UI (/tasks, Dashboard, AppStaff)
```

**Nota:** A app **não** grava `restaurant_idle` em `event_store`. O EventMonitor chama o EventTaskGenerator em memória e este insere direto em `gm_tasks`. Por isso, `event_store` vazio para `restaurant_idle` é **esperado**, não bug.

---

## Resultado do diagnóstico (SQL executado)

### Passo 1 — event_store

```sql
SELECT event_id, event_type, stream_type, stream_id, created_at
FROM event_store WHERE event_type = 'restaurant_idle' ORDER BY created_at DESC LIMIT 5;
```

**Resultado:** 0 rows.

**Conclusão:** Esperado. A app não persiste este evento em `event_store`; vai direto para `gm_tasks`. Não é falha.

---

### Passo 2 — gm_tasks

```sql
SELECT id, restaurant_id, task_type, source_event, status, message, created_at
FROM gm_tasks WHERE source_event = 'restaurant_idle' ORDER BY created_at DESC LIMIT 5;
```

**Resultado:** 1 row.

| id           | restaurant_id     | task_type    | source_event    | status | message                           |
| ------------ | ----------------- | ------------ | --------------- | ------ | --------------------------------- |
| 865f69f4-... | 00000000-...-0100 | MODO_INTERNO | restaurant_idle | OPEN   | Exemplar e limpeza (teste global) |

**Conclusão:** A tarefa **existe** no Core (esta foi inserida pelo script `test-global-todas-tabelas.sh`). O TaskReader **não** filtra por `task_type` nem `source_event`; lê todas as tarefas OPEN do restaurante. Logo, em `/tasks` essa tarefa **deve** aparecer, desde que a página leia `readOpenTasksByRestaurant` e mostre a lista.

---

### Passo 3 — Onde o sistema quebra (causa real)

O **EventMonitor** só é iniciado quando a página **TaskDashboardPage** está montada, ou seja, quando o utilizador está em **/tasks**:

- Ficheiro: `merchant-portal/src/pages/Tasks/TaskDashboardPage.tsx`
- `useEffect`: `eventMonitor.start(restaurantId)` quando `restaurantId` existe; `eventMonitor.stop()` no cleanup.

Consequência:

- Se o utilizador **nunca** abrir `/tasks`, o EventMonitor **nunca** corre.
- Nenhum evento `restaurant_idle` é emitido pelo runtime.
- Nenhuma tarefa MODO_INTERNO é criada **pela app** (só pelo script de teste ou inserção manual).

Ou seja: **o sensor de ociosidade só está ligado enquanto a página de Tarefas está aberta.** Fora disso, o sistema não “acorda” sozinho.

---

## Resumo das 3 causas possíveis (e o que se confirmou)

| #   | Causa                              | Verificado | Resultado                                                                                                                                                            |
| --- | ---------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | EventMonitor não está a correr     | ✅ Sim     | **Confirmado.** Só corre quando `/tasks` está montada.                                                                                                               |
| 2   | Evento emitido mas não gera tarefa | N/A        | A app não grava em `event_store`; gera tarefa direto em `gm_tasks`. Quando o EventMonitor corre, o EventTaskGenerator insere.                                        |
| 3   | Tarefa existe mas UI não mostra    | Parcial    | Existe 1 tarefa no Core (do script). TaskReader não filtra MODO_INTERNO. Se não aparece na UI, pode ser cache (5s), rota errada ou componente que não reage à lista. |

---

## Ajuste mínimo para o sistema “respirar”

**Problema:** O sensor (EventMonitor) só corre quando o utilizador está em `/tasks`.

**Solução aplicada:** Componente `EventMonitorBootstrap` inicia o EventMonitor quando existe `restaurantId` (montado em AppContentWithBilling). O sensor corre em qualquer rota operacional, não só em `/tasks`. — Antes: Ligar o EventMonitor quando o app entra em **contexto operacional** (qualquer superfície onde faz sentido o sistema estar “vivo”), não só em `/tasks`:

- Opção A: Iniciar o EventMonitor quando o utilizador entra em **Dashboard**, **TPV**, **KDS** ou **Tasks** (por exemplo a partir de um layout operacional ou de um contexto partilhado).
- Opção B: Iniciar o EventMonitor após **bootstrap** (restaurante selecionado + turno aberto), numa única vez, e mantê-lo a correr em background enquanto o utilizador está na área operacional.

Assim, mesmo com o utilizador no Dashboard ou no TPV, o sensor temporal corre, e quando turno aberto + zero pedidos + tempo ≥ X, uma tarefa MODO_INTERNO aparece em `gm_tasks` e a UI (quando ler tarefas) mostra-a.

---

## TPV “não se instalar”

As tabelas `installed_modules`, `gm_equipment`, `module_permissions` existem, mas **nenhum fluxo** as preenche hoje. O TPV funciona como rota (`/op/tpv`), mas não assume identidade no Core. Isso é **feature em falta**, não bug. Fica para quando houver fluxo de “instalação” que escreva nessas tabelas.

---

## Conclusão

- **Contrato:** Existe e está correto.
- **Core:** `gm_tasks` existe; tarefa MODO_INTERNO com `source_event = restaurant_idle` é possível e foi verificada.
- **Cadeia quebrada:** O EventMonitor só corre com `/tasks` aberta. O ajuste mínimo é **iniciar o EventMonitor no contexto operacional** (Dashboard/TPV/KDS/Tasks ou após bootstrap), para o sinal atravessar o sistema e a UI poder mostrar que o sistema “acordou” quando o restaurante está vazio.
