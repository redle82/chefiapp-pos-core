# GATE 1: Property-Based Tests

Property-based tests that prove the CORE maintains financial invariants under random inputs and concurrent operations.

## Properties Tested

### 1. Immutability of total_cents after LOCKED
- **Property**: `total_cents` never changes after ORDER is LOCKED
- **Volume**: ≥ 100 iterations
- **Method**: Generate random orders with items, lock them, attempt mutations
- **Verification**: 
  - Direct mutation attempts
  - Event replay consistency
  - State rebuild consistency

### 2. Irreversibility of CONFIRMED payments
- **Property**: CONFIRMED payment state never changes
- **Volume**: ≥ 100 iterations
- **Method**: Generate random payments, confirm them, attempt state transitions
- **Verification**:
  - FAIL, CANCEL, RETRY all fail
  - Event replay consistency
  - State rebuild consistency

### 3. Concurrency without inconsistent states
- **Property**: Never have inconsistent state between payments and orders
- **Volume**: ≥ 50 concurrent executions per seed
- **Method**: Concurrent payment confirmations, concurrent FINALIZE attempts
- **Verification**:
  - If total confirmed >= order total, order MUST be PAID
  - Never have CONFIRMED payments with ORDER≠PAID when total reached
  - Never have ORDER=PAID without sufficient confirmed payments

### 4. Deterministic replay
- **Property**: Same events in same order = same state
- **Volume**: ≥ 50 iterations
- **Method**: Generate random event sequences, rebuild state twice
- **Verification**: States are identical

## Running Tests

```bash
# Install dependencies
npm install

# Run property-based tests
npm test property-based.test.ts

# Run with specific seed (for reproducibility)
SEED=42 npm test property-based.test.ts
```

## Test Configuration

- **fast-check**: Property-based testing framework
- **Seeds**: Fixed seeds (42) for reproducibility + random seeds
- **Volume**: Meets minimum requirements (100+ iterations for properties 1-2, 50+ for property 3)

## Success Criteria

✅ **GATE 1 PASSES** when:
- 100% of properties maintained
- Zero false positives
- Failures are reproducible (seed recorded)

## Failure Handling

If a property fails:
1. fast-check will provide a minimal counterexample
2. Seed will be recorded for reproducibility
3. Counterexample can be used to fix the bug
4. Test should be re-run to verify fix

## Next Steps

After GATE 1 passes:
- GATE 2: Legal Boundary Layer
- GATE 3: Database persistence
- GATE 4: Offline-first

