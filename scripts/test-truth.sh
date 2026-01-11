#!/bin/bash
set -e

echo "🔒 Running Truth Lock Regression Suite..."

# Run only the truth spec
# --headed (omitted for headless CI)
# --max-failures=1 (fail fast)
npx playwright test tests/playwright/truth/truth.tpv.spec.ts --config=playwright.config.truth.ts --max-failures=1

echo "✅ Truth Lock Verified. Code respects reality."
