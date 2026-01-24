# Issues pack (P0/P1/P2) — ChefIApp POS Core

Data: 2026-01-03
Fonte: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md
Objetivo: transformar backlog em issues GitHub *ordenadas*, com labels sugeridos e escopo auditável.

---

## Convenção sugerida

- **Título**: `[P?][Épico X?] <nome curto>`
- **Labels** (sugestão):
  - Prioridade: `P0` | `P1` | `P2`
  - Épico: `epic:A` … `epic:F`
  - Tipo: `type:chore` | `type:feature` | `type:infra` | `type:docs`
  - Área: `area:ui` | `area:tpv` | `area:server` | `area:db` | `area:ops`

---

## Ordem recomendada de PRs (P0)

1) **PR-0**: Guardrails UI (A0) + alinhar exports mínimos (parte de A2)
2) **PR-1**: Tokens críticos (A1)
3) **PR-2**: Unificar exports (A2) (primitives-only + compat explícita)
4) **PR-3**: Dialog/Modal (A3)
5) **PR-4**: Select/Dropdown (A4)
6) **PR-5**: A11y mínima transversal (A5)
7) **PR-6**: Storybook (A6)
8) **PR-7**: Logging estruturado (B0)
9) **PR-8**: Sentry/equivalente (B1)
10) **PR-9**: Métricas mínimas (B2)
11) **PR-10**: Bundle analysis + split (C1)
12) **PR-11**: Snapshotting/projeções (C0)
13) **PR-12**: Retenção/compactação offline (C3)
14) **PR-13**: Billing fail-closed backend (D0)
15) **PR-14**: RBAC central (E0)

---

## Issues (P0)

### [P0][Épico A] A0 — Guardrails anti-duplicação UI
- **Labels**: `P0`, `epic:A`, `type:infra`, `area:ui`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (A0)
- **Aceite**:
  - `npm run -s typecheck` passa
  - `npm -w merchant-portal run -s build` passa
  - CI falha se adicionar novo arquivo em `merchant-portal/src/ui/components/` (exceto README)
  - CI falha se reintroduzir re-exports proibidos em `merchant-portal/src/ui/design-system/index.ts`

### [P0][Épico A] A1 — Tokens críticos (breakpoints, zIndex, transitions, focus)
- **Labels**: `P0`, `epic:A`, `type:feature`, `area:ui`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (A1)
- **Dependências**: A0
- **Aceite**:
  - tokens `breakpoints`, `zIndex`, `transitions`, `focus` existem e são usados
  - remover hardcodes P0 (transitions/focus)

### [P0][Épico A] A2 — Unificar exports e remover colisões
- **Labels**: `P0`, `epic:A`, `type:chore`, `area:ui`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (A2)
- **Dependências**: A0, A1
- **Aceite**:
  - `ui/design-system/index.ts` exporta somente **tokens + primitives + patterns/layouts sem colisão**
  - compat (se necessária) é explícita (ex.: `ui/design-system/legacy`)
  - nenhum nome base duplicado em múltiplas camadas

### [P0][Épico A] A3 — Dialog/Modal (TPV)
- **Labels**: `P0`, `epic:A`, `type:feature`, `area:ui`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (A3)
- **Dependências**: A1
- **Aceite**:
  - `Esc` fecha
  - focus trap + restore focus
  - `aria-modal`, `role="dialog"`, `aria-labelledby`
  - sem z-index hardcoded (usa token)

### [P0][Épico A] A4 — Select/Dropdown genérico
- **Labels**: `P0`, `epic:A`, `type:feature`, `area:ui`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (A4)
- **Dependências**: A1
- **Aceite**:
  - teclado: setas/enter/esc
  - `role="listbox"` / `role="option"` + ARIA
  - pelo menos 1 fluxo real migrado

### [P0][Épico A] A5 — A11y mínima transversal
- **Labels**: `P0`, `epic:A`, `type:feature`, `area:ui`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (A5)
- **Dependências**: A1, A3
- **Aceite**:
  - Button: `type="button"` default; `aria-label` quando necessário
  - Input: `aria-invalid` + `aria-errormessage` quando erro
  - Toast/Alert: roles + `aria-live` corretos

### [P0][Épico A] A6 — Storybook (primitives only)
- **Labels**: `P0`, `epic:A`, `type:infra`, `area:ui`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (A6)
- **Dependências**: A2–A5 (parcial)
- **Aceite**:
  - `npm run storybook` sobe
  - >= 6 stories úteis

### [P0][Épico B] B0 — Logging estruturado mínimo
- **Labels**: `P0`, `epic:B`, `type:feature`, `area:ops`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (B0)

### [P0][Épico B] B1 — Captura de exceções (Sentry ou equivalente)
- **Labels**: `P0`, `epic:B`, `type:feature`, `area:ops`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (B1)
- **Dependências**: B0

### [P0][Épico B] B2 — Métricas mínimas
- **Labels**: `P0`, `epic:B`, `type:feature`, `area:ops`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (B2)
- **Dependências**: B0

### [P0][Épico C] C1 — Bundle analysis + split por domínio
- **Labels**: `P0`, `epic:C`, `type:chore`, `area:ui`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (C1)

### [P0][Épico C] C0 — Snapshotting / materialização de projeções
- **Labels**: `P0`, `epic:C`, `type:feature`, `area:tpv`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (C0)

### [P0][Épico C] C3 — Retenção/compactação offline
- **Labels**: `P0`, `epic:C`, `type:feature`, `area:tpv`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (C3)
- **Dependências**: C0

### [P0][Épico D] D0 — Billing fail-closed no backend
- **Labels**: `P0`, `epic:D`, `type:feature`, `area:server`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (D0)

### [P0][Épico E] E0 — Centralizar matriz de roles (RBAC)
- **Labels**: `P0`, `epic:E`, `type:chore`, `area:server`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (E0)

---

## Issues (P1)

### [P1][Épico A] A7 — Consolidar duplicatas (remover legacy)
- **Labels**: `P1`, `epic:A`, `type:chore`, `area:ui`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (A7)

### [P1][Épico C] C2 — Virtualização + memo no TPV
- **Labels**: `P1`, `epic:C`, `type:feature`, `area:tpv`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (C2)

### [P1][Épico E] E1 — Exceções operacionais (cancel/override) auditáveis
- **Labels**: `P1`, `epic:E`, `type:feature`, `area:tpv`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (E1)

---

## Issues (P2)

### [P2] Remove duplicate border style in WorkerTaskFocus
- **Labels**: `P2`, `area:ui`, `type:cleanup`
- **Arquivo**: `merchant-portal/src/pages/AppStaff/WorkerTaskFocus.tsx`
- **Contexto**: warning do esbuild por `Duplicate key "border" in object literal`.
- **Aceite**:
  - remove a duplicação de `border` (um único `border` permanece)
  - layout/visual idêntico (sem mudanças perceptíveis)
  - não altera tokens, não altera API pública de componentes
  - build continua verde

### [P2][Épico F] F0 — Public API (OpenAPI)
- **Labels**: `P2`, `epic:F`, `type:feature`, `area:server`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (F0)

### [P2][Épico F] F1 — Marketplace adapters
- **Labels**: `P2`, `epic:F`, `type:feature`, `area:server`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (F1)

### [P2][Épico F] F2 — Reservas (engine de disponibilidade)
- **Labels**: `P2`, `epic:F`, `type:feature`, `area:server`
- **Ref**: docs/BACKLOG_ACTIONABLE_P0_P1_P2.md (F2)
