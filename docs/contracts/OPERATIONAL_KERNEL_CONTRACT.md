# Contrato: Operational Kernel (Núcleo Decisor Operacional)

**Propósito:** Tornar explícito em contrato o que já existe implicitamente: um **decisor operacional** que agrega CoreHealth, Preflight e EventMonitor e emite um **estado composto único** (OperationalState). Nomeia o núcleo, explica o ruído actual (hooks e providers dispersos) e prepara consolidação futura (debounce, singleton, menos logs). Documento apenas; sem implementação neste passo.

**Referências:** [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](OPERATIONAL_DASHBOARD_V2_CONTRACT.md), [OPERATIONAL_HEADER_CONTRACT.md](OPERATIONAL_HEADER_CONTRACT.md), [FLUXO_DE_PEDIDO_OPERACIONAL.md](FLUXO_DE_PEDIDO_OPERACIONAL.md), [CURRENT_SYSTEM_MAP.md](../architecture/CURRENT_SYSTEM_MAP.md).

---

## 1. Princípio

O **Operational Kernel** é o **único decisor** da verdade operacional da aplicação: podemos operar ou não, e porquê.

A UI (dashboard, TPV, etc.) consome **um estado composto** emitido pelo Kernel, não vários hooks em paralelo. Hoje esse estado está disperso em useCoreHealth, usePreflightOperational, useShift e CONFIG.TERMINAL_INSTALLATION_TRACK; o contrato descreve o núcleo único que agrega essas fontes e emite OperationalState.

---

## 2. Responsabilidades

| Responsabilidade | Descrição | Fonte actual (implementação dispersa) |
|------------------|-----------|--------------------------------------|
| **CoreHealth** | Saber se o Core está UP / DOWN / DEGRADED / UNKNOWN; única fonte de "Core ON/OFF". | useCoreHealth; endpoint de health do Docker Core. |
| **Preflight** | Dado Core + menu publicado + identidade + turno aberto, decidir se a operação está **Pronta** ou **Bloqueada** e lista de blockers (CORE_OFFLINE, NO_PUBLISHED_MENU, etc.). | usePreflightOperational + computePreflight; consome useCoreHealth, runtime, shift. |
| **EventMonitor** | Observar eventos operacionais (pedidos atrasados, mesas sem atendimento) e gerar tarefas/alertas; não altera "canOperate", mas faz parte do mesmo núcleo de decisão operacional (quando consolidado, evita ciclos de vida duplicados). | EventMonitor (classe); start/stop por ciclo de vida React. |
| **Terminais** | Saber se existe trilho de terminais instalados (gm_terminals, device_id) ou não. | Hoje: CONFIG.TERMINAL_INSTALLATION_TRACK; no futuro: runtime (gm_terminals). |

---

## 3. Inputs (fontes de verdade externas)

- **Endpoint de health do Core** (Docker Core): usado por CoreHealth.
- **RestaurantRuntimeContext:** restaurant_id, isPublished, setup_status.identity; usado por Preflight.
- **ShiftContext:** isShiftOpen; usado por Preflight e pelo estado composto (shift).
- **Config ou runtime:** terminais instalados sim/não (hoje TERMINAL_INSTALLATION_TRACK); no futuro gm_terminals.
- **Eventos / pedidos / mesas:** lidos pelo EventMonitor para detectar order_delayed, table_unattended, etc.

Nenhuma destas fontes é inventada; todas existem no código ou no Core.

---

## 4. Output único: OperationalState

