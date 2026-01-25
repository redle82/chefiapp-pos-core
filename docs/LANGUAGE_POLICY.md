# Language Policy — Official Repository Rule

> **This document defines the official language policy for the ChefIApp Core repository.**  
> **Status:** MANDATORY  
> **Last updated:** 2026-01-24

---

## 🎯 Golden Rule

**"If a Stripe / Oracle / SAP engineer opens this, do they understand?"**

- **Yes** → English is mandatory
- **No (personal notes only)** → Portuguese is acceptable

---

## ✅ MANDATORY ENGLISH

### 1. Code

**Everything in code must be in English:**

- Variable names
- Function names
- Class names
- File names
- Directory names
- Error messages
- Structured logs
- Comments (structural, not personal notes)

**Examples:**
```typescript
// ✅ CORRECT
function calculateSLA(task: Task): number { ... }
const offlineQueue: OfflineAction[] = [];

// ❌ FORBIDDEN
function calcularSLA(tarefa: Tarefa): number { ... }
const filaOffline: AcaoOffline[] = [];
```

---

### 2. Commits

**All commit messages must be in English.**

**Format:** `type: description`

**Examples:**
```
✅ CORRECT:
feat: add SLA escalation engine
fix: prevent duplicate offline orders
chore: clean legacy task stubs
docs: convert canonical documents to English

❌ FORBIDDEN:
ajuste: arrumando bug
teste: funcionando agora
docs: convertendo documentos
```

**Commit types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `chore`: Maintenance
- `refactor`: Code refactoring
- `test`: Tests
- `perf`: Performance

---

### 3. Documentation

**All canonical documentation must be in English:**

- README.md
- CORE_MANIFESTO.md
- ARCHITECTURE.md
- GOVERNANCE.md
- SECURITY.md
- TESTING.md
- CONTRIBUTING.md
- Any document that defines system behavior

**Examples:**
```
✅ CORRECT:
docs/CORE_OVERVIEW.md
docs/STATUS_TECH.md
docs/STATUS_OPERATION.md

❌ FORBIDDEN:
docs/VISAO_GERAL.md
docs/STATUS_TECNICO.md
```

---

### 4. Issues and Pull Requests

**All issues and PRs must be in English:**

- Title
- Description
- Comments
- Labels (if custom)

**Why:** Even if you're the only contributor today, future contributors, auditors, and investors will read these.

---

### 5. File and Directory Names

**All file and directory names must be in English:**

```
✅ CORRECT:
task-engine/
escalation-engine.js
offline-controller.ts
CORE_MANIFESTO.md

❌ FORBIDDEN:
motor-tarefas/
motor-escalacao.js
controlador-offline.ts
MANIFESTO_CORE.md
```

---

## 🟡 PORTUGUESE ALLOWED (Personal Notes Only)

**Portuguese is acceptable ONLY in:**

- `docs/notes/` - Personal notes
- `docs/sessions/` - Session logs
- `docs/brain-dump/` - Mental drafts
- Files explicitly marked as personal (e.g., `SESSION_2026-01-24.md`, `DECISIONS_PT.md`)

**Criteria for Portuguese:**
- ✅ Not canonical (doesn't define system behavior)
- ✅ Not used by third parties
- ✅ Personal memory/notes only
- ✅ Clearly marked as non-canonical

**Examples:**
```
✅ ACCEPTABLE:
docs/notes/IDEIA_2026-01-24.md
docs/sessions/SESSION_COMPLETE.md
docs/brain-dump/REFACTORING_IDEAS.md

❌ FORBIDDEN (even if personal):
CORE_MANIFESTO_PT.md (in root)
docs/ARCHITECTURE_PT.md (canonical doc)
```

---

## 🚫 NEVER MIX LANGUAGES

**Rule:** One language per file. Never mix English and Portuguese in the same document.

```
❌ FORBIDDEN:
# Core Overview

Este documento explica o sistema.

This document explains the system.

✅ CORRECT:
# Core Overview

This document explains the system.
```

---

## 📋 Decision Matrix

Use this matrix to decide the language:

| Item | Audience | Language | Example |
|------|----------|----------|---------|
| Code | Engineers worldwide | English | `calculateSLA()` |
| Commits | Git history | English | `feat: add SLA` |
| Canonical docs | Investors, auditors | English | `CORE_MANIFESTO.md` |
| Issues/PRs | Contributors | English | `Fix: offline sync` |
| Personal notes | You only | Portuguese OK | `docs/notes/IDEIA.md` |
| Session logs | You only | Portuguese OK | `docs/sessions/SESSION.md` |

---

## 🎯 Why This Matters

### GitHub is Not a Personal Diary

GitHub is:
- 📦 Technical asset
- 🧠 Decision record
- ⚖️ Proof of authorship
- 💼 Audit object
- 🏷️ Transferable product

### Real-World Examples

**Companies that use English for core:**
- Spotify (Sweden) → Everything in English
- SAP (Germany) → Everything in English
- Mercado Livre (Brazil) → Core in English
- Nubank (Brazil) → Core in English
- iFood (Brazil) → Core in English

**Founders speak Portuguese, Spanish, German.**  
**Code speaks English.**

---

## 🔧 Enforcement

### Pre-commit Hooks (Recommended)

Add to `.husky/pre-commit` or similar:

```bash
# Check commit message is in English
if ! echo "$COMMIT_MSG" | grep -qE '^[a-z]+: [A-Z]'; then
  echo "❌ Commit message must be in English (format: type: description)"
  exit 1
fi
```

### Code Review Checklist

- [ ] All code in English
- [ ] All commits in English
- [ ] All documentation in English (if canonical)
- [ ] No language mixing in files

---

## 📚 Related Documents

- **[CONTRIBUTING.md](../../CONTRIBUTING.md)** - Contribution guidelines
- **[CORE_MANIFESTO.md](../../CORE_MANIFESTO.md)** - Core principles
- **[docs/MIGRATION_PLAN_EN.md](./MIGRATION_PLAN_EN.md)** - Migration plan

---

## ✅ Summary

**Mandatory English:**
- Code (variables, functions, files, directories)
- Commits
- Canonical documentation
- Issues and PRs

**Portuguese Allowed:**
- Personal notes (`docs/notes/`)
- Session logs (`docs/sessions/`)
- Brain dumps (`docs/brain-dump/`)

**Never:**
- Mix languages in the same file
- Use Portuguese in canonical documents
- Use Portuguese in code or commits

---

**This policy is part of Core v1.0-core-sovereign.**

*"The world doesn't measure intention, it measures form. English makes the world take this seriously without you needing to explain anything."*
