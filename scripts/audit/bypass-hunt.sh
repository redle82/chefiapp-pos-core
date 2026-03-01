#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ALLOWLIST_FILE="${ROOT_DIR}/scripts/audit/bypass-allowlist.txt"
MODE="report"
CHECK="all"
BASELINE_FILE="${ROOT_DIR}/docs/audit/bypass-baseline.json"
WRITE_BASELINE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --check)
      CHECK="$2"
      shift 2
      ;;
    --baseline)
      BASELINE_FILE="$2"
      shift 2
      ;;
    --write-baseline)
      WRITE_BASELINE="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

TMP_OUT="$(mktemp)"
trap 'rm -f "$TMP_OUT"' EXIT

echo "# Bypass Hunt Report"
echo "mode: ${MODE}"
echo "check: ${CHECK}"
echo "root: ${ROOT_DIR}"
echo

run_rg() {
  local title="$1"
  local cmd="$2"

  echo "## ${title}" | tee -a "$TMP_OUT"
  eval "$cmd" | tee -a "$TMP_OUT" || true
  echo | tee -a "$TMP_OUT"
}

COMMON_EXCLUDES=(
  --glob '!**/*.test.ts'
  --glob '!**/*.test.tsx'
  --glob '!**/*.spec.ts'
  --glob '!**/*.spec.tsx'
  --glob '!**/*.d.ts'
  --glob '!**/tests/**'
  --glob '!**/__tests__/**'
)

RG_EXCLUDES="${COMMON_EXCLUDES[*]}"

if [[ "$CHECK" == "all" || "$CHECK" == "marketing" ]]; then
  run_rg \
    "Marketing importing core boot/runtime" \
    "cd \"$ROOT_DIR\" && rg --no-ignore -n --no-heading ${RG_EXCLUDES} --glob 'merchant-portal/src/{main-marketing.tsx,routes/MarketingRoutes.tsx}' 'from\\s+[\"\'\''][^\"\'\'']*core/(boot|runtime)/'"
fi

if [[ "$CHECK" == "all" || "$CHECK" == "boot" ]]; then
  run_rg \
    "Boot importing UI/surfaces" \
    "cd \"$ROOT_DIR\" && rg --no-ignore -n --no-heading ${RG_EXCLUDES} --glob 'merchant-portal/src/core/boot/**/*.{ts,tsx}' 'from\\s+[\"\'\''][^\"\'\'']*(/pages/|/features/|/components/|/ui/)'"
fi

if [[ "$CHECK" == "all" || "$CHECK" == "surfaces" ]]; then
  run_rg \
    "Surfaces importing boot internals" \
    "cd \"$ROOT_DIR\" && rg --no-ignore -n --no-heading ${RG_EXCLUDES} --glob 'merchant-portal/src/{pages,features,routes}/**/*.{ts,tsx}' 'from\\s+[\"\'\''][^\"\'\'']*core/boot/'"

  run_rg \
    "Billing logic outside kernel authority" \
    "cd \"$ROOT_DIR\" && rg --no-ignore -n --no-heading ${RG_EXCLUDES} --glob 'merchant-portal/src/**/*.{ts,tsx}' --glob '!merchant-portal/src/core/{boot,flow,lifecycle,billing,readiness}/**' --glob '!merchant-portal/src/ui/billing/**' --glob '!merchant-portal/src/context/GlobalUIStateContext.tsx' --glob '!merchant-portal/src/infra/readers/RuntimeReader.ts' '(billingStatus\\s*===|subscription\\.status\\s*===|hasValidSubscription\\(|getRestaurantStatus\\(|BILLING_(PAST_DUE|SUSPENDED))'"

  run_rg \
    "Tenant resolution outside kernel/runtime" \
    "cd \"$ROOT_DIR\" && rg --no-ignore -n --no-heading ${RG_EXCLUDES} --glob 'merchant-portal/src/**/*.{ts,tsx}' --glob '!merchant-portal/src/core/{boot,runtime,tenant,identity}/**' --glob '!merchant-portal/src/infra/readers/RuntimeReader.ts' --glob '!merchant-portal/src/context/RestaurantRuntimeContext.tsx' '(core/tenant/TenantResolver|getActiveTenant\\(|setActiveTenant\\(|clearActiveTenant\\(|isTenantSealed\\(|getTabIsolated\\(\"chefiapp_restaurant_id\"|localStorage\\.getItem\\(\"chefiapp_restaurant_id\")'"