Estrutura mínima em contrato (sem implementação obrigatória neste passo):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **core** | UP \| DOWN \| DEGRADED \| UNKNOWN | Estado do Core (CoreHealth). |
| **shift** | OPEN \| CLOSED | Turno aberto ou fechado (ShiftContext). |
| **terminals** | `{ status, canQuery }` | **Gate de terminais:** status = NOT_IMPLEMENTED \| INSTALLED \| NOT_INSTALLED; canQuery = true só quando o backend/schema de terminais existe. Quando status = NOT_IMPLEMENTED, canQuery = false e **nenhum hook deve chamar gm_terminals nem gm_equipment** para listagem de terminais (evita 404 e spam). |
| **canOperate** | boolean | Equivalente a Preflight.operationReady: operação Pronta ou Bloqueada. |
| **reason** | string \| null | Primeiro blocker ou null (ex.: "Core offline", "Turno fechado"); usado para mensagem única na UI. |

A UI mostra "Operação Pronta | Core ON | Turno Aberto" (ou variantes) a partir deste estado único, não de vários hooks. O gate de terminais garante: quando o mundo de terminais ainda não está implementado (NOT_IMPLEMENTED), a UI fica silenciosa e honesta — sem requests a /gm_terminals ou /gm_equipment para terminais.

---

## 5. Mapeamento "hoje → contrato"

| Conceito no contrato | Implementação actual (dispersa) |
|----------------------|----------------------------------|
| Kernel.core | useCoreHealth → status (UNKNOWN, UP, DOWN, DEGRADED). |
| Kernel.shift | useShift → isShiftOpen (OPEN/CLOSED). |
| Kernel.terminals | TERMINAL_INSTALLATION_TRACK false → { status: NOT_IMPLEMENTED, canQuery: false }; true → { status: INSTALLED/NOT_INSTALLED, canQuery: true }. useTerminals não chama API quando canQuery é false. |
| Kernel.canOperate | usePreflightOperational → operationReady. |
| Kernel.reason | usePreflightOperational → blockers[0].message ou null. |
| EventMonitor (parte do núcleo) | EventMonitor.start/stop; observa pedidos/mesas; gera tarefas; não expõe estado na UI como "canOperate", mas pertence ao mesmo núcleo operacional. |

Assim fica explícito que o estado actual da UI já é uma **projecção** deste Kernel, ainda que dispersa em vários hooks e contextos. O ruído de logs (ex.: "[CoreHealth] Status changed" repetido, "Iniciando monitoramento" / "Monitoramento parado") deve-se a ciclos de vida React e à ausência de um único ponto de agregação; o contrato nomeia esse ponto.

---

## 6. Fontes históricas (legado)

Firebase, Supabase directo ou outros clientes que leiam/escrevam fora do Kernel são **fontes históricas** ou de suporte: não decidem estado operacional, não falam directo com a UI como decisor. O Kernel é a única autoridade para "podemos operar?". Eventos ou reads legados podem coexistir desde que não confundam a UI com múltiplas fontes de verdade.

---

## 7. O que NÃO fazer neste contrato

- **Não implementar código** (nem React, nem singleton, nem debounce). Este passo é apenas contrato.
- **Não alterar UI nem reduzir logs** agora; isso fica para depois de o contrato estar aprovado e, se for o caso, de consolidar o Kernel em código (ex.: useOperationalKernel que emite OperationalState).
- **Não inventar novas APIs de backend;** o contrato descreve agregação de fontes já existentes (health, runtime, shift, config).

---

## 8. Próximos passos (após aprovação do contrato)

- Consolidar um único provider ou hook "useOperationalKernel" que emita OperationalState (core, shift, terminals, canOperate, reason) a partir das fontes actuais.
- Introduzir debounce ou singleton para CoreHealth para reduzir spam de logs e re-renders.
- Estabilizar ciclo de vida do EventMonitor (um único ponto de start/stop no Operational Kernel) para reduzir "Iniciando monitoramento" / "Monitoramento parado" repetidos.

Nada disso é obrigatório neste passo; o contrato apenas nomeia o núcleo e o estado de saída.

---

Última atualização: Contrato Operational Kernel; núcleo decisor operacional nomeado; mapeamento para implementação actual (dispersa). Sem alterações de código nem UI.
