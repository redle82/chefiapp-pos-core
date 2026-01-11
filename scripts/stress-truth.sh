#!/bin/bash

RUNS=${1:-20}
WORKERS=${2:-4}

echo "🔒 Truth Stress Test — ${RUNS} runs | ${WORKERS} workers"

for i in $(seq 1 $RUNS); do
  echo "▶️ Run $i / $RUNS"
  npx playwright test tests/playwright/truth/truth.tpv.spec.ts \
    --config=playwright.config.truth.ts \
    --workers=$WORKERS \
    || exit 1
done

echo "✅ Stress concluído sem mentiras."
