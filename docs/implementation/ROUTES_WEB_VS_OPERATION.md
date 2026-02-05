# Mapa de rotas: WEB de configuração vs OPERAÇÃO

Referência única para guards e fluxo após a refatoração (sem demo/gerente/staff como muletas).

**Fonte de verdade:** `merchant-portal/src/core/flow/CoreFlow.ts` (`isWebConfigPath`, `isOperationalPath`, `resolveNextRoute`).  
**Declaração oficial (v1 congelada):** [DECLARACAO_POS_REFATORACAO_WEB_V1.md](../DECLARACAO_POS_REFATORACAO_WEB_V1.md).

---

## Regra em uma frase

- **Web de configuração:** SEMPRE render para dono com `hasOrg`; nunca bloquear por `systemState` nem por billing/dados.
- **Operação (TPV/KDS):** bloqueada em `systemState === "SETUP"` → redirect `/onboarding/first-product`.

---

## Rotas WEB (sempre ALLOW para hasOrg)

| Rota | Uso |
|------|-----|
| `/dashboard`, `/app/dashboard` | Portal central (web de configuração) |
| `/config`, `/config/*` | Identidade, localização, horários, percepção |
| `/menu-builder` | Cardápio |
| `/onboarding/first-product` | Primeiro produto (bootstrap linear) |
| `/app/billing`, `/billing/success` | Faturação |

**Guard:** Nunca usar guards operacionais nestas rotas. Nunca `return null` na web.

---

## Rotas OPERAÇÃO (bloqueadas em SETUP)

| Rota | Gate |
|------|------|
| `/op/tpv`, `/op/tpv/*` | SETUP → redirect `/onboarding/first-product` |
| `/op/kds` | SETUP → redirect `/onboarding/first-product` |
| `/app/tpv`, `/app/kds` | Idem (legacy) |

**Guard:** Só aplicar redirect quando `systemState === "SETUP"` e path é operacional.

---

## Guard padrão (copiar/colar)

```ts
// Web de configuração: nunca bloquear por systemState/billing/dados.
if (isWebConfigPath(pathname) && hasOrganization) {
  return { type: "ALLOW" };
}

// Operação: em SETUP redirecionar para primeiro produto.
if (systemState === "SETUP" && isOperationalPath(pathname)) {
  return { type: "REDIRECT", to: "/onboarding/first-product", reason: "..." };
}
```

Implementação actual: `CoreFlow.ts` → `resolveNextRoute()` (autenticação e `!hasOrg` tratados antes; depois 2.5 OPERAÇÃO; resto ALLOW).

---

## Rotas públicas (fora do FlowGate app)

- `/`, `/landing`, `/pricing`, `/features`, `/auth`
- `/demo`, `/demo-guiado` redirecionam para `/auth` ou `/auth?demo=1` (Opção A); ver secção seguinte.

---

## /demo e /demo-guiado — Opção A aplicada

- **Estado:** Redirects. `/demo` → `/auth`; `/demo-guiado` → `/auth?demo=1`. Rotas removidas das listas públicas; DemoTourPage e DemoGuiadoPage já não são renderizados.
- **Ref.:** [DECLARACAO_POS_REFATORACAO_WEB_V1.md](../DECLARACAO_POS_REFATORACAO_WEB_V1.md) §4.
---

## DashboardPortal: nunca return null

- `systemState === "SUSPENDED"` → `<SuspendedView />`
- SETUP / TRIAL / ACTIVE (ou valor inesperado) → portal (com ou sem banner de setup)
- Redirect `?billing=success` → `<GlobalLoadingView />` enquanto navega
- Nenhum ramo termina em `return null`.

---

## Referências

- CoreFlow: `merchant-portal/src/core/flow/CoreFlow.ts`
- FlowGate: `merchant-portal/src/core/flow/FlowGate.tsx`
- LifecycleState: `merchant-portal/src/core/lifecycle/LifecycleState.ts`
