# Alinhamento de workspaces (Fase 4)

**Objetivo:** Um único documento que indica **onde vive cada app**, **como testar** e **contrato mínimo com o Core**.  
**Referência:** [FASE_4_EXPANSAO_CONTROLADA.md](./FASE_4_EXPANSAO_CONTROLADA.md) — Definition of Done "Workspaces alinhados".

---

## 1. Onde vive cada um

| Workspace / app | Localização | Stack |
|-----------------|-------------|--------|
| **merchant-portal** | `merchant-portal/` (raiz do monorepo) | React, Vite, React Router, Vitest, Playwright |
| **desktop-app** | `desktop-app/` (raiz do monorepo) | Electron; carrega frontend do merchant-portal |
| **mobile-app** | `mobile-app/` (raiz do monorepo) | Expo, React Native, Jest |
| **customer-portal** | Removido do workspace (F5.1); diretório e código ausentes. Histórico: [C42_CUSTOMER_PORTAL_STATE.md](./C42_CUSTOMER_PORTAL_STATE.md) | — |
| **Core** | `docker-core/` (Postgres + PostgREST) | Schema em `docker-core/schema/`; porta 54320 (local) |

---

## 2. Como testar

| App | Comando / nota |
|-----|-----------------|
| **merchant-portal** | `pnpm --filter merchant-portal run test -- --run` (Vitest). E2E: `pnpm --filter merchant-portal run test:e2e`. Conformidade Fase 3: `pnpm --filter merchant-portal run test:fase3-conformance`. |
| **desktop-app** | Sem suíte de testes automatizada no Electron; validar pairing manualmente (README "How Pairing Works"). Estrutura verificada por `npm run audit:fase3-conformance` (probe). |
| **mobile-app** | `pnpm --filter mobile-app test` (Jest). Conformidade Fase 3: testes em `__tests__/services/mobileActivationApi.test.ts` (role from backend, recovery/reinstall, activation flow); incluído em `npm run audit:fase3-conformance`. Evidence pack: [C41_MOBILE_PHASE3_EVIDENCE.md](./C41_MOBILE_PHASE3_EVIDENCE.md) (classificação **ALIGNED**). |
| **customer-portal** | **Não é workspace** — removido em F5.1. Sem testes no repo; ver C42 se for reintroduzido. |
| **Core** | Health: `http://localhost:3001/rest/v1/`. Billing: `DATABASE_URL=... npm run audit:billing-core`. |

**Probe global (Fase 3):** Na raiz: `npm run audit:fase3-conformance` — desktop estrutura + merchant-portal conformance + mobile-app mobileActivationApi.

---

## 3. Contrato mínimo com o Core

Todos os workspaces que operam sobre dados do restaurante/pedidos/pagamentos devem:

- **Ler** apenas via APIs do Core (PostgREST, RPCs); não assumir tabelas ou colunas não expostas.
- **Escrever** apenas via RPCs ou escritas autorizadas (ex.: `consume_device_install_token`, `device_heartbeat`, `revoke_terminal`); não fazer INSERT/UPDATE direto em tabelas `gm_*` a partir do cliente.
- **Identidade / papel:** dispositivo (TPV/KDS) via provisioning (token → `gm_terminals`); operador (AppStaff) via invite/backend (role de `active_invites.role_granted` ou gateway `/mobile/activate`). Nunca inferir papel a partir do texto do código.
- **Billing:** estado de billing vem do Core (`gm_restaurants.billing_status`); o frontend não inventa nem altera; gates (ex.: `RequireOperational`) leem runtime e bloqueiam conforme contrato.

Ref.: [CORE_IDENTITY_AND_TRUST_CONTRACT.md](../architecture/CORE_IDENTITY_AND_TRUST_CONTRACT.md), [DEVICE_CONTRACT.md](../contracts/DEVICE_CONTRACT.md), [FASE_3_CONFORMANCE_INTER_APP.md](./FASE_3_CONFORMANCE_INTER_APP.md).

---

## 4. Gates de release (resumo)

| Gate | Comando | Quando |
|------|---------|--------|
| Portal (typecheck + testes + leis) | `npm run audit:release:portal` | Antes de PR/deploy do merchant-portal |
| Billing Core | `DATABASE_URL=... npm run audit:billing-core` | Após alterações a billing ou antes de release; BD com migrações de billing |
| Fase 3 conformance | `npm run audit:fase3-conformance` | Validar conformidade identidade/pairing (desktop + portal + mobile) |

---

## 5. C4.3 — Gate `audit:billing-core` em pipeline

**Onde corre:** `.github/workflows/ci.yml`, job `validate`, step "Audit billing Core (gm_restaurants.billing_status vs merchant_subscriptions)".

**Quando corre:** Apenas quando o secret **`CORE_BILLING_AUDIT_DATABASE_URL`** está definido (Settings → Secrets and variables → Actions). Se não estiver definido, o step é ignorado e o CI não falha por causa deste gate.

**Pré-requisitos:** BD Core acessível a partir dos runners, com tabelas `gm_restaurants.billing_status` e `merchant_subscriptions` (migrações de billing aplicadas).

**Condição de falha:** O script devolve exit 1 → job falha. Causas: DRIFT ou BAD_VALUE na comparação, ou erro de conexão à BD. Ver logs do step para detalhe.

