# Operational Readiness Engine (ORE) — Cérebro

O ORE é a autoridade única que decide se uma superfície pode operar, por quê, e qual directiva de UI deve ser aplicada. Nenhuma superfície pode decidir prontidão por si.

**Especificação técnica completa (tipos, implementação):** [OPERATIONAL_READINESS_ENGINE.md](../architecture/OPERATIONAL_READINESS_ENGINE.md) (em `docs/architecture/`).

---

## 1. Superfícies governadas (lista fechada)

- TPV
- KDS
- DASHBOARD
- WEB

**Regra:** Se algo não está nesta lista, não pode decidir operação. (API_INTERNAL só se for relevante no futuro.)

---

## 2. Estados canónicos de prontidão (BlockingReason)

Lista exaustiva. Se algo bloqueia operação, tem de estar aqui. Se não está aqui, não pode bloquear.

- CORE_OFFLINE
- BOOTSTRAP_INCOMPLETE
- NO_OPEN_CASH_REGISTER
- SHIFT_NOT_STARTED
- PERMISSION_DENIED
- MODE_NOT_ALLOWED
- MODULE_NOT_ENABLED
- NOT_PUBLISHED
- RESTAURANT_NOT_FOUND

Implementação: `merchant-portal/src/core/readiness/types.ts`.

---

## 3. Fontes de verdade (sensores)

O ORE não executa; consulta. Tabela **Estado → Fonte** (sem detalhes de API, timeouts ou retries).

| Estado                | Fonte                                                   |
| --------------------- | ------------------------------------------------------- |
| CORE_OFFLINE          | RestaurantRuntimeContext (coreMode / coreReachable)     |
| BOOTSTRAP_INCOMPLETE  | useBootstrapState / runtime.systemState                 |
| NOT_PUBLISHED         | useBootstrapState (publishStatus) / runtime.isPublished |
| NO_OPEN_CASH_REGISTER | ShiftContext (isShiftOpen) — usa CashRegisterEngine     |
| SHIFT_NOT_STARTED     | Idem                                                    |
| MODULE_NOT_ENABLED    | getModulesEnabled (modulesConfigStorage)                |
| PERMISSION_DENIED     | Auth / Roles (quando aplicável)                         |
| MODE_NOT_ALLOWED      | useBootstrapState (operationMode)                       |
| RESTAURANT_NOT_FOUND  | Resolução por slug (WEB; quando aplicável)              |

---

## 4. Regras de decisão determinísticas

Pseudocódigo (ordem de avaliação; primeiro bloqueio que falhar ganha):

- if !coreOnline → BLOCK(CORE_OFFLINE)
- else if !bootstrapComplete (para TPV/KDS) → REDIRECT(BOOTSTRAP_INCOMPLETE)
- else if !published (para TPV/KDS) → BLOCK(NOT_PUBLISHED)
- else if operação-real && !shiftOpen (TPV/KDS) → BLOCK(NO_OPEN_CASH_REGISTER)
- else if surface === DASHBOARD && operação-real && !shiftOpen → INFO_ONLY(NO_OPEN_CASH_REGISTER)
- else if módulo não ativo (TPV/KDS) → BLOCK(MODULE_NOT_ENABLED)
- else if permissionDenied / modeNotAllowed → BLOCK(…)
- else if surface === WEB && restaurantNotFound → REDIRECT(RESTAURANT_NOT_FOUND)
- else → READY

---

## 5. Impacto por superfície (surface × blockingReason → uiDirective)

| Superfície | BlockingReason        | UiDirective          |
| ---------- | --------------------- | -------------------- |
| TPV / KDS  | CORE_OFFLINE          | SHOW_BLOCKING_SCREEN |
| TPV / KDS  | BOOTSTRAP_INCOMPLETE  | REDIRECT             |
| TPV / KDS  | NOT_PUBLISHED         | SHOW_BLOCKING_SCREEN |
| TPV / KDS  | NO_OPEN_CASH_REGISTER | SHOW_BLOCKING_SCREEN |
| TPV / KDS  | SHIFT_NOT_STARTED     | SHOW_BLOCKING_SCREEN |
| TPV / KDS  | MODULE_NOT_ENABLED    | SHOW_BLOCKING_SCREEN |
| DASHBOARD  | NO_OPEN_CASH_REGISTER | SHOW_INFO_ONLY       |
| DASHBOARD  | NOT_PUBLISHED         | RENDER_APP           |
| DASHBOARD  | CORE_OFFLINE          | RENDER_APP           |
| WEB        | RESTAURANT_NOT_FOUND  | REDIRECT             |

---

## 6. Directivas de UI (lista fechada)

- RENDER_APP
- SHOW_BLOCKING_SCREEN
- SHOW_INFO_ONLY
- REDIRECT

Sem textos, botões ou layout — apenas a directiva abstracta.

---

## 7. Contratos referenciados (não duplicados)

- [RESTAURANT_BOOTSTRAP_CONTRACT.md](RESTAURANT_BOOTSTRAP_CONTRACT.md)
- Shift / Caixa: ShiftContext, CashRegisterEngine (contrato em docs se existir; senão referência ao código)
- Auth / Roles: documentação de roles e permissões do projeto
- [BOOTSTRAP_MAP.md](BOOTSTRAP_MAP.md)

O ORE não repete o conteúdo desses documentos.

---

## 8. Invariantes (leis do sistema)

- Nenhuma UI decide prontidão; toda a UI consome o ORE.
- Nenhuma operação ignora o ORE.
- Nenhum erro operacional (ex.: caixa fechado) é tratado como exception técnica.
- Nenhum gate paralelo é permitido (decisão única no ORE).

---

## 9. Consumo pelo código

Cada superfície chama `useOperationalReadiness(surface)` e segue a `uiDirective` (RENDER_APP | SHOW_BLOCKING_SCREEN | SHOW_INFO_ONLY | REDIRECT). Componente único de bloqueio: `BlockingScreen` (por `BlockingReason`).

Implementação: `merchant-portal/src/core/readiness/` (types, useOperationalReadiness, BlockingScreen, index).
