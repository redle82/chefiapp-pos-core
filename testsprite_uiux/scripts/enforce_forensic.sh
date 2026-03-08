#!/bin/bash
# enforce_forensic.sh (Phase E Edition)
# Checks for forbidden patterns in the codebase using ripgrep (rg).
# Fails build if "Theater" (bad patterns) are found.

echo "🔍 FORENSIC ENFORCEMENT SCAN STARTING..."
EXIT_CODE=0

# 1. NO BLOCKING ALERTS (Law: No Blocking UI)
echo "Checking for blocking alert() calls..."
if rg "alert\(" merchant-portal/src --glob "!**/*.spec.ts" --glob "!**/*.test.tsx" -g "!**/scripts/**" | grep -v "//" | grep -v "/\*"; then
    echo "❌ [FAIL] Blocking alert() found."
    EXIT_CODE=1
else
    echo "✅ [PASS] No blocking alerts found."
fi

# 2. NO INSECURE STRIPE KEYS (Law: Zero Trust Config)
echo "Checking for hardcoded Stripe fallback keys..."
if rg "pk_test_" merchant-portal/src/components/payment/StripePaymentModal.tsx; then
    echo "❌ [FAIL] Hardcoded Stripe key found."
    EXIT_CODE=1
else
    echo "✅ [PASS] StripePaymentModal is clean."
fi

# 3. NO FETCH WITHOUT TIMEOUT (Law: Resilience)
echo "Checking for unsafe fetch() usage in Critical Paths..."
CRITICAL_FILES=(
  "merchant-portal/src/pages/Public/PublicPages.tsx"
  "merchant-portal/src/pages/start/PublishPage.tsx"
  "merchant-portal/src/core/queue/useOfflineReconciler.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ ! -f "$file" ]; then continue; fi
  if grep "fetch(" "$file" | grep -v "fetchWithTimeout" | grep -v "//" | grep -v "/\*" > /dev/null; then
    echo "❌ [FAIL] Raw fetch() found in $file."
    EXIT_CODE=1
  else
    echo "✅ [PASS] $file uses fetchWithTimeout or is clean."
  fi
done

# 4. THE LAW OF IDENTITY (No Unguarded Mocks)
echo "Checking for unguarded Identity Bypasses in Core Security Files..."
# Regex targets: Mock, mock, fake, stub, simulate, bypass - but NOT allow_mocks which is our guard.
FORBIDDEN_REGEX="(Mock|mock|fake|stub|simulate|bypass)"

IDENTITY_FILES=(
  "merchant-portal/src/core/health/useCoreHealth.ts"
  "merchant-portal/src/pages/AppStaff/context/StaffContext.tsx"
)

for file in "${IDENTITY_FILES[@]}"; do
    if [ ! -f "$file" ]; then continue; fi
    
    # 1. Does file contain any forbidden keywords?
    if grep -E "$FORBIDDEN_REGEX" "$file" > /dev/null; then
        # 2. If yes, it MUST contain "ALLOW_MOCKS" or explicit "import.meta.env.DEV" guard logic.
        # We explicitly look for our standard guard `ALLOW_MOCKS` or the raw env check.
        if grep -E "ALLOW_MOCKS|import.meta.env.DEV|import.meta.env.MODE === 'test'" "$file" > /dev/null; then
             echo "✅ [PASS] $file contains Identity protections (Guard detected)."
        else
             echo "❌ [FAIL] $file contains 'mock/fake/bypass' logic but NO 'ALLOW_MOCKS/DEV' guard."
             # Show the offending lines for context
             grep -E "$FORBIDDEN_REGEX" "$file" | head -n 3
             EXIT_CODE=1
        fi
    else
        echo "✅ [PASS] $file is clean of mock keywords."
    fi
done

echo "----------------------------------------"
if [ $EXIT_CODE -eq 0 ]; then
    echo "🛡️  FORENSIC SCAN PASSED. READY FOR PRODUCTION."
else
    echo "🚫 FORENSIC SCAN FAILED. FIX VIOLATIONS."
fi

exit $EXIT_CODE
