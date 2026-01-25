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
cd docker-tests

# Quick validation (1 min)
make simulate-failfast

# Complete validation (5 min)
make simulate-24h-small

# Integrity assertions
make assertions
```

---

## 📚 COMPLETE DOCUMENTATION

### Strategic Documents

| Document | Description | When to Read |
|----------|-------------|--------------|
| [`CORE_MANIFESTO.md`](./CORE_MANIFESTO.md) | System law | **First** |
| [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md) | Executive summary | Presentations |
| [`SESSION_COMPLETE.md`](./SESSION_COMPLETE.md) | Session summary | Handoff |
| [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md) | Current state | Reference |

### Technical Documentation

| Document | Description | When to Read |
|----------|-------------|--------------|
| [`docs/CORE_ARCHITECTURE.md`](./docs/CORE_ARCHITECTURE.md) | Core architecture | Development |
| [`docs/CORE_VALIDATION_CERTIFICATE.md`](./docs/CORE_VALIDATION_CERTIFICATE.md) | Validation certificate | Validation |
| [`docs/testing/MEGA_OPERATIONAL_SIMULATOR.md`](./docs/testing/MEGA_OPERATIONAL_SIMULATOR.md) | Complete simulator | Testing |
| [`docs/testing/FAIL_FAST_MODE.md`](./docs/testing/FAIL_FAST_MODE.md) | Fail-fast mode | Development |

### Refactoring Documentation

| Document | Description | When to Read |
|----------|-------------|--------------|
| [`docs/refactor/CLEANUP_REPORT.md`](./docs/refactor/CLEANUP_REPORT.md) | Cleanup report | History |
| [`docs/refactor/LEGACY_INVENTORY.md`](./docs/refactor/LEGACY_INVENTORY.md) | Legacy inventory | Reference |

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
cd docker-tests

# Quick validation (1 min)
make simulate-failfast

# Complete validation (5 min)
make simulate-24h-small

# Validation with large profiles
make simulate-24h-large

# Validation with giant profiles
make simulate-24h-giant

# Integrity assertions
make assertions

# Last simulation report
make report-24h
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

| Aspect | Status |
|--------|--------|
| Core Clean | ✅ |
| Core Validated | ✅ |
| Core Protected | ✅ |
| Core Testable | ✅ |
| Core Sovereign | ✅ |

**Last validation:**
- Orders: 964
- Tasks: 210 created, 196 completed
- Escalations: 89
- Orphan Items: 0
- Orphan Print Jobs: 0

---

## 🎯 NEXT STEPS

### Immediate

```bash
# Push to remote
git push -u origin core/frozen-v1
git push origin v1.0-core-sovereign
```

### Short Term

- [ ] Integrate fail-fast in CI/CD
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

*Last updated: 2026-01-24*
