# NEXT STEPS - ChefIApp Core

> Checklist of next steps after cleanup, validation, and ratification of the Core.
> Date: 2026-02-01 · Updated: **Primeiro cliente pago** (Fases 1–6 do [PLANO_FINAL_PRIMEIRO_E79.md](docs/PLANO_FINAL_PRIMEIRO_E79.md) concluídas).

**👉 Fazer agora (se ainda não fizeste Supabase):** [Supabase deploy — Começar aqui](docs/implementation/FASE_5_SUPABASE_DEPLOY.md)

**Next (agora):**
- **Se ainda não fizeste deploy Supabase nem FASE B em URL real:** 1) [Supabase deploy](docs/implementation/FASE_5_SUPABASE_DEPLOY.md) → 2) [FASE B em Supabase](docs/implementation/FASE_5_FASE_B_SUPABASE_RUNBOOK.md) → 3) Se PASSOU → [Primeiro cliente pagante €79](docs/pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md). Manual; sem código pendente.
- **Se o primeiro €79 já está fechado (Fases 1–6 feitas):** 1) `git tag first-paid-customer` e `git push origin first-paid-customer` → 2) Próximo bloco: [Onda 5](docs/pilots/ONDA_4_VALOR_E_ONDA_5.md) (dashboard com uso real) ou [Bloco 1 Piloto](docs/VALIDACAO_BLOCO_1_PILOTO.md) (lista 10 alvos, 5 instalações).
- **E2E local:** `cd merchant-portal && npm run test:e2e`. Se a app já estiver a correr em 5175: `E2E_NO_WEB_SERVER=1 npm run test:e2e`. Noutra porta: `E2E_BASE_URL=http://localhost:PORTA npm run test:e2e`. **Smoke rápido:** `E2E_NO_WEB_SERVER=1 npm run test:e2e:smoke` (fluxo-total + fase-a + fase-b).

---

## FASE 5 (implementation) — Próximo executável

**Estado:** FASE C feita; FASE B E2E local PASSOU (2026-02-01). Fluxo único: Landing → Auth → Bootstrap (sem estados demo paralelos; ver CONTRATO_VIDA_RESTAURANTE v2). **Fluxo total:** [FASE_5_FLUXO_TOTAL_CHECKLIST.md](docs/implementation/FASE_5_FLUXO_TOTAL_CHECKLIST.md) — 10 fases (configuração → TPV/KDS → tarefas → pedido → trial → Billing Stripe demo). **Próximo passo:** 1) [Supabase deploy](docs/implementation/FASE_5_SUPABASE_DEPLOY.md) (criar projeto, migrations, env, Auth) → 2) [FASE B em Supabase](docs/implementation/FASE_5_FASE_B_SUPABASE_RUNBOOK.md) (URL real) → 3) Se PASSOU → [Primeiro cliente pagante €79](docs/pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md). Índice: [docs/implementation/INDEX.md](docs/implementation/INDEX.md).

---

## Próximo passo imediato

**Estado consolidado:** [docs/ESTADO_CONSOLIDADO_SISTEMA.md](docs/ESTADO_CONSOLIDADO_SISTEMA.md) — estado atual válido e intencional; 500s esperados; regra: produto avaliado por humano, não por Network tab. **Decisões Fase €79:** [docs/DECISOES_CONSOLIDADAS_FASE_E79.md](docs/DECISOES_CONSOLIDADAS_FASE_E79.md) — papéis (Dono-first), presença digital adiada, três adiamentos explícitos.

**Plano executável (do agora até ao primeiro €79):** [docs/PLANO_FINAL_PRIMEIRO_E79.md](docs/PLANO_FINAL_PRIMEIRO_E79.md) — Fases 0–6, sem decisões; seguir até fechar.

**Ordem ativa (Opção A — Comercial):** Executar exatamente nesta ordem. Supabase só depois do primeiro dinheiro real ([SUPABASE_QUANDO_ATIVAR.md](docs/SUPABASE_QUANDO_ATIVAR.md)).

