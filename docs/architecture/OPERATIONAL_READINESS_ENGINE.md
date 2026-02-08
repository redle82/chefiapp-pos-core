# Operational Readiness Engine (ORE) — Especificação técnica

> **Propósito:** Especificação técnica do ORE: BlockingReason, Surface, UiDirective, matriz superfície×estado, ordem fixa, consumo pelo código. O ORE é a autoridade única que decide se uma superfície pode operar, com base em estados canónicos e fontes de verdade externas.
>
> **Refs:** [ORE_ORGANISM_AND_MENU.md](./ORE_ORGANISM_AND_MENU.md) (modelo organismo), [ORE_MANUAL_HUMANO.md](../operations/ORE_MANUAL_HUMANO.md) (pedagogia humana), [MENU_OPERATIONAL_STATE.md](./MENU_OPERATIONAL_STATE.md).

---

## 1. Separação de responsabilidades

- **FlowGate** = "Entramos na app?" — auth, tenant, lifecycle (sem org → bootstrap; SETUP → redirect para onboarding).
- **ORE** = "Nesta superfície, podemos operar e o que mostramos?" — consultado **depois** de termos org + tenant, dentro das rotas app.

O ORE não substitui o FlowGate. O ORE responde à pergunta por superfície: "Este restaurante pode operar **agora** nesta superfície? Se não, por quê e que UI mostrar?"

---

## 2. Superfícies governadas (lista fechada)

- TPV
- KDS
- DASHBOARD
- WEB

**Lei:** Se uma superfície não está nesta lista, não pode decidir operação.

---

## 3. Estados canónicos de bloqueio (BlockingReason)

Conjunto fechado e exaustivo:

- CORE_OFFLINE
- BOOTSTRAP_INCOMPLETE
- NO_OPEN_CASH_REGISTER
- SHIFT_NOT_STARTED
- PERMISSION_DENIED
- MODE_NOT_ALLOWED
- MODULE_NOT_ENABLED
- NOT_PUBLISHED
- RESTAURANT_NOT_FOUND

**Lei:** Se algo bloqueia operação e não está aqui, é bug arquitetónico.

Tipos e interface (implementação: `merchant-portal/src/core/readiness/types.ts`):

```ts
type BlockingReason =
  | "CORE_OFFLINE"
  | "BOOTSTRAP_INCOMPLETE"
  | "NO_OPEN_CASH_REGISTER"
  | "SHIFT_NOT_STARTED"
  | "PERMISSION_DENIED"
  | "MODE_NOT_ALLOWED"
  | "MODULE_NOT_ENABLED"
  | "NOT_PUBLISHED"
  | "RESTAURANT_NOT_FOUND";

type Surface = "TPV" | "KDS" | "DASHBOARD" | "WEB";

type UiDirective =
  | "RENDER_APP"
  | "SHOW_BLOCKING_SCREEN"
  | "SHOW_INFO_ONLY"
  | "REDIRECT";

interface OperationalReadiness {
  ready: boolean;
  blockingReason?: BlockingReason;
  surface: Surface;
  allowedActions?: string[];
  uiDirective: UiDirective;
  redirectTo?: string;
}
```

---

## 4. Fontes de verdade (sensores)

O ORE consulta; nunca executa. Sem API, retry, timeout ou detalhe de implementação.

| BlockingReason        | Fonte                    |
| --------------------- | ------------------------ |
| CORE_OFFLINE          | RuntimeContext           |
| BOOTSTRAP_INCOMPLETE  | BootstrapState           |
| NOT_PUBLISHED         | BootstrapState           |
| NO_OPEN_CASH_REGISTER | ShiftContext             |
| SHIFT_NOT_STARTED     | ShiftContext             |
| MODULE_NOT_ENABLED    | ModulesConfig            |
| PERMISSION_DENIED     | Auth / Roles             |
| MODE_NOT_ALLOWED      | BootstrapState           |
| RESTAURANT_NOT_FOUND  | Resolução por slug (WEB) |

---

## 5. Regras determinísticas (ordem fixa)

**Regra:** Primeiro bloqueio que falhar ganha. Nenhuma exceção.

Ordem de avaliação:

1. CORE_OFFLINE — Core inalcançável e não é modo offline intencional.
2. BOOTSTRAP_INCOMPLETE — Restaurante em SETUP / onboarding não concluído (para superfícies operacionais).
3. NOT_PUBLISHED — Menu/restaurante não publicados (para TPV/KDS; Dashboard pode RENDER_APP).
4. NO_OPEN_CASH_REGISTER / SHIFT_NOT_STARTED — Turno não aberto (para TPV/KDS bloqueia; para Dashboard → SHOW_INFO_ONLY).
5. MODULE_NOT_ENABLED — Módulo TPV ou KDS não ativo (só TPV/KDS).
6. PERMISSION_DENIED / MODE_NOT_ALLOWED — Role ou modo não permitido (quando aplicável; TRIAL é estado estrutural canónico).
7. RESTAURANT_NOT_FOUND — Superfície WEB: slug/restaurante inexistente.

