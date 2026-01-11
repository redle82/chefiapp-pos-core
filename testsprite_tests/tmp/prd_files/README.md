# ChefIApp POS Core (The Truth Layer 🧊)

[![Canon Enforcement](https://github.com/goldmonkey/chefiapp-pos-core/actions/workflows/canon-enforcement.yml/badge.svg)](https://github.com/goldmonkey/chefiapp-pos-core/actions/workflows/canon-enforcement.yml)

**Current Version: v1.0.0 (Truth Freeze + Canon Lock)**

> **"The UI is a consequence of the Truth. It never anticipates, it never lies."**

> **"AppStaff não organiza tarefas. Ele elimina a necessidade de gestão."**

This repository contains the core logic and interface for the ChefIApp Point of Sale system, re-architected under the **Truth First** doctrine and protected by the **6 Immutable Laws** (Canon).

## 📜 The Doctrine

This repository is governed by TWO constitutional frameworks:

### 🧊 Truth First (TPV/Core)
👉 **[SYSTEM_TRUTH_CODEX.md](./SYSTEM_TRUTH_CODEX.md)**

**3 Laws of Truth**:
1. **UiIsConsequence**: State flows from `Core` -> `UI`. Never the inverse.
2. **OnlineEqualsFastOffline**: There is only one code path (optimistic queue). Online is just a special case of fast reconciliation.
3. **TruthZero**: Critical gates (Onboarding, Money) must verify true connectivity before proceeding.

### 🧠 Operational Nervous System (AppStaff)
👉 **[CANON.md](./CANON.md)** (The 6 Immutable Laws)

**6 Laws of Canon**:
1. **Tool Sovereignty** (Tool > Task): Work defines tool, never choice
2. **Reflex** (System > Human): System acts before human thinks
3. **Temporal Memory** (Idle ≠ Zero): Inactivity is information
4. **Cognitive Isolation**: Each role sees only its world
5. **Non-Blocking Suggestions**: Information orbits work
6. **Progressive Externalization**: Work migrates to specialists automatically

👉 **[MANIFESTO.md](./MANIFESTO.md)** (Public Positioning)
👉 **[KILL_SWITCHES.md](./KILL_SWITCHES.md)** (Enforcement Mechanisms)

## 🛡️ Observability & Gates

This project enforces high-reliability standards through automated gates:

### TPV/Core Gates
- **Truth Freeze Gate**: CI workflow (`.github/workflows/truth-gate.yml`) that runs the regression suite (`tests/playwright/truth`)
- **Truth Monitor**: Real-time TPV footer showing Queue/Sync/Fail states

### AppStaff Gates (NEW)
- **Canon Enforcement**: CI workflow (`.github/workflows/canon-enforcement.yml`) that blocks any violation of the 6 Laws
  - ✅ Detects manual task creation (Law 2 violation)
  - ✅ Detects cross-role navigation (Law 4 violation)
  - ✅ Detects UI customization (Anti-Feature)
  - ✅ Detects gamification (Anti-Feature)
  - ✅ Verifies Tool Sovereignty (Law 1)
  - ✅ Verifies System Reflex (Law 2)
  - ✅ Verifies Progressive Externalization (Law 6)
- **Stress Test**: 7-phase behavioral physics test (`tests/nervous-system/AppStaff.stress.test.ts`)
- **Kill Switches**: Code-level errors that prevent Canon violations from compiling

### PR Protocol
All PRs must pass BOTH gates before merge.

## 🚀 Key Features (v1.0.0)
- **Grand Unification**: Zero split-brain logic.
- **Safe Harbor**: Offline TPV actions are safely queued and reconciled.
- **Deterministic Chaos**: Testing infrastructure for network resilience.
- **Visual Truth**: Interfaces that transparently reflect system health (`CoreStatusBanner`, `OrderCard` states).

## 🛠️ Commands
- **Run Dev**: `npm run dev`
- **Run Truth Suite**: `npm run test:truth`
- **Verify Release**: `./scripts/release-check.sh`

---
*Maintained by the Antigravity Team.*