| #   | Passo                    | Doc                                                                                       | Critério                                                                        |
| --- | ------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Teste Humano E2E         | [VALIDACAO_TESTE_HUMANO_E2E.md](docs/VALIDACAO_TESTE_HUMANO_E2E.md)                       | Escrever "Agora vejo." Se falhar: ajustar copy/CTA/gating, nunca arquitetura.   |
| 2   | Stripe Live              | [VALIDACAO_STRIPE_PRODUCAO.md](docs/VALIDACAO_STRIPE_PRODUCAO.md)                         | 1 checkout completo funcional (pode ser cartão de teste).                       |
| 3   | Domínio                  | [VALIDACAO_DOMINIO_PRODUCAO.md](docs/VALIDACAO_DOMINIO_PRODUCAO.md)                       | HTTPS ativo; redirects e webhook alinhados com Stripe.                          |
| 4   | Primeiro Cliente Pagante | [VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md](docs/VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md) | 1 restaurante, 1 turno, €79 recebidos, feedback curto. Nesse momento = negócio. |
| 5   | Supabase                 | [SUPABASE_QUANDO_ATIVAR.md](docs/SUPABASE_QUANDO_ATIVAR.md)                               | Após passo 4: projeto, migrações, webhook Stripe.                               |
| 6   | Fecho                    | [PLANO_FINAL_PRIMEIRO_E79.md](docs/PLANO_FINAL_PRIMEIRO_E79.md) § Fase 6                  | Marcar "Primeiro cliente pago", tag `first-paid-customer`.                      |
| 7   | Google Auth              | [AUTH_GOOGLE_QUANDO_ENTRAR.md](docs/AUTH_GOOGLE_QUANDO_ENTRAR.md)                         | Só após Supabase; otimização de onboarding, não requisito de venda.             |

**Roteiro venda:** [docs/PLANO_VENDA_STRIPE_DOMINIO_ONBOARDING.md](docs/PLANO_VENDA_STRIPE_DOMINIO_ONBOARDING.md)

1. **Stripe** — [docs/VALIDACAO_STRIPE_PRODUCAO.md](docs/VALIDACAO_STRIPE_PRODUCAO.md): `VITE_STRIPE_PRICE_ID`, webhook `stripe-billing-webhook`, migração `billing_status`.
2. **Domínio** — [docs/VALIDACAO_DOMINIO_PRODUCAO.md](docs/VALIDACAO_DOMINIO_PRODUCAO.md): DNS, HTTPS, deploy merchant-portal, URLs Stripe em produção.
3. **Primeiro cliente pagante** — [docs/pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](docs/pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md): 1 restaurante piloto, €79, smoke test, feedback.
4. **Supabase** — ⏸️ Em espera até primeiro dinheiro real. Regra e checklist: [docs/SUPABASE_QUANDO_ATIVAR.md](docs/SUPABASE_QUANDO_ATIVAR.md).
5. **Google Auth** — Só após Supabase. Regra: [docs/AUTH_GOOGLE_QUANDO_ENTRAR.md](docs/AUTH_GOOGLE_QUANDO_ENTRAR.md).
6. **Bloco 1 Piloto** — [docs/VALIDACAO_BLOCO_1_PILOTO.md](docs/VALIDACAO_BLOCO_1_PILOTO.md): ICP, lista 10 alvos, script abordagem, checklist onboarding, agendar 5 instalações ([docs/pilots/ONDA_4_PILOTO_P1.md](docs/pilots/ONDA_4_PILOTO_P1.md)).
7. **Bloco 2 Piloto** — [docs/VALIDACAO_BLOCO_2_PILOTO.md](docs/VALIDACAO_BLOCO_2_PILOTO.md): métricas, template report 2 semanas, checklist 2 sem, regra go/no-go ([docs/pilots/ONDA_4_PILOTO_P2.md](docs/pilots/ONDA_4_PILOTO_P2.md)).
8. **Bloco 3 Production Readiness** — [docs/VALIDACAO_BLOCO_3_PRODUCTION.md](docs/VALIDACAO_BLOCO_3_PRODUCTION.md): testes, gate CI, release, migrações, observabilidade (itens 14–18 já [x] no [checklist](docs/ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md)).
9. **Bloco 4 Valor percebido** — Welcome, landing/pitch, preço piloto ([docs/pilots/ONDA_4_VALOR_E_ONDA_5.md](docs/pilots/ONDA_4_VALOR_E_ONDA_5.md) § Bloco 4).
10. **Bloco 5 Onda 5** — Definir escopo, congelar, executar ([docs/pilots/ONDA_4_VALOR_E_ONDA_5.md](docs/pilots/ONDA_4_VALOR_E_ONDA_5.md) § Bloco 5); refs: [ROADMAP_FECHO_GAPS_CHEFIAPP.md](docs/ROADMAP_FECHO_GAPS_CHEFIAPP.md), [ONDAS_4_A_7_ESTRATEGIA.md](docs/ONDAS_4_A_7_ESTRATEGIA.md).

