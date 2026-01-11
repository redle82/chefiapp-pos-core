# Truth Suite — Phase 0 Contract Validation

## Doctrine

> **"UI NEVER anticipates the Core."**

This test suite validates that ChefIApp's UI layer adheres to the Truth First principle:
- No fake progress bars
- No silent demo fallbacks
- No theatrical delays
- No time promises in microcopy
- All critical actions gated by health status

---

## Test Categories

### 1. Health Monitoring (`truth.health.spec.ts`)
Tests the core health monitoring infrastructure:
- TPV blocked when health is DOWN
- TPV ready when health is UP and gates ok

### 2. Action Gating (`truth.gating.spec.ts`)
Tests that critical actions are blocked appropriately:
- Gates TPV when `gates.ok` is false
- Gates TPV when setup steps incomplete
- Ghost state cannot act like live state

### 3. Offline Queue (`truth.tpv.spec.ts`)
Tests the offline queue reconciliation system:
- Offline -> Queue -> Pending Badge
- Offline -> Online -> Reconcile SUCCESS
- Offline -> Online -> Reconcile FAIL
- Backoff strategy protection

### 4. Creating Flow (`truth.creating.spec.ts`)
Tests the restaurant creation page:
- Shows demo_prompt when health DOWN (no silent fallback)
- Demo mode requires explicit user consent
- Retry button attempts real API call
- No fake progress bars

### 5. Publishing Flow (`truth.publish.spec.ts`)
Tests the publish page:
- Publish blocked when health DOWN
- Successful publish with real API when UP
- Demo mode shows explicit warning
- Demo mode publish is simulated (no API)
- API error shows explicit error state

### 6. Payments Flow (`truth.payments.spec.ts`)
Tests the Stripe validation:
- Stripe validation blocked when health DOWN
- Real API validation when health UP
- Demo mode shows explicit notice
- Invalid key format shows immediate error
- API error shows explicit message

### 7. Core Status Banner (`truth.banner.spec.ts`)
Tests the global health status indicator:
- Banner visible when health DOWN
- Banner hidden when health UP
- Demo mode banner always visible
- Health transitions update banner

### 8. Microcopy Audit (`truth.microcopy.spec.ts`)
Validates no forbidden patterns exist:
- No "em segundos" / "instant"
- No "pronto em X minutos"
- No fake progress percentages
- No "automaticamente" for manual actions

### 9. Chaos Flapping (`truth.chaos.spec.ts`)
Validates honesty during real UP/DOWN flips against a flapping mock core:
- Health banner tracks real state
- Actions stay gated when DOWN
- No ghost moves while backend is unstable

---

## Running Tests

```bash
# Run all truth tests
./run-truth-tests.sh

# Run with browser visible
./run-truth-tests.sh --headed

# Run specific test file
./run-truth-tests.sh --grep "health"

# Debug mode
./run-truth-tests.sh --debug

# Stress loop (parallel + repeat)
./scripts/truth-stress.sh

# Chaos flapping (spins mock core + headed TPV check) — requires CHAOS_MODE=1
./scripts/truth-chaos.sh
```

---

## Architecture

```
tests/playwright/truth/
├── fixtures/
│   └── healthMock.ts       # Health status mocking utilities
├── utils/
│   └── selectors.ts        # Centralized DOM selectors
├── truth.health.spec.ts    # Health monitoring tests
├── truth.gating.spec.ts    # Action gating tests
├── truth.tpv.spec.ts       # Offline queue tests
├── truth.creating.spec.ts  # Creating flow tests
├── truth.publish.spec.ts   # Publishing flow tests
├── truth.payments.spec.ts  # Payments flow tests
├── truth.banner.spec.ts    # Banner tests
├── truth.microcopy.spec.ts # Microcopy audit tests
└── README.md               # This file
```

---

## Truth Contracts

Each test validates a specific truth contract:

| Contract ID | Description | Test File |
|-------------|-------------|-----------|
| TL-001 | Health check before critical actions | creating, publish, payments |
| TL-002 | Demo mode requires explicit consent | creating |
| TL-003 | No fake progress indicators | creating, microcopy |
| TL-004 | No silent demo fallbacks | creating, publish |
| TL-005 | Health banner reflects real state | banner |
| TL-006 | Retry is human decision | tpv, creating, publish |
| TL-007 | No time promises in copy | microcopy |
| TL-008 | Offline queue shows honest badges | tpv |
| TL-009 | Gates block when not ready | gating |
| TL-010 | Ghost vs Live explicit | gating |

---

## Adding New Tests

When adding new tests:

1. Follow the naming convention: `truth.<feature>.spec.ts`
2. Use selectors from `utils/selectors.ts`
3. Use `mockHealth()` from `fixtures/healthMock.ts`
4. Document which Truth Contract is being tested
5. Ensure test validates REAL state, not assumptions

---

## Forbidden Patterns

The following patterns are NEVER allowed in the UI:

```typescript
// Forbidden in microcopy
"em segundos"
"instant"
"imediato"
"pronto em X minutos"
"automaticamente" (for user actions)
"100%" (without real progress)

// Forbidden in code
setTimeout(() => navigate(...))  // Fake success
setProgress(50)                   // Fake progress
localStorage.setItem('demo', 'true') // Silent fallback
```

---

## Continuous Integration

The Truth Suite should run on every PR:

```yaml
- name: Run Truth Suite
  run: ./run-truth-tests.sh
```

No PR should be merged if Truth Suite fails.

---

## Phase 0 Seal

When all tests pass, the system achieves **TRUTH-LOCKED** status:

```
Estado do Sistema: TRUTH-LOCKED
Regra: "UI nunca antecipa o Core."
Score: 9.2/10
```

---

*Built under the AntiGravity Truth Testing methodology.*
*Design like lives depend on it.*