fi

if [[ "$CHECK" == "all" || "$CHECK" == "boot-chain" ]]; then
  run_rg \
    "resolveNextRoute imported outside allowed chain" \
    "cd \"$ROOT_DIR\" && rg --no-ignore -n --no-heading ${RG_EXCLUDES} --glob 'merchant-portal/src/**/*.{ts,tsx}' 'import\\s*\\{[^}]*resolveNextRoute[^}]*\\}\\s*from\\s*[\"\'\''][^\"\'\'']*core/flow/CoreFlow[\"\'\'']' | rg -v 'merchant-portal/src/core/(boot/resolveBootDestination\\.ts|navigation/routeGuards\\.ts)'"
fi

FILTERED="$(mktemp)"
trap 'rm -f "$TMP_OUT" "$FILTERED"' EXIT

cp "$TMP_OUT" "$FILTERED"
if [[ -f "$ALLOWLIST_FILE" ]]; then
  while IFS= read -r pattern; do
    [[ -z "$pattern" || "$pattern" =~ ^# ]] && continue
    grep -Ev "$pattern" "$FILTERED" > "${FILTERED}.tmp" || true
    mv "${FILTERED}.tmp" "$FILTERED"
  done < "$ALLOWLIST_FILE"
fi

findings_count=$(grep -E 'merchant-portal/' "$FILTERED" | wc -l | tr -d ' ')
findings_file="$(mktemp)"
trap 'rm -f "$TMP_OUT" "$FILTERED" "$findings_file"' EXIT
grep -E 'merchant-portal/' "$FILTERED" > "$findings_file" || true

echo "findings: ${findings_count}"
if [[ "$findings_count" -gt 0 ]]; then
  echo
  echo "# Filtered Findings"
  cat "$findings_file"
fi

if [[ "$WRITE_BASELINE" == "true" ]]; then
  mkdir -p "$(dirname "$BASELINE_FILE")"
  if [[ "$findings_count" -gt 0 ]]; then
    jq -R -s '{generatedAt: now | todate, findings: (split("\n") | map(select(length > 0)))}' "$findings_file" > "$BASELINE_FILE"
  else
    printf '{"generatedAt":"%s","findings":[]}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$BASELINE_FILE"
  fi
  echo "baseline_written: ${BASELINE_FILE}"
fi

if [[ "$MODE" == "fail-on-new" ]]; then
  if [[ ! -f "$BASELINE_FILE" ]]; then
    echo "Missing baseline file: $BASELINE_FILE"
    exit 3
  fi

  new_findings_count=0
  if [[ "$findings_count" -gt 0 ]]; then
    while IFS= read -r finding; do
      [[ -z "$finding" ]] && continue
      if ! jq -e --arg line "$finding" '.findings | index($line)' "$BASELINE_FILE" >/dev/null; then
        echo "NEW: $finding"
        new_findings_count=$((new_findings_count + 1))
      fi
    done < "$findings_file"
  fi

  echo "new_findings: ${new_findings_count}"
  if [[ "$new_findings_count" -gt 0 ]]; then
    echo "Bypass hunt failed on new findings."
    exit 4
  fi
fi

if [[ "$MODE" == "fail-on-findings" && "$findings_count" -gt 0 ]]; then
  echo "Bypass hunt failed: ${findings_count} finding(s)."
  exit 2
fi

echo "Bypass hunt completed."