**Ferramentas venda:** Script presencial 5–7 min: [docs/pilots/SCRIPT_VENDA_PRESENCIAL_5_7_MIN.md](docs/pilots/SCRIPT_VENDA_PRESENCIAL_5_7_MIN.md). Checklist segundo cliente: [docs/pilots/CHECKLIST_SEGUNDO_CLIENTE.md](docs/pilots/CHECKLIST_SEGUNDO_CLIENTE.md).

**Depois da Onda 4:** Executar Onda 5 (kick-off conforme plano definido no passo 8).

**Onda 5 — Estado** (ref.: [ONDAS_4_A_7_ESTRATEGIA.md](docs/ONDAS_4_A_7_ESTRATEGIA.md) — Owner Dashboard & controlo, ~30 dias):

- Escopo e critérios em [ONDA_4_VALOR_E_ONDA_5.md](docs/pilots/ONDA_4_VALOR_E_ONDA_5.md) §22. Escopo congelado: [ONDA_5_ESCOPO_CONGELADO.md](docs/pilots/ONDA_5_ESCOPO_CONGELADO.md).
- Primeiras tarefas: [ONDA_5_TAREFAS.md](docs/pilots/ONDA_5_TAREFAS.md). **Implementado:** O5.1 (hub + atalhos), O5.5 (métricas do dia), O5.6 (histórico por turno), O5.7 (fonte única métricas — coreOrSupabaseRpc), O5.8 (alertas no hub), O5.9 (limiares), O5.10 (ação imediata + runbook).
- Checklist Onda 4 itens 22–24 marcados em [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](docs/ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md). **Próximo Onda 5:** validar dashboard com uso real ([VALIDACAO_TESTE_HUMANO_E2E.md](docs/VALIDACAO_TESTE_HUMANO_E2E.md) + Stripe + primeiro cliente) ou marcar kick-off comunicado; depois Onda 6.

---

## ✅ PRIMEIRO CLIENTE PAGO (Plano €79 — Fases 1–6)

- [x] Fase 1 — Teste Humano E2E ("Agora vejo.")
- [x] Fase 2 — Stripe Live (VITE_STRIPE_PRICE_ID, /app/billing)
- [x] Fase 3 — Domínio + Produção (HTTPS, rotas validadas)
- [x] Fase 4 — Primeiro cliente pagante (€79 recebidos)
- [x] Fase 5 — Supabase (projeto, migrações, webhook)
- [x] Fase 6 — Fecho (NEXT_STEPS atualizado; tag `first-paid-customer` quando fizer push)

**Tag (quando fizer push):** `git tag first-paid-customer` → `git push origin first-paid-customer`

---

## ✅ ONDA 3 CONCLUÍDA (Fev 2026)

- [x] **E1–E3** — THREAT_MODEL mitigações, validação/rate limit, OWASP_ASVS evidência
- [x] **F1–F3** — Auth/caixa audit events, purge runbook
- [x] **G1–G4** — Event pipeline (Realtime), SLO_SLI §2.1, alertas §G3, dashboard operacional (OperationalMetricsCards)
- [x] **H1–H2** — DATA_LINEAGE §3 (tabelas→fontes→consumidores), processo §5.1 + `scripts/lineage-check.sh`
- [x] **CHECKLIST_FECHO_GAPS** atualizado (16 itens 🟢)

Ver: [docs/ONDA_3_TAREFAS_90_DIAS.md](docs/ONDA_3_TAREFAS_90_DIAS.md) · [docs/CHECKLIST_FECHO_GAPS.md](docs/CHECKLIST_FECHO_GAPS.md).

