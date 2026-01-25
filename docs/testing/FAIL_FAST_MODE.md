# FAIL-FAST MODE - Quick Core Validation

> Quick validation mode for use during refactoring and iterative development.

---

## OBJECTIVE

Validate Core integrity in **~1 real minute** (1 simulated hour), stopping at the first detected error.

---

## USAGE

### Via Makefile (Recommended)

```bash
cd docker-tests
make simulate-failfast
```

### Direct

```bash
cd docker-tests
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
MODE=failfast DURATION_MINUTES=1 \
node simulators/simulate-failfast.js
```

---

## CHARACTERISTICS

| Characteristic | Value |
|----------------|-------|
| Real duration | 1 minute |
| Simulated duration | 1 hour |
| Multiplier | 60x |
| Restaurants | 5 (small) |
| Validations | Integrity only |
| Output | Minimalist |
| Exit code | 0 = OK, 1 = FAILURE |

---

## EXECUTED VALIDATIONS

1. **Orphan Items**
   - Checks if there are `gm_order_items` without corresponding `gm_orders`
   - Immediate failure if detected

2. **Orphan Print Jobs**
   - Checks if there are `gm_print_jobs` without corresponding `gm_orders`
   - Immediate failure if detected

---

## WHEN TO USE

✅ **Use fail-fast when:**
- Refactoring Core code
- Adding new features
- Making changes to critical logic
- Before important commits
- During iterative development

❌ **DO NOT use fail-fast for:**
- Complete validation (use `simulate-24h-small`)
- Scale tests (use `simulate-24h-large`)
- Complete governance validation (use `simulate-24h-small`)

---

## CI/CD INTEGRATION

```yaml
# GitHub Actions example
- name: Fail-Fast Validation
  run: |
    cd docker-tests
    make simulate-failfast
```

**Advantage:** Quick validation in PRs without blocking the pipeline.

---

## EXIT CODES

| Code | Meaning |
|------|---------|
| 0 | ✅ Core intact |
| 1 | ❌ Integrity error detected |

---

## OUTPUT

### Success

```
⚡ FAIL-FAST MODE
   Duration: 1 min → 1h simulated
   Multiplier: 60.0x

🚀 Starting simulation...

🔍 Validating integrity...

✅ PASS
   Orders: X
   Events: Y
   Errors: 0

✅ FAIL-FAST: Core intact
```

### Failure

```
❌ FAIL-FAST: Orphan items detected: 5
```

---

## DIFFERENCES FROM COMPLETE MODE

| Aspect | Fail-Fast | Complete (24h) |
|--------|-----------|----------------|
| Duration | 1 min | 5-7 min |
| Simulated hours | 1h | 24h |
| Validations | Integrity | Everything |
| Governance | No | Yes |
| Offline | No | Yes |
| Escalation | No | Yes |
| Report | No | Yes |

---

## NEXT STEPS

After fail-fast passes:
1. ✅ Core is functionally correct
2. ⏭️ Run `simulate-24h-small` for complete validation
3. ⏭️ Run `make assertions` for final validation

---

## TECHNICAL NOTES

- Uses fixed seed for reproducibility
- Cleans data before execution
- Doesn't create reports (focus on speed)
- Stops at first error (fail-fast)

---

*This mode is part of MEGA OPERATIONAL SIMULATOR v2.1*
