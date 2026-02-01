# START HERE - ChefIApp Core

> Entry point to understand the current state of ChefIApp Core.

---

## 🎯 QUICK START

### To Understand the System

1. **Read first:** [`CORE_MANIFESTO.md`](./CORE_MANIFESTO.md)

   - Defines what the Core IS and WILL NEVER BE
   - Non-negotiable principles
   - Rules for the future

2. **Executive summary:** [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md)

   - Consolidated view of everything achieved
   - Competitive differentiator
   - Validated capabilities

3. **Current state:** [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md)
   - Current architecture
   - Available commands
   - Validation metrics

### To Validate the Core

```bash
# Da raiz do repo: fail-fast (typecheck + build)
make simulate-failfast

# Testes completos
npm test -- --ci --testPathIgnorePatterns="e2e|playwright|massive|offline" --testTimeout=15000 --maxWorkers=2
```

### Merchant Portal — dev server

- **Use:** `npm run dev` (from `merchant-portal/`). Port 5175, `strictPort: true` in `vite.config.ts`.
- **Do not use:** `npx vite` or `npx vite --port N` — they ignore the config and can start on another port.
- If 5175 is in use, Vite fails (no fallback). Free the port or stop the other process.

---

## 📚 COMPLETE DOCUMENTATION

### Strategic Documents

| Document                                             | Description       | When to Read  |
| ---------------------------------------------------- | ----------------- | ------------- |
| [`CORE_MANIFESTO.md`](./CORE_MANIFESTO.md)           | System law        | **First**     |
| [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md)     | Executive summary | Presentations |
| [`SESSION_COMPLETE.md`](./SESSION_COMPLETE.md)       | Session summary   | Handoff       |
| [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md) | Current state     | Reference     |

### Technical Documentation

| Document                                                                                     | Description            | When to Read |
| -------------------------------------------------------------------------------------------- | ---------------------- | ------------ |
| [`docs/CORE_ARCHITECTURE.md`](./docs/CORE_ARCHITECTURE.md)                                   | Core architecture      | Development  |
| [`docs/CORE_VALIDATION_CERTIFICATE.md`](./docs/CORE_VALIDATION_CERTIFICATE.md)               | Validation certificate | Validation   |
| [`docs/testing/MEGA_OPERATIONAL_SIMULATOR.md`](./docs/testing/MEGA_OPERATIONAL_SIMULATOR.md) | Complete simulator     | Testing      |
| [`docs/testing/FAIL_FAST_MODE.md`](./docs/testing/FAIL_FAST_MODE.md)                         | Fail-fast mode         | Development  |

### Refactoring Documentation

| Document                                                                   | Description      | When to Read |
| -------------------------------------------------------------------------- | ---------------- | ------------ |
| [`docs/refactor/CLEANUP_REPORT.md`](./docs/refactor/CLEANUP_REPORT.md)     | Cleanup report   | History      |
| [`docs/refactor/LEGACY_INVENTORY.md`](./docs/refactor/LEGACY_INVENTORY.md) | Legacy inventory | Reference    |

---

## 🏷️ HISTORICAL MILESTONE

**Tag:** `v1.0-core-sovereign`
**Branch:** `core/frozen-v1`
**Date:** 2026-01-24

This milestone represents the moment when ChefIApp Core was:

- ✅ Completely cleaned of dead code
- ✅ Validated by 24-hour simulation
- ✅ Protected by formal manifesto
- ✅ Made sovereign (independent of UI)

---

## 🚀 ESSENTIAL COMMANDS

### Validation

```bash
# Da raiz do repo
make simulate-failfast   # typecheck + build (CI fail-fast)
npm test -- --ci --testPathIgnorePatterns="e2e|playwright|massive|offline" --testTimeout=15000 --maxWorkers=2
bash ./scripts/sovereignty-gate.sh
```

### Development

```bash
# Clean data
cd docker-tests && make clean

# Start services (KDS, Print)
cd docker-tests && make kds-start
```

---

## 📊 CURRENT STATE

| Aspect         | Status |
| -------------- | ------ |
| Core Clean     | ✅     |
| Core Validated | ✅     |
| Core Protected | ✅     |
| Core Testable  | ✅     |
| Core Sovereign | ✅     |

**Last validation:**

- Orders: 964
- Tasks: 210 created, 196 completed
- Escalations: 89
- Orphan Items: 0
- Orphan Print Jobs: 0

---

## 🎯 NEXT STEPS

**👉 Próximo passo imediato:** [NEXT_STEPS.md](NEXT_STEPS.md) — lista completa. Piloto P1: preencher [ONDA_4_PILOTO_P1](docs/pilots/ONDA_4_PILOTO_P1.md) §6 (lista 10 alvos) e §9 (agendar 5 instalações).

### FASE 5 — Implementation (Merchant Portal)

**Ordem:** 1) [Supabase deploy](docs/implementation/FASE_5_SUPABASE_DEPLOY.md) → 2) [FASE B em Supabase](docs/implementation/FASE_5_FASE_B_SUPABASE_RUNBOOK.md) (teste humano em URL real) → 3) Se PASSOU → [Primeiro cliente pagante €79](docs/pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md). Índice: [docs/implementation/INDEX.md](docs/implementation/INDEX.md).

### Immediate (Core)

```bash
# Push to remote
git push -u origin core/frozen-v1
git push origin v1.0-core-sovereign
```

### Short Term

- [x] Integrate fail-fast in CI/CD *(feito: Makefile + CI)*
- [ ] Add PR gates (simulator mandatory)
- [ ] Document development workflow

### Medium Term

- [ ] Return to UI calmly (Core protected)
- [ ] Tests with real restaurant
- [ ] Small pilot

---

## 💡 FUNDAMENTAL PRINCIPLES

1. **Governance > Convenience**
2. **Integrity > Speed**
3. **Offline is a Valid State**
4. **UI is Disposable**
5. **If the Simulator Doesn't Exercise It, It's Not Core**

---

## 🔗 QUICK LINKS

- [Core Manifesto](./CORE_MANIFESTO.md)
- [Executive Summary](./EXECUTIVE_SUMMARY.md)
- [Project Status](./docs/PROJECT_STATUS.md)
- [Simulator](./docs/testing/MEGA_OPERATIONAL_SIMULATOR.md)
- [Fail-Fast Mode](./docs/testing/FAIL_FAST_MODE.md)

---

## 📞 CONTACT

For questions about the Core, consult:

- `CORE_MANIFESTO.md` for principles
- `docs/PROJECT_STATUS.md` for current state
- `docs/testing/MEGA_OPERATIONAL_SIMULATOR.md` for validation

---

_Last updated: 2026-02-01_