Pseudocódigo humano: `if !coreOnline → BLOCK(CORE_OFFLINE); else if !bootstrapComplete → REDIRECT(BOOTSTRAP); else if !published → BLOCK(NOT_PUBLISHED); else if operação_real && !shiftOpen → conforme superfície (TPV/KDS BLOCK, DASHBOARD INFO_ONLY); else if módulo não ativo → BLOCK(MODULE_NOT_ENABLED); else → READY.`

---

## 6. Matriz superfície × estado → directiva

Sem texto, botão ou UX. Apenas directivas abstractas.

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

## 7. Directivas de UI (abstratas)

Lista fechada:

- RENDER_APP
- SHOW_BLOCKING_SCREEN
- SHOW_INFO_ONLY
- REDIRECT

**Lei:** O ORE nunca diz como renderizar; só diz o que fazer.

---

## 8. Consumo pelo código

Cada superfície consome `useOperationalReadiness(surface)` e segue a uiDirective. O ORE não define como renderizar; define apenas o que fazer (RENDER_APP | SHOW_BLOCKING_SCREEN | SHOW_INFO_ONLY | REDIRECT).

Implementação: `merchant-portal/src/core/readiness/useOperationalReadiness.ts`. BlockingScreen e mensagens humanas: `MENU_STATE_MESSAGES` em `merchant-portal/src/core/menu/MenuState.ts`.

---

## 9. Leis do ORE (invariantes)

Estas leis são não negociáveis. Violar uma é bug arquitetónico.

1. **Nenhuma UI decide prontidão** — Toda a UI consome o ORE e segue a uiDirective.
2. **Nenhuma operação ignora o ORE** — Não existe caminho operacional que dispense a consulta ao ORE.
3. **Erro operacional ≠ erro técnico** — Caixa fechado, não publicado, etc., não são tratados como exception ou crash.
4. **Não existe gate paralelo** — O ORE é a única autoridade para "pode operar?" e "que directiva de UI?".

---

## 10. ORE e o Sidebar (System Tree)

O sidebar (System Tree) é o mapa do corpo; o ORE é o sistema nervoso central. O ORE toca **semanticamente** em tudo; não implementa nem organiza fisicamente o sidebar.

**ORE NÃO é:** gestor de módulos, orquestrador técnico, controller de UI, router, billing engine, shift engine.

**ORE É:** autoridade semântica única; juiz soberano da operação; fonte final do "pode / não pode / como reagir".

| Grupo do sidebar         | ORE toca?    | Papel do ORE                                                                                                                                                    |
| ------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core / Conexão / DB      | Sim          | Sensor (offline, bootstrap incompleto). ORE decide: bloquear, permitir dashboard ou modo informativo. O amarelo é sensor; quem decide o impacto é o ORE.        |
| Billing                  | Sim          | ORE pode bloquear por billing; ORE não gere billing. Billing = fonte de verdade; ORE = decisão operacional ("com este estado financeiro, pode operar ou não?"). |
| Turno / Caixa            | Sim          | Central. Caixa fechada, turno não iniciado → ORE decide: TPV/KDS bloqueia, Dashboard informa, Web ignora. Nenhuma tela decide sozinha.                          |
| TPV / KDS / Menu Builder | Consumidores | Consumidores puros do ORE. Não checam publish, caixa nem inferem estado; chamam `useOperationalReadiness(surface)` e obedecem à uiDirective.                    |
| Web pública / QR         | Sim          | WEB é superfície; usa bootstrap público. ORE decide existe?, visível?, aceita pedido?; não abre caixa, não ignora ORE, não decide operação real.                |
| Sidebar / System Tree    | Reflexo      | O ORE **não organiza** o sidebar. O sidebar **reflete** decisões do ORE. Sidebar = UI; ORE = semântica; UI escolhe onde mostrar; ORE decide o que é verdade.    |

**Loop definitivo:**

1. **Sensores:** Core | Billing | Shift | Bootstrap | Auth | Modules → alimentam estado.
2. **ORE (cérebro):** Decide READY | BLOCK(reason) | INFO_ONLY | REDIRECT → emite directiva abstrata.
3. **UI / Sidebar / Páginas:** Executam mostrar | bloquear | informar | redireccionar. Sem atalhos, sem excepções, sem gates paralelos.

Mapa visual anotado: [ORE_SYSTEM_TREE_MAP.md](../bootstrap/ORE_SYSTEM_TREE_MAP.md).

---

## 11. Contratos referenciados

Links; o ORE não duplica conteúdo.

- [RESTAURANT_BOOTSTRAP_CONTRACT.md](../bootstrap/RESTAURANT_BOOTSTRAP_CONTRACT.md)
- [BOOTSTRAP_MAP.md](../bootstrap/BOOTSTRAP_MAP.md)
- [README.md](../bootstrap/README.md)
- Shift / Caixa: ShiftContext, CashRegisterEngine (contrato quando existir em docs).
- Auth / Roles: documentação de permissões (quando existir em docs).
