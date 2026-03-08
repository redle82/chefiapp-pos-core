#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATE_TAG="$(date +%Y-%m-%d)"
TIME_TAG="$(date +%H%M%S)"
OUT_DIR="$ROOT_DIR/docs/audit/runs"
OUT_FILE="$OUT_DIR/fragmentation-cycle-${DATE_TAG}-${TIME_TAG}.md"

CORE_URL="${CORE_URL:-http://localhost:3001}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
RUN_RUNTIME_EVIDENCE="${RUN_RUNTIME_EVIDENCE:-1}"
STRICT_RUNTIME_EVIDENCE="${STRICT_RUNTIME_EVIDENCE:-0}"

health_status="not-run"
gateway_health_status="not-run"
webhook_smoke_status="not-run"
health_output=""
gateway_health_output=""
webhook_output=""
runtime_notes=()

mkdir -p "$OUT_DIR"

if [[ "$RUN_RUNTIME_EVIDENCE" == "1" ]]; then
	# 1) Core health check evidence
	set +e
	health_output="$(bash "$ROOT_DIR/scripts/core/health-check-core.sh" 2>&1)"
	health_rc=$?
	set -e
	if [[ $health_rc -eq 0 ]]; then
		health_status="pass"
	else
		health_status="fail"
		runtime_notes+=("Core health check failed (CORE_URL=${CORE_URL}).")
	fi

	# 2) Gateway health evidence
	set +e
	gateway_health_output="$(curl -sS "${GATEWAY_URL}/health" 2>&1)"
	gateway_health_rc=$?
	set -e
	if [[ $gateway_health_rc -eq 0 ]]; then
		gateway_health_status="pass"
	else
		gateway_health_status="unavailable"
		runtime_notes+=("Gateway health endpoint unavailable at \`${GATEWAY_URL}/health\`.")
	fi

	# 3) Webhook smoke evidence (SumUp endpoint)
	if [[ "$gateway_health_status" == "pass" ]]; then
		smoke_payment_id="cycle-${DATE_TAG}-${TIME_TAG}"
		smoke_payload="{\"paymentId\":\"${smoke_payment_id}\",\"status\":\"COMPLETED\",\"amount\":1500,\"orderRef\":\"cycle-smoke\"}"

		set +e
		webhook_output="$(curl -sS -X POST "${GATEWAY_URL}/api/v1/webhook/sumup" -H "Content-Type: application/json" -d "$smoke_payload" 2>&1)"
		webhook_rc=$?
		set -e

		if [[ $webhook_rc -ne 0 ]]; then
			webhook_smoke_status="fail"
			runtime_notes+=("Webhook smoke call failed at ${GATEWAY_URL}/api/v1/webhook/sumup.")
		elif echo "$webhook_output" | grep -Eq '"(received|success)"[[:space:]]*:[[:space:]]*true'; then
			webhook_smoke_status="pass"
		else
			webhook_smoke_status="warn"
			runtime_notes+=("Webhook smoke returned non-success payload; review response snippet.")
		fi
	else
		webhook_smoke_status="skipped"
		runtime_notes+=("Webhook smoke skipped because gateway health is not available.")
	fi
else
	runtime_notes+=("Runtime evidence collection disabled (RUN_RUNTIME_EVIDENCE=0).")
fi

