# 🤝 Contributing Guide - ChefIApp

**Guide for contributing to the project**

> ⚠️ **Before contributing, read [`ENGINEERING_CONSTITUTION.md`](ENGINEERING_CONSTITUTION.md)**
> This document defines the non-negotiable rules of the project.

---

## 🌍 Language Policy

> **MANDATORY:** All code, commits, documentation, issues, and PRs must be in **English**.
> See [`docs/LANGUAGE_POLICY.md`](docs/LANGUAGE_POLICY.md) for complete rules.

**Quick rule:** "If a Stripe / Oracle / SAP engineer opens this, do they understand?"

- **Yes** → English is mandatory
- **No (personal notes only)** → Portuguese is acceptable

**Examples:**

```bash
# ✅ CORRECT
git commit -m "feat: add SLA escalation engine"
git commit -m "fix: prevent duplicate offline orders"

# ❌ FORBIDDEN
git commit -m "feat: adiciona motor de escalação"
git commit -m "fix: corrige bug de duplicação"
```

**Portuguese is allowed ONLY in:**

- `docs/notes/` - Personal notes
- `docs/sessions/` - Session logs
- `docs/brain-dump/` - Mental drafts

**Never mix languages in the same file.**

---

## 🎯 How to Contribute

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/chefiapp-pos-core.git
cd chefiapp-pos-core
```

### 2. Create Branch

```bash
# Create branch for feature
git checkout -b feature/new-feature

# Or for bugfix
git checkout -b fix/fix-bug
```

### 3. Development

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Run tests
npm test
```

### 3.1 Validate before PR (fail-fast)

Before pushing, run from repo root (CI runs the same):

```bash
make simulate-failfast   # typecheck + build
```

Optional: `npm test -- --ci --testPathIgnorePatterns="e2e|playwright|massive|offline" --testTimeout=15000 --maxWorkers=2` and `bash ./scripts/sovereignty-gate.sh`.

### 4. Commit

```bash
# Descriptive commits (MUST be in English)
git commit -m "feat: add new feature X"
git commit -m "fix: fix bug Y"
git commit -m "docs: update documentation Z"
```

### 5. Push and PR

```bash
# Push to your fork
git push origin feature/new-feature

# Create Pull Request on GitHub
```

**PR gates (CI):** The branch must pass: `make simulate-failfast` (typecheck + build), Prettier check, Lint, `npm test` (subset), and `scripts/sovereignty-gate.sh`. Run `make simulate-failfast` locally before pushing to avoid failed CI.

---

## 📝 Convenções

### Commits (Conventional Commits)