---

## ✅ COMPLETED IN THIS SESSION

- [x] **WebOrderingService** — Tipos e shim Supabase (Docker): `customer_email` em `WebOrderInput`, casts `(supabase as any)` para compatibilidade Jest; mock `rpc` em `WebOrderingService.test.ts`; 4 testes passam, 2 em skip (recordOrderSubmission / timeout).
- [x] Total code cleanup (25 files, 11 directories)
- [x] Complete validation (24h simulation)
- [x] Core Manifesto ratified
- [x] Fail-fast mode implemented
- [x] Complete documentation created
- [x] Commits organized
- [x] Historical tag created (`v1.0-core-sovereign`)

---

## 🚀 NEXT STEPS

### Immediate (Today/Tomorrow)

- **Onda 4.5 — Máquina de venda ligada.** CTA → Auth → Onboarding → TPV; Billing dentro do app (BillingBanner, /app/billing, past_due gating em TPV/KDS/Cash). **Próximo:** instalar em 1 restaurante real e ativar Stripe (€79). Checklist: [docs/pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](docs/pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md). Pendência BD: aplicar migração `20260201180000_add_billing_status_to_gm_restaurants.sql` se ainda não aplicada.
- [ ] **Checklist Piloto e Produção (Onda 4)** — **Roteiro oficial:** [docs/PLANO_PASSO_A_PASSO_CHEFIAPP.md](docs/PLANO_PASSO_A_PASSO_CHEFIAPP.md). Passo 0.1 concluído. Passo 1: 1.1 ICP e 1.3 script preparados em [ONDA_4_PILOTO_P1.md](docs/pilots/ONDA_4_PILOTO_P1.md). **Próximo passo:** preencher 1.2 (lista 10 restaurantes) e 1.4 (agendar 5 instalações). Em paralelo: Passo 3 (Valor percebido) em [ONDA_4_VALOR_E_ONDA_5.md](docs/pilots/ONDA_4_VALOR_E_ONDA_5.md).
- [x] **Onda 4 — POS Ultra-Rápido (escopo engenharia)** — A1–A4, B1–B6, C1–C3, D1–D2 concluídos. Ref.: [ONDA_4_TAREFAS_30_45_DIAS.md](docs/ONDA_4_TAREFAS_30_45_DIAS.md). **Próximo:** P1–P2 piloto (2–5 restaurantes; métricas) ou push/CI/testes.
- [ ] **Refinamentos pós-Onda 3** — Itens ainda 🟡 em [CHECKLIST_FECHO_GAPS](docs/CHECKLIST_FECHO_GAPS.md) (ex.: revisão jurídica/DPO em GDPR_MAPPING, RETENTION_POLICY; C2). Ou: push, CI, testes.
- [x] **Jest: excluir merchant-portal** — Em `jest.config.js`, o projeto `node` usa `roots` apenas em pastas com testes Jest; merchant-portal (Vitest) deixou de ser corrido pelo `npm test` na raiz. Resultado: 99 suítes (18 menos), 53 passam, 46 falham (falhas restantes em `tests/` — integração, mocks, tipos).
- [ ] **Estado dos testes (`npm test`)**
      Suíte raiz (Jest): **34 suítes passam, 65 falham**. **464 testes passam, 26 falham, 4 em skip.** Correções feitas: PostgresLink mock (jsdom), FiscalConfigAlert (stub + React import), realtime-reconnect (API ReconnectManager), tipos em property-based.test.ts (property-based continua em testPathIgnorePatterns e depende de event-log/projections removidos). Próximo: refatorar testes que dependem de APIs/módulos removidos ou corrigir tipos/import.meta.

- [x] **Push to remote** *(feito: core/frozen-v1 e tag v1.0-core-sovereign)*

  ```bash
  git push -u origin core/frozen-v1
  git push origin v1.0-core-sovereign
  ```

  **Próximo passo imediato:** Preencher [ONDA_4_PILOTO_P1.md](docs/pilots/ONDA_4_PILOTO_P1.md) §6 (lista 10 alvos) e §9 (agendar 5 instalações).

