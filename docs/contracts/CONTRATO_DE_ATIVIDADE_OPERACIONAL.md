# Contrato de Atividade Operacional

Contrato intermediário que responde à pergunta: _O restaurante está em atividade de atendimento ou em atividade interna?_ Estados IDLE / SERVING / CLOSING derivados do Core. Liga Turno e Tarefas: só em IDLE (e opcionalmente CLOSING) o sistema declara "agora é hora de tarefas" (limpeza, organização, checklist, preparação).

**Referência:** Subordinado ao [CONTRATO_DO_TURNO.md](./CONTRATO_DO_TURNO.md) e à [LEI_DO_TURNO.md](./LEI_DO_TURNO.md). Evento canónico: [EVENTS_AND_STREAMS.md](./EVENTS_AND_STREAMS.md) (RESTAURANT_IDLE).

Este contrato é o **cérebro** que faz o sistema respirar sozinho: sem ele, o sistema funciona mas não se move perante o silêncio (restaurante vazio). Com ele, o sistema emite o facto "restaurante ocioso" e gera tarefas de modo interno.

---

## 1. O que é

O Contrato de Atividade Operacional **não é** UI nem botão.

É um **contrato operacional** que diz:

> _Neste momento, o restaurante está em modo de atendimento ao cliente ou em modo de atividade interna (ocioso, encerramento)?_

Fica **abaixo do Contrato do Turno** na hierarquia:

- **Turno (Regente):** responde _quando_ o restaurante está operacional (turno aberto ou fechado).
- **Atividade Operacional:** responde _em que modo_ está: atendimento vs. atividade interna.

Sem turno aberto, não há estado de atividade operacional relevante para tarefas. Com turno aberto, o estado (IDLE / SERVING / CLOSING) determina se o sistema deve disparar tarefas de modo interno.

---

## 2. Estados

| Estado      | Condição (derivado do Core)                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IDLE**    | Turno aberto; zero pedidos ativos (OPEN, IN_PREP, READY); tempo desde o último pedido ≥ X minutos (ex.: 15).                                                                                          |
| **SERVING** | Um ou mais pedidos em curso (OPEN, IN_PREP, READY).                                                                                                                                                   |
| **CLOSING** | Turno ainda aberto; zero pedidos ativos; tempo desde o último pedido entre X e Y minutos (ex.: pós-atendimento, preparação para fecho). Opcional: pode ser tratado como IDLE para efeitos de tarefas. |

O estado **não é inferido por UI**. É **derivado** de dados do Core conforme a secção 3.

---

## 3. Fonte da verdade (Core)

O estado de atividade operacional é calculado a partir de:

- **Turno aberto:** `gm_cash_registers` — conforme [LEI_DO_TURNO.md](./LEI_DO_TURNO.md) e [CONTRATO_DO_TURNO.md](./CONTRATO_DO_TURNO.md). Só quando existe caixa em estado "aberto" para o restaurante é que se considera IDLE ou SERVING.
- **Pedidos ativos:** `gm_orders` com status OPEN, IN_PREP ou READY. Leitura já existente: `readActiveOrders(restaurantId)` (OrderReader).
- **Tempo desde o último pedido:** `gm_orders` — maior `created_at` no restaurante (ou no turno atual, se houver vínculo explícito). Diferença em minutos entre "agora" e esse instante.

Nenhuma tabela nova é obrigatória; o estado é **derivado** destas fontes.

---

## 4. Pipeline (fluxo que faz o sistema viver)

O sistema **não decide sozinho**; precisa de um **facto**. O pipeline abaixo é o que liga o silêncio ao movimento:

```
Turno aberto (gm_cash_registers)
        ↓
Nenhum pedido ativo (gm_orders: OPEN/IN_PREP/READY = 0)
        ↓
Tempo passa (sensor temporal: minutos desde último pedido ≥ X)
        ↓
EVENTO: RESTAURANT_IDLE (em código: restaurant_idle)
        ↓
EventTaskGenerator (ou equivalente)
        ↓
gm_tasks (tarefa tipo MODO_INTERNO, status OPEN)
        ↓
UI (Staff / Dashboard / Tarefas)
```

Sem o evento explícito de ociosidade, o sistema fica silencioso: não gera tarefas, parece "morto", mesmo estando correto. Com este pipeline, o sistema reage ao "restaurante vazio" e gera tarefas de modo interno.

---

## 5. Eventos emitidos por estado

| Estado      | Evento emitido             | Quando                                                                 | Nome em código    |
| ----------- | -------------------------- | ---------------------------------------------------------------------- | ----------------- |
| **IDLE**    | RESTAURANT_IDLE            | Turno aberto + zero pedidos ativos + tempo desde último pedido ≥ X min | `restaurant_idle` |
| **SERVING** | ORDER_CREATED              | Cada vez que um pedido é criado (TPV, App Staff, QR Mesa)              | `order_created`   |
| **CLOSING** | (opcional) RESTAURANT_IDLE | Se tratado como IDLE para tarefas; mesmo critério de tempo             | `restaurant_idle` |

Não se emite evento genérico "entrou em SERVING"; o sistema reage a **ORDER_CREATED** (pedido criado) para gerar tarefa PEDIDO_NOVO. Para IDLE, o evento é **RESTAURANT_IDLE** (sensor temporal + zero pedidos).

---

## 6. Tarefas que surgem em cada estado

