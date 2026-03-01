# ChefIApp OS Architecture v1.0

**Status:** CONTRATO ATIVO (núcleo)
**Versão:** 1.0
**Data:** 2026-02-27
**Escopo desta versão:** Macro camadas + Runtime Core (Boot) + Fluxo real de execução

---

## 1) Declaração oficial

ChefIApp deixa de ser descrito como “app SaaS com dashboard e POS”.

ChefIApp é um **Restaurant Operating System**:

**Identity → Runtime → Context → Surface**

Não:

**Login → Dashboard**

---

## 2) Visão macro (camadas)

Ordem oficial de execução em runtime:

1. **Marketing Layer** — landing, pricing, login
2. **Auth Layer** — identidade, sessão, token
3. **Boot Runtime Engine** — FSM determinística de arranque
4. **Onboarding Module** — ativação e setup inicial
5. **Application Core** — superfícies operacionais (Admin, POS, KDS, Staff)

Regra estrutural:

- camadas superiores iniciam a entrada;
- o Runtime decide contexto e rota;
- superfícies executam o contexto recebido.

---

## 3) Núcleo do Runtime (Boot Runtime Engine)

O coração do OS é a pipeline determinística de boot, com timeout, telemetria e decisão final de lançamento.

Pipeline canónica:

- `BOOT_START`
- `AUTH_CHECKING`
- `AUTH_RESOLVED`
- `TENANT_LOADING`
- `TENANT_RESOLVED`
- `LIFECYCLE_DERIVED`
- `ROUTE_DECIDING`
- `BOOT_DONE`

Estados terminais de erro:

- `AUTH_TIMEOUT`
- `TENANT_ERROR`
- `TENANT_TIMEOUT`
- `ROUTE_ERROR`

Engines conceptuais dentro do boot:

- **Auth Engine** — `userId`, sessão, autenticação
- **Tenant Engine** — organização, restaurante ativo, selagem
- **Billing Engine** — estado de plano/faturação
- **Lifecycle Engine** — estado operacional derivado
- **Launch Decision** — `{ type, to, reason }`

### 3.1 Contrato de saída do Boot

O Boot produz contexto de execução do restaurante:

```ts
interface LaunchContext {
  userId: string;
  tenantId: string;
  role: string;
  billingStatus: string;
  lifecycleState: string;
  deviceType: "admin" | "pos" | "kds" | "staff";
}
```

Este objeto é a fotografia oficial do universo operacional no momento de lançamento.

---

## 4) Fluxo real de execução

Fluxo canónico:

1. User enters
2. Landing page
3. Login / signup
4. Boot Pipeline start
5. Auth / tenant / lifecycle / route
6. `BOOT_DONE`
7. Launch surface

Saídas de decisão típicas:

- Sem organização → `/welcome`
- Não ativado → `/activation`
- Problema de billing → `/billing`
- Multi-tenant → `/select-tenant`
- Tudo ok → superfície operacional autorizada

---

## 5) Regras de fronteira (obrigatórias)

1. **Boot nunca importa UI/surfaces.**
2. **Surfaces nunca importam boot internals.**
3. **Marketing nunca importa runtime/boot internals.**
4. **Auth não decide superfície final; Runtime decide.**
5. **Superfícies não reimplementam decisão de autenticação/tenant/rota raiz.**

Enforcement: regras de lint do portal em `merchant-portal/eslint.config.js`.

---

## 6) Fonte da verdade operacional (v1)

- **Dev server canónico:** `5175`
- **Cadeia oficial de boot:** `FlowGate + useBootPipeline`
- **Kernel legado:** `core/kernel` é auxiliar/legado, não autoridade de runtime
- **AppStaff oficial (web):** `/app/staff/home`

---

## 7) Mapeamento para implementação atual

Referências canónicas do runtime atual:

- `merchant-portal/src/core/flow/FlowGate.tsx`
- `merchant-portal/src/core/boot/useBootPipeline.ts`
- `merchant-portal/src/core/boot/BootState.ts`
- `merchant-portal/src/core/boot/resolveBootDestination.ts`
- `merchant-portal/src/core/boot/runtime/BootRuntimeEngine.ts`
- `merchant-portal/src/core/boot/bootTelemetry.ts`
- `merchant-portal/src/core/flow/CoreFlow.ts`
- `merchant-portal/src/main_debug.tsx`
- `merchant-portal/vite.config.ts`

---

## 8) Notas de transição (legacy)

Documentos históricos ou cadeias antigas de boot podem continuar no repositório para memória técnica, mas não substituem este contrato.

Se houver conflito entre narrativa antiga e runtime oficial, prevalece este documento e os contratos ativos em `docs/architecture/`.

---

## 9) Critério de aceitação arquitetural

Toda mudança que toque boot, rotas de entrada, autenticação inicial ou superfície de lançamento deve responder explicitamente:

1. Mantém `Identity → Runtime → Context → Surface`?
2. Mantém as fronteiras de importação entre camadas?
3. Preserva `LaunchContext` como contrato de handoff?
4. Não desloca a autoridade de decisão para a UI?

Se qualquer resposta for “não”, a mudança é regressão arquitetural.
