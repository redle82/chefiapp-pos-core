# CORE Test Suite

Test suite that attempts to break the CORE on purpose.

## Philosophy

> "If these tests pass, the CORE is real. If they fail, we found weaknesses."

These tests are not about "happy path". They're about proving the CORE cannot be broken.

## Test Coverage

### Impossible Cases (from 03_CORE_CONSTRAINTS.md)

1. ✅ Create ORDER without ACTIVE session
2. ✅ Create PAYMENT for non-LOCKED order
3. ✅ Modify ORDER.total after LOCKED
4. ✅ Modify ORDER_ITEM after ORDER is LOCKED
5. ✅ Close session with OPEN or LOCKED orders
6. ✅ Transition ORDER to PAID without CONFIRMED payment
7. ✅ Manually set TABLE.state (it's derived)
8. ✅ Reverse CONFIRMED payment
9. ✅ Modify ORDER after CLOSED or CANCELED
10. ✅ Create ORDER_ITEM when ORDER.state ≠ OPEN

### Stress Tests

- Invalid state transitions (skipping states)
- Concurrency (race conditions)
- Payment retry
- Split bill (multiple payments)

## Running Tests

```bash
# Install dependencies (if using Jest)
npm install --save-dev jest @types/jest

# Run tests
npm test

# Or with specific test file
npm test core.constraints.test.ts
```

## Test Structure

Each test:
1. Sets up mock data
2. Attempts to violate a constraint
3. Asserts that the violation is rejected

## Current Status

⚠️ **IMPORTANT**: These tests currently use placeholder implementations.

The state machine executor has:
- ✅ State transition validation
- ✅ Terminal state protection
- ⚠️ Guard execution (placeholder - returns true)
- ⚠️ Effect execution (placeholder - no-op)

**Next Steps:**
1. Implement real guard logic based on constraints
2. Implement real effect logic (calculateTotal, lockItems, etc.)
3. Add database persistence layer
4. Add actual concurrency control (locks)

## What These Tests Prove

If all tests pass:
- ✅ State machine is correctly defined
- ✅ Terminal states are protected
- ✅ Invalid transitions are rejected
- ⚠️ Business rules are enforced (when guards are implemented)

If tests fail:
- 🔍 We found a weakness in the CORE
- 🔍 We need to fix the constraint or implementation
- 🔍 We prevent bugs before production

## Future Tests Needed

- [ ] Offline-first reconciliation
- [ ] Event sourcing consistency
- [ ] Fiscal document generation
- [ ] Audit log immutability
- [ ] Multi-device synchronization