| Estado      | Tipo de tarefa (gm_tasks.task_type) | Origem do evento | Exemplo de mensagem / UI                                              |
| ----------- | ----------------------------------- | ---------------- | --------------------------------------------------------------------- |
| **IDLE**    | MODO_INTERNO                        | RESTAURANT_IDLE  | "Modo interno: sem pedidos ativos há X min. Checklist e organização." |
| **SERVING** | PEDIDO_NOVO                         | ORDER_CREATED    | "Preparar pedido #N — Mesa X. Preparar e entregar."                   |
| **CLOSING** | MODO_INTERNO (se definido)          | RESTAURANT_IDLE  | Igual a IDLE; preparação para fecho.                                  |

Idempotência para IDLE: no máximo **uma** tarefa OPEN com `source_event = restaurant_idle` por restaurante (evitar dezenas de tarefas iguais). Para PEDIDO_NOVO: uma tarefa por pedido criado (ou por política de agregação, se definida).

---

## 7. Como aparece na UI

| Superfície                      | IDLE (ocioso)                                                                                   | SERVING (com pedidos)                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Dashboard**                   | Pode mostrar indicador "Modo interno" ou "Sem pedidos ativos"; lista de tarefas (MODO_INTERNO). | Métricas do dia; pedidos em curso; tarefas PEDIDO_NOVO. |
| **Tarefas (/tasks, App Staff)** | Lista de tarefas de modo interno (limpeza, checklist, organização).                             | Lista de tarefas de pedido (preparar #N, entregar).     |
| **TPV**                         | Turno aberto; sem pedidos em curso; ecrã pronto para novo pedido.                               | Carrinho / pedidos em curso.                            |
| **KDS**                         | Fila vazia ou "Nenhum pedido ativo".                                                            | Fila por estado (novo → preparando → pronto).           |

O estado **não é um botão**. A UI **reflete** o estado derivado do Core (turno + pedidos + tempo). Quando o sensor emite RESTAURANT_IDLE, as tarefas aparecem na lista de tarefas; o utilizador vê o sistema "acordar" no silêncio.

---

## 8. Ligação Turno ↔ Tarefas (resumo)

Só quando o estado é **IDLE** (e, se definido, CLOSING) o sistema pode declarar:

> _Agora é hora de tarefas de modo interno._

Essas tarefas incluem (exemplos):

- Limpeza e organização
- Checklist diário do turno
- Preparação (mise en place, stock)
- Tarefas recorrentes que não dependem de cliente presente

O evento que dispara a geração destas tarefas é **RESTAURANT_IDLE** (nome canónico em [EVENTS_AND_STREAMS.md](./EVENTS_AND_STREAMS.md)). Quando o sensor de ociosidade (turno aberto + zero pedidos ativos + tempo desde último pedido ≥ X min) se verifica, emite-se esse evento; o EventTaskGenerator cria tarefas em `gm_tasks` conforme regras configuradas.

**Regra:** Sem o evento explícito de restaurante ocioso, o sistema não reage ao "silêncio" — só a eventos declarados (pedido, turno, pagamento). O Contrato de Atividade Operacional introduz o evento de ociosidade para que as tarefas "acordem" quando não há clientes.

---

## 9. Parâmetros (exemplo)

| Parâmetro               | Valor exemplo                                 | Uso                                                                                                   |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| X (minutos para IDLE)   | 15                                            | Tempo desde o último pedido acima do qual se considera restaurante ocioso e se emite RESTAURANT_IDLE. |
| Throttle / idempotência | 1 tarefa OPEN restaurant_idle por restaurante | Evitar dezenas de tarefas iguais; no máximo uma MODO_INTERNO aberta por ociosidade.                   |

Implementação pode usar limiares configuráveis por restaurante ou globais (ex.: `restaurant_idle_minutes` em alertThresholds).

---

## 10. TPV e identidade (conceitual)

O TPV hoje é uma **rota** (`/op/tpv`) sem identidade física no Core. As tabelas que permitem vínculo formal existem:

- **installed_modules** — este restaurante tem o módulo "tpv" instalado; papel do terminal.
- **gm_equipment** (opcional) — este dispositivo (caixa 1, tablet cozinha).
- **module_permissions** — o que este papel pode fazer.

Sem usar estas tabelas, o TPV nunca vai "parecer instalado", só "aberto no browser". O Contrato de Atividade Operacional não define o ritual de instalação; apenas deixa claro que a **identidade** do TPV (e a sensação de "sistema instalado") depende de vincular rota → módulo instalado → opcionalmente equipamento. Implementação futura.

---

## 11. Referência à Lei e aos eventos

- **Turno:** [LEI_DO_TURNO.md](./LEI_DO_TURNO.md), [CONTRATO_DO_TURNO.md](./CONTRATO_DO_TURNO.md).
- **Eventos:** [EVENTS_AND_STREAMS.md](./EVENTS_AND_STREAMS.md) — registo de `RESTAURANT_IDLE` para modo interno e geração de tarefas.
- **Core:** gm_tasks, gm_orders, gm_cash_registers; event_store para auditoria opcional.

_Documento canónico. Base para sensor de ociosidade (EventMonitor.checkIdle), EventTaskGenerator (restaurant_idle → MODO_INTERNO; order_created → PEDIDO_NOVO) e UI que reflete IDLE vs SERVING._