**Comando manual (reproduzir localmente):**

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
npm run audit:billing-core
```

Doc detalhada: [AUDIT_BILLING_CORE_RUN.md](../ops/AUDIT_BILLING_CORE_RUN.md).

---

## 6. C4.4 — Observabilidade e rollout

**Sinais de saúde por superfície:**

| Superfície | Sinal / check | Comando ou URL |
|------------|----------------|----------------|
| **merchant-portal** | Testes + typecheck + leis | `npm run audit:release:portal` |
| **merchant-portal** | Build + preview | `npm -w merchant-portal run build && npm -w merchant-portal run preview` |
| **Core** | REST health | `bash scripts/core/health-check-core.sh` ou `curl $CORE_URL/rest/v1/` (200) |
| **Core** | Billing consistência | `DATABASE_URL=... npm run audit:billing-core` |
| **desktop-app** | Estrutura / pairing | Incluído em `npm run audit:fase3-conformance` |
| **mobile-app** | Testes (mobileActivationApi) | `pnpm --filter mobile-app test`; incluído em `audit:fase3-conformance`; evidence pack: [C41_MOBILE_PHASE3_EVIDENCE.md](./C41_MOBILE_PHASE3_EVIDENCE.md) |
| **customer-portal** | Removido do workspace (F5.1) | — |

**Gates (F5.2):** **Required before merge:** Job `validate` em `.github/workflows/ci.yml` (typecheck, lint, testes, sovereignty, check-financial-supabase, **audit:fase3-conformance**, opcionalmente `audit:billing-core` se secret definido). **Required before deploy:** `npm run audit:release:portal` ou `scripts/deploy/pre-flight-check.sh`. **Pre-release inter-app (F5.3):** `npm run audit:pre-release` (sequência: opcional health Core, obrigatório audit:fase3-conformance, opcional audit:billing-core); evidence pack: [F53_GOLDEN_PATH_EVIDENCE.md](./F53_GOLDEN_PATH_EVIDENCE.md). Definição explícita: [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) §2 e §6.

**Checklists operacionais:**

- **Rollout:** [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) §4; detalhe em [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](../ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md), [ROLLOUT_QUICK_REFERENCE.md](../ops/ROLLOUT_QUICK_REFERENCE.md).
- **Rollback:** [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) §5; detalhe em [rollback-procedure.md](../ops/rollback-procedure.md).

**Definição explícita (required before merge / before deploy / recommended manual) e tabela de gates:** [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) §2 e §3.

**Observabilidade existente:** Sentry (merchant-portal, mobile-app); Logger estruturado; health Core; ver [OBSERVABILITY_SETUP.md](../ops/OBSERVABILITY_SETUP.md), [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](../ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md). Gaps assumidos: DSN opcional. customer-portal removido do workspace (F5.1) — ver [C42_CUSTOMER_PORTAL_STATE.md](./C42_CUSTOMER_PORTAL_STATE.md).

---

## 7. C4.2 / F5.1 — Customer-portal (removido do workspace)

**Estado:** **Removido do workspace (F5.1 — Opção A).** Já não consta de `package.json` workspaces; diretório e código ausentes. Decisão e relatório: [C42_CUSTOMER_PORTAL_STATE.md](./C42_CUSTOMER_PORTAL_STATE.md) §8.

**Resumo:** Workspace fantasma eliminado; repo coerente. Se o customer-portal for reintroduzido no futuro, seguir contrato §3 e voltar a registar em §1–§2.

---

## 8. C4.1 — Evidence pack mobile-app (Fase 3 conformance)

**Classificação:** **ALIGNED** — teste explícito "role from backend", recovery/reinstall automatizado e evidência do fluxo de ativação em `mobileActivationApi.test.ts`; probe `audit:fase3-conformance` exige estes testes verdes.

**Evidência:** [C41_MOBILE_PHASE3_EVIDENCE.md](./C41_MOBILE_PHASE3_EVIDENCE.md) — localização, comandos de validação, contratos, 9 testes (boot safety, role from backend, recovery, activation flow), classificação.

**Comandos de validação:** `npm run audit:fase3-conformance` (inclui mobile-app); `pnpm --filter mobile-app test -- mobileActivationApi.test.ts`.

---

## 9. Fase 5 (convergência) e Fase 6 (estabilidade)

**Fase 5:** F5.1–F5.4 fechados. Ver [FASE_5_CONVERGENCIA_OPERACIONAL.md](./FASE_5_CONVERGENCIA_OPERACIONAL.md).

**Fase 6:** F6.2 e F6.3 fechados (limpeza; próximo ciclo definido = Fase 7). Ver [FASE_6_ESTABILIDADE_PROXIMO_CICLO.md](./FASE_6_ESTABILIDADE_PROXIMO_CICLO.md).

**Fase 7:** **Operacionalmente fechada** (F7.1 e F7.2 fechados). Checklist e mapa em ops. F7.3 em espera consciente. Avaliação de drivers: [AVALIACAO_DRIVERS_POS_FASE7.md](./AVALIACAO_DRIVERS_POS_FASE7.md) — não abrir nova fase; critérios para reabrir documentados. Ver [FASE_7_READINESS_ESCALA_OPERACIONAL.md](./FASE_7_READINESS_ESCALA_OPERACIONAL.md) §10 e §11.

---

*Documento de alinhamento de workspaces — Fase 4–6. Atualizar quando customer-portal ou novos packages forem integrados.*
