# NEXT STEPS - ChefIApp Core

> Checklist of next steps after cleanup, validation, and ratification of the Core.
> Date: 2026-02-01 · Updated: Produto pronto para piloto (Passo 0.1 TPV manual concluído).

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

- [ ] **Checklist Piloto e Produção (Onda 4)** — **Roteiro oficial:** [docs/PLANO_PASSO_A_PASSO_CHEFIAPP.md](docs/PLANO_PASSO_A_PASSO_CHEFIAPP.md). Passo 0.1 concluído. Passo 1: 1.1 ICP e 1.3 script preparados em [ONDA_4_PILOTO_P1.md](docs/pilots/ONDA_4_PILOTO_P1.md). **Próximo passo:** preencher 1.2 (lista 10 restaurantes) e 1.4 (agendar 5 instalações). Em paralelo: Passo 3 (Valor percebido) em [ONDA_4_VALOR_E_ONDA_5.md](docs/pilots/ONDA_4_VALOR_E_ONDA_5.md).
- [x] **Onda 4 — POS Ultra-Rápido (escopo engenharia)** — A1–A4, B1–B6, C1–C3, D1–D2 concluídos. Ref.: [ONDA_4_TAREFAS_30_45_DIAS.md](docs/ONDA_4_TAREFAS_30_45_DIAS.md). **Próximo:** P1–P2 piloto (2–5 restaurantes; métricas) ou push/CI/testes.
- [ ] **Refinamentos pós-Onda 3** — Itens ainda 🟡 em [CHECKLIST_FECHO_GAPS](docs/CHECKLIST_FECHO_GAPS.md) (ex.: revisão jurídica/DPO em GDPR_MAPPING, RETENTION_POLICY; C2). Ou: push, CI, testes.
- [x] **Jest: excluir merchant-portal** — Em `jest.config.js`, o projeto `node` usa `roots` apenas em pastas com testes Jest; merchant-portal (Vitest) deixou de ser corrido pelo `npm test` na raiz. Resultado: 99 suítes (18 menos), 53 passam, 46 falham (falhas restantes em `tests/` — integração, mocks, tipos).
- [ ] **Estado dos testes (`npm test`)**  
  Suíte raiz (Jest): **32 suítes passam, 67 falham** (muitas por TS/import.meta ao importar merchant-portal sob Jest). **458 testes passam, 26 falham, 4 em skip.** Jest config: `roots` do projeto node limitados a `tests`, `core-engine`, `fiscal-modules` (pastas removidas como server, billing-core foram retiradas). Próximo: refatorar testes que dependem de APIs/módulos removidos ou corrigir tipos/import.meta.

- [ ] **Push to remote**
  ```bash
  git push -u origin core/frozen-v1
  git push origin v1.0-core-sovereign
  ```

- [ ] **Review created documentation**
  - Read `START_HERE.md`
  - Review `CORE_MANIFESTO.md`
  - Validate `EXECUTIVE_SUMMARY.md`

### Short Term (This Week)

- [ ] **Integrate fail-fast in CI/CD**
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

*This document should be reviewed and updated periodically.*
