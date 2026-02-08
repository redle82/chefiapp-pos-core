# Gates — Fluxo de Criação e Operação (ChefIApp)

**Propósito:** Documentar o comportamento atual dos gates que governam o fluxo de criação de restaurante e o acesso a TPV/KDS. Referência para testes e para evolução futura (ex.: billing no RequireOperational).

**Local:** docs/architecture/GATES_FLUXO_CRIACAO_E_OPERACAO.md

---

## 1. FlowGate (e RequireApp)

**Onde:** `merchant-portal/src/core/flow/FlowGate.tsx`. O FlowGate envolve as rotas dentro de `AppWithRuntime` (após auth).

**Comportamento confirmado:**

- **Utilizador autenticado sem tenant selado:**
  - Se 0 tenants (após resolução) → redirect para `/app/select-tenant` ou, quando o TenantResolver indica `NO_TENANTS`, o redirect pode ir para `/bootstrap` (conforme lógica em FlowGate + SelectTenantPage que redireciona 0 memberships para `/bootstrap`).
  - Se 1 tenant → auto-select (TenantResolver) + tenant selado; permite acesso a `/app/*`.
  - Se >1 tenants → redirect para `/app/select-tenant` até o utilizador escolher; depois tenant selado e acesso a `/app/dashboard`.
- **Rotas isentas (TENANT_EXEMPT_ROUTES):** `/bootstrap`, `/app/select-tenant` — montam mesmo sem tenant selado.
- **Nenhuma rota `/app/*`** (exceto as isentas) monta antes de `tenantId` + `restaurantId` estarem selados (Sovereign Hard-Stop).

**RequireApp:** Componente de nível 2 que pode ser usado em conjunto; o gate principal de “quem pode ver o app” é o FlowGate + resolução de tenant.

---

## 2. RequireOperational

**Onde:** `merchant-portal/src/components/operational/RequireOperational.tsx`. Envolve as rotas `/op/tpv`, `/op/kds`, `/op/cash`, etc. em `App.tsx`.

**Comportamento atual:**

- **Depende apenas de `runtime.isPublished`.**
- Se `runtime.loading` → mostra "Verificando estado operacional...".
- Se `!runtime.isPublished` → bloqueia: mostra tela "Sistema não operacional" com link para `/dashboard`; filhos não renderizados.
- Se `runtime.isPublished === true` → libera: renderiza filhos (TPV/KDS).

**Billing:** O componente **não** lê `billingStatus`. O contrato [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md) prevê que estados `past_due`/`suspended` bloqueiem operação; essa verificação está preparada para implementação futura (teste TDD em RequireOperationalBilling.test.tsx pode falhar até lá).

---

## 3. Resumo

| Gate | Condição | Ação |
|------|----------|------|
| FlowGate | 0 tenants | Redirect para `/app/select-tenant` (SelectTenantPage envia 0 → `/bootstrap`) |
| FlowGate | 1 tenant | Auto-select; permite /app/* |
| FlowGate | >1 tenants | Redirect `/app/select-tenant` até seleção |
| FlowGate | Tenant não selado em /app/* | Hard-stop; não monta (exceto /bootstrap, /app/select-tenant) |
| RequireOperational | isPublished === false | Bloqueia /op/*; mostra "Sistema não operacional" |
| RequireOperational | isPublished === true | Libera /op/* |
| RequireOperational | billingStatus | Não implementado; apenas isPublished hoje |

---

## Referências

- [RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md](./RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md)
- [TENANT_SELECTION_CONTRACT.md](./TENANT_SELECTION_CONTRACT.md)
- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md)
- [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md)
- [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md)