runtime_notes_md="- none"
if (( ${#runtime_notes[@]} > 0 )); then
	runtime_notes_md=""
	for note in "${runtime_notes[@]}"; do
		runtime_notes_md+="- ${note}"$'\n'
	done
fi

checkmark() {
	if [[ "$1" == "1" ]]; then
		echo "[x]"
	else
		echo "[ ]"
	fi
}

handlers_done="0"
billing_done="0"
desktop_mobile_done="0"
fiscal_done="0"
audit_doc_done="0"
periodic_automation_done="0"
communication_tracker_done="0"
boundary_validation_done="0"

if [[ -f "$ROOT_DIR/server/integration-gateway.ts" ]] && grep -q "INTEGRATION_RUNTIME_AUTHORITY" "$ROOT_DIR/server/integration-gateway.ts"; then
	handlers_done="1"
fi

if [[ -f "$ROOT_DIR/core-engine/billing/types.ts" ]]; then
	billing_done="1"
fi

if [[ -f "$ROOT_DIR/desktop-app/src/main.ts" && -f "$ROOT_DIR/mobile-app/context/AppStaffContext.tsx" ]]; then
	desktop_mobile_done="1"
fi

if [[ -f "$ROOT_DIR/fiscal-modules/types.ts" && -f "$ROOT_DIR/fiscal-modules/FiscalObserver.ts" ]]; then
	fiscal_done="1"
fi

if [[ -f "$ROOT_DIR/docs/audit/AUDITORIA_FRAGMENTACAO_SISTEMICA.md" ]]; then
	audit_doc_done="1"
fi

if [[ -f "$ROOT_DIR/.github/workflows/fragmentation-audit-cycle.yml" ]]; then
	periodic_automation_done="1"
fi

if [[ -f "$ROOT_DIR/docs/audit/FRAGMENTATION_EXEC_COMMUNICATION_2026-03-07.md" && -f "$ROOT_DIR/docs/audit/PROGRESS_REPORT.md" ]]; then
	communication_tracker_done="1"
fi

if [[ "$health_status" == "pass" ]]; then
	boundary_validation_done="1"
fi

front_handlers="$(checkmark "$handlers_done")"
front_billing="$(checkmark "$billing_done")"
front_desktop_mobile="$(checkmark "$desktop_mobile_done")"
front_fiscal="$(checkmark "$fiscal_done")"
front_audit_doc="$(checkmark "$audit_doc_done")"
front_periodic="$(checkmark "$periodic_automation_done")"
front_communication="$(checkmark "$communication_tracker_done")"
front_boundary="$(checkmark "$boundary_validation_done")"

cat > "$OUT_FILE" <<EOF
# Fragmentation Cycle Snapshot

Date: ${DATE_TAG}
Time: ${TIME_TAG}
Source of truth: docs/audit/AUDITORIA_FRAGMENTACAO_SISTEMICA.md

## Status by Front

- ${front_handlers} Handlers and aliases
- ${front_billing} Billing contracts and types
- ${front_desktop_mobile} Desktop and mobile context isolation
- ${front_fiscal} Fiscal modules isolation
- ${front_audit_doc} Audit document update
- ${front_periodic} Periodic audit automation
- ${front_communication} Communication and tracker update
- ${front_boundary} Boundary validation and monitoring

## Evidence Links

- server/integration-gateway.ts
- core-engine/billing/types.ts
- desktop-app/src/main.ts
- mobile-app/context/AppStaffContext.tsx
- fiscal-modules/types.ts
- fiscal-modules/FiscalObserver.ts

## Runtime Evidence

- Core health: ${health_status}
- Gateway health: ${gateway_health_status}
- Webhook smoke (POST /api/v1/webhook/sumup): ${webhook_smoke_status}

### Runtime Evidence Output

#### Core health output

\`\`\`
${health_output}
\`\`\`

#### Gateway health output

\`\`\`
${gateway_health_output}
\`\`\`

#### Webhook smoke output

\`\`\`
${webhook_output}
\`\`\`

### Runtime notes

${runtime_notes_md}

## Risks found this cycle

- None registered.

## Actions for next cycle

1.
2.
3.
EOF

if [[ "$STRICT_RUNTIME_EVIDENCE" == "1" ]]; then
	if [[ "$health_status" != "pass" || "$gateway_health_status" != "pass" || "$webhook_smoke_status" != "pass" ]]; then
		echo "Runtime evidence strict mode failed. Snapshot: $OUT_FILE"
		exit 1
	fi
fi

echo "Created: $OUT_FILE"