**MANDATORY: All commit messages must be in English.**

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting (doesn't affect code)
refactor: refactoring
test: add tests
chore: maintenance tasks
```

**Examples:**

```bash
feat: add iFood integration
fix: fix live map timer
docs: update API reference
refactor: simplify FastPayButton
```

### Naming Conventions

**Components:**

```typescript
// PascalCase
FastPayButton.tsx;
KitchenPressureIndicator.tsx;
WaitlistBoard.tsx;
```

**Hooks:**

```typescript
// camelCase with "use" prefix
useKitchenPressure.ts;
useOrder.ts;
useAppStaff.ts;
```

**Services:**

```typescript
// PascalCase
PersistenceService.ts;
InventoryService.ts;
PrinterService.ts;
```

**Utils:**

```typescript
// camelCase
getUrgencyColor.ts;
calculateTotal.ts;
```

---

## 🧪 Testing

### Writing Tests

```typescript
// __tests__/components/FastPayButton.test.tsx
import { render, fireEvent } from "@testing-library/react-native";
import { FastPayButton } from "@/components/FastPayButton";

describe("FastPayButton", () => {
  it("should process payment", async () => {
    // Test
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Minimum Coverage

- **Critical components:** > 90%
- **Hooks:** > 85%
- **Services:** > 80%
- **Utils:** > 95%

---

## 📚 Documentation

### Updating Documentation

When adding a feature:

1. Update `CHANGELOG.md`
2. Update `docs/API_REFERENCE.md` (if necessary)
3. Add example in `docs/CODE_EXAMPLES.md`
4. Update `QUICK_REFERENCE.md` (if relevant)

### Format

```markdown
## New Feature

**Description:** Brief description

**Usage:**
\`\`\`typescript
// Code example
\`\`\`

**Props:**

- `prop1`: type - description
- `prop2`: type - description
```

---

## 🎨 Code Style

### TypeScript

```typescript
// ✅ Explicit types
interface Props {
  orderId: string;
  total: number;
}

// ✅ Avoid any
const data: unknown = await fetch();
if (isValidData(data)) {
  // use typed data
}

// ✅ Descriptive names
const elapsedMinutes = calculateElapsed(order);
// ❌ const time = ...
```

### React

```typescript
// ✅ Functional components
export function FastPayButton({ orderId, total }: Props) {
  // ...
}

// ✅ Hooks at the top
const { orders } = useOrder();
const [state, setState] = useState();

// ✅ useEffect with cleanup
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
}, []);
```

### Imports

```typescript
// ✅ Order: external, internal, relative
import React from "react";
import { View, Text } from "react-native";
import { useOrder } from "@/context/OrderContext";
import { FastPayButton } from "@/components/FastPayButton";
```

---

## 🐛 Reporting Bugs

### Template

```markdown
**Description:**
Brief description of the bug

**Steps to Reproduce:**

1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What is happening

**Environment:**

- OS: iOS/Android
- Version: 1.0.0
- Device: iPhone 13 / Pixel 6

**Logs:**
\`\`\`
Relevant logs
\`\`\`
```

---

## 💡 Suggesting Features

### Template

```markdown
**Feature:**
Feature name

**Problem:**
What problem it solves

**Proposed Solution:**
How it would solve it

**Alternatives Considered:**
Other options

**Impact:**

- Affected users
- Complexity
- Estimated time
```

---

## 📊 Observability

### Logging

```typescript
// ✅ Use centralized Logger
import { Logger } from "@/core/logger";

Logger.info("Order created", { orderId, table });
Logger.error("Payment failed", { orderId, error });

// ❌ Avoid console.log in production
console.log("debug"); // Don't do this
```

### Errors

```typescript
// ✅ Capture exceptions with context
try {
  await processPayment(order);
} catch (error) {
  Logger.error("Payment error", { orderId: order.id, error });
  throw error; // Re-throw if necessary
}

// ✅ ErrorBoundary in React components
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>;
```

### Metrics

```typescript
// ✅ Use metrics hooks when available
const { metrics, isLoading } = useRealtimeMetrics();
```

---

## 🏛️ Core Development Workflow

> **IMPORTANT:** Changes to the Core require mandatory validation via simulator.

### What is Considered Core

- `docker-tests/simulators/`
- `docker-tests/task-engine/`
- `merchant-portal/src/core/`
- `mobile-app/context/` (OrderContext, AppStaffContext)
- `mobile-app/services/` (NowEngine, PersistenceService)
- `supabase/functions/`
- `server/`
- `CORE_MANIFESTO.md`

### Core Development Workflow

#### 1. Before Starting

```bash
# Read CORE_MANIFESTO.md
# Verify if the change violates any principle
# Confirm that the simulator can exercise the change
```

#### 2. During Development

```bash
cd docker-tests

# Quick validation (1 min) - Use during development
make simulate-failfast

# If it passes, continue
# If it fails, fix before continuing
```

#### 3. Before Commit

```bash
cd docker-tests

# Complete validation (5 min) - Mandatory before commit
make simulate-24h-small

# Integrity assertions
make assertions

# If both pass, you can commit
# If they fail, DO NOT commit until fixed
```

#### 4. Pull Request

**Mandatory Requirements:**

- ✅ `make simulate-failfast` must pass (automatically validated in CI)
- ✅ `make simulate-24h-small` must pass (automatically validated in CI for PRs to `main` or `core/frozen-v1`)
- ✅ `make assertions` must pass (automatically validated in CI)
- ✅ CORE_MANIFESTO.md not violated
- ✅ Documentation updated (if necessary)

**CI/CD will block merge if any validation fails.**

### When to Use Each Validation

| Situation           | Validation                                             | Time     |
| ------------------- | ------------------------------------------------------ | -------- |
| During development  | `make simulate-failfast`                               | ~1 min   |
| Before commit       | `make simulate-24h-small`                              | ~5 min   |
| Before merge (main) | `make simulate-24h-small` + `make assertions`          | ~5 min   |
| Complete validation | `make simulate-24h-large` or `make simulate-24h-giant` | ~5-7 min |

### Absolute Rules

1. **No Core changes without validation**

   - If the simulator doesn't exercise it, it's not Core
   - Untested code = dead code

2. **No violation of CORE_MANIFESTO.md**

   - Any violation is architectural regression
   - Must be reverted immediately

3. **No critical logic outside Core**

   - Governance lives in Core
   - Offline lives in Core
   - SLA lives in Core

4. **UI never governs**
   - UI consumes Core, doesn't govern
   - UI can be rewritten, Core remains

### Troubleshooting

**Simulador falha:**

1. Verificar `make assertions`
2. Revisar mudanças recentes
3. Consultar `docs/testing/MEGA_OPERATIONAL_SIMULATOR.md`
4. Verificar logs do simulador

**CI/CD falha:**

1. Executar validações localmente
2. Verificar se PostgreSQL está rodando (para CI local)
3. Revisar mudanças que podem ter quebrado o Core
4. Consultar `HANDOFF.md` para troubleshooting

---

## 🔍 Code Review

### Checklist

**Functionality:**

- [ ] Code works as expected
- [ ] Tests passing
- [ ] No regressions

**Core (if applicable):**

- [ ] `make simulate-failfast` passed
- [ ] `make simulate-24h-small` passed (if PR to main/core/frozen-v1)
- [ ] `make assertions` passed
- [ ] CORE_MANIFESTO.md not violated
- [ ] Simulator exercises the change

**Language:**

- [ ] All code in English
- [ ] All commits in English
- [ ] All documentation in English (if canonical)
- [ ] No language mixing in files

**Code:**

- [ ] Follows conventions
- [ ] Well documented
- [ ] No dead code
- [ ] Performance OK

**Observability:**

- [ ] Errors captured with context
- [ ] Appropriate logs (info/warn/error)
- [ ] No console.log in production

**Security:**

- [ ] Inputs validated
- [ ] No sensitive data exposed
- [ ] Errors handled

**Documentation:**

- [ ] README updated (if necessary)
- [ ] Changelog updated
- [ ] Clear comments

---

## 🚀 Release Process

### Versão

**Semantic Versioning:**

- `MAJOR.MINOR.PATCH`
- `1.0.0` → `1.0.1` (patch: bugfix)
- `1.0.0` → `1.1.0` (minor: feature)
- `1.0.0` → `2.0.0` (major: breaking)

### Release Checklist

- [ ] All tests passing
- [ ] Changelog updated
- [ ] Version bump
- [ ] Tag created
- [ ] Release notes written
- [ ] Deploy tested

---

## 📞 Contact

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** dev@chefiapp.com

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing! 🎉**

**Version:** 1.0.0
**Last updated:** 2026-01-24