- [ ] **Review created documentation**
  - Read `START_HERE.md`
  - Review `CORE_MANIFESTO.md`
  - Validate `EXECUTIVE_SUMMARY.md`

### Short Term (This Week)

- [x] **Integrate fail-fast in CI/CD** *(feito: Makefile com simulate-failfast; CI corre make simulate-failfast após npm ci)*

  - Add step in GitHub Actions / GitLab CI
  - Run `make simulate-failfast` on each PR
  - Block merge if it fails

- [ ] **Add PR gates**

  - Requirement: `make simulate-24h-small` must pass
  - Requirement: `make assertions` must pass
  - Document in `CONTRIBUTING.md`

- [ ] **Document development workflow**
  - How to make changes to Core
  - When to use fail-fast vs complete simulation
  - Validation process before commit

### Medium Term (This Month)

- [ ] **Return to UI calmly**

  - Core is protected, can evolve UI without risk
  - Focus on UX improvements
  - Keep Core intact

- [ ] **Tests with real restaurant**

  - Identify pilot restaurant
  - Validate Core in real operation
  - Collect feedback

- [ ] **Small pilot**
  - 1-3 restaurants
  - Governance validation in production
  - Adjustments based on feedback

### Long Term (Next 3 Months)

- [ ] **Target architecture 2026+**

  - Plan architectural evolutions
  - Document long-term vision
  - Align with manifesto

- [ ] **Market entry plan**

  - Product narrative
  - Competitive positioning
  - Go-to-market strategy

- [ ] **Product narrative**
  - Competitive differentiator
  - Use cases
  - Value proof

---

## 🔧 TECHNICAL IMPROVEMENTS

### Simulator

- [ ] Add more restaurant profiles
- [ ] Create "ultra-fast" mode (30 seconds)
- [ ] Add performance metrics
- [ ] Create metrics dashboard

### Documentation

- [ ] Add Core usage examples
- [ ] Create troubleshooting guide
- [ ] Document Core APIs
- [ ] Create architecture diagrams

### CI/CD

- [ ] Automate validation on each commit
- [ ] Create automatic reports
- [ ] Integrate with monitoring tools
- [ ] Add regression alerts

---

## 📊 METRICS TO TRACK

### Core

- [ ] Number of manifesto violations
- [ ] Simulator success rate
- [ ] Fail-fast execution time
- [ ] Test coverage

### Development

- [ ] Average validation time
- [ ] Detected regression rate
- [ ] Number of PRs blocked by failure
- [ ] Team satisfaction

---

## 🎯 HIGH-LEVEL OBJECTIVES

### Core Protection

- [ ] Zero manifesto violations
- [ ] 100% of PRs validated by simulator
- [ ] Zero regressions in production

### Core Evolution

- [ ] New features always validated
- [ ] Documentation always updated
- [ ] Simulator always exercising

### Product

- [ ] Core validated in real production
- [ ] Feedback incorporated
- [ ] Roadmap aligned with manifesto

---

## 📝 NOTES

### Pending Decisions

- [ ] Evaluate referenced but unconfigured edge functions

  - `analytics-engine`
  - `reconcile`
  - `health`

- [ ] Decide on delivery adapters

  - `ifood.ts`
  - `uber-eats.ts`

- [ ] Review old TODOs (80+)
  - Convert to issues or remove

### Identified Risks

- [ ] TypeScript errors in pre-commit hook

  - Resolve or adjust hook

- [ ] Extensive commented code (60+ files)
  - Review and clean

---

## 🎓 LESSONS FOR THE FUTURE

1. **Keep manifesto updated**

   - Review periodically
   - Update when necessary
   - Communicate changes

2. **Simulator is priority**

   - Always exercise new features
   - Maintain high coverage
   - Use fail-fast during development

3. **Documentation is investment**
   - Keep updated
   - Facilitate onboarding
   - Reduce questions

---

## 💬 CONTACT AND SUPPORT

For questions about next steps:

- Consult `START_HERE.md` for navigation
- Consult `CORE_MANIFESTO.md` for principles
- Consult `docs/PROJECT_STATUS.md` for current state

---

_This document should be reviewed and updated periodically._
