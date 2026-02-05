# Contrato Trial Real (SystemState único)

**Propósito:** Fonte única de verdade para o estado do sistema (configuração vs trial vs pago vs suspenso). Elimina demo/pilot/live como estado de produto na UI; trial 14 dias é o único modo de entrada pós-bootstrap.

**Ref:** Plano de refatoração SEM DEMO; [CONTRATO_VIDA_RESTAURANTE.md](CONTRATO_VIDA_RESTAURANTE.md) (jornada); [RESTAURANT_LIFECYCLE_CONTRACT.md](RESTAURANT_LIFECYCLE_CONTRACT.md) (configured/published/operational).

---

## 1. SystemState (enum canónico)

| Estado     | Descrição breve                                      |
| ---------- | ---------------------------------------------------- |
| **SETUP**  | Bootstrap incompleto (sem restaurante pronto / sem primeiro produto). |
| **TRIAL**  | Bootstrap OK → entra automaticamente em trial (14 dias). |
| **ACTIVE** | Subscription ativa (plano pago).                     |
| **SUSPENDED** | Pagamento falhou / cancelado / overdue.            |

Não existe "demo" nem "piloto" como estado de produto na UI. Se precisar internamente (Docker vs Supabase), isso fica como dataMode (infra), nunca exposto como estado do sistema.

---

## 2. Regra de derivação

```
if (!hasOrganization || !isBootstrapComplete) → SETUP
else if (billingStatus ∈ { trial, "", free }) → TRIAL
else if (billingStatus ∈ { active, paid }) → ACTIVE
else → SUSPENDED
```

- **hasOrganization:** existe restaurante (tenant) associado ao utilizador.
- **isBootstrapComplete:** bootstrap concluído (ex.: `mode === "active"` no runtime).
- **billingStatus:** valor de `gm_restaurants.billing_status` ou equivalente (trial | active | past_due | canceled | null). `null` ou vazio trata-se como trial.

Implementação: `deriveSystemState(params)` em `core/lifecycle/LifecycleState.ts`.

---

## 3. Copy na UI (card Estado do sistema)

| SystemState | Copy |
| ----------- | ---- |
| SETUP       | "Complete o setup para começar." |
| TRIAL       | "Trial ativo — 14 dias para operar no seu restaurante real." |
| ACTIVE      | "Plano ativo — operação ao vivo." |
| SUSPENDED   | "Pagamento em atraso — regularize para continuar." |

Sem botões "Ativar piloto" ou "Ativar ao vivo" na UI; ativação é via Billing/Stripe. Trial é default pós-bootstrap; TPV não bloqueado durante trial.

---

## 4. O que fica de fora

- Detalhe de Stripe, webhooks, migrações.
- Jornada (VISITOR, BOOTSTRAP_*, READY) — ver CONTRATO_VIDA_RESTAURANTE.
- configured/published/operational — ver RESTAURANT_LIFECYCLE_CONTRACT.
- dataMode (demo/live) para fallback de dados — uso interno, não estado de produto na UI.

---

Última atualização: 2026-02-01 (FASE C refatoração SEM DEMO).
