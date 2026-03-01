#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LEDGER_FILE="${ROOT_DIR}/docs/audit/AUDITORIA_SUPREMA_CONTRADICTIONS_LEDGER.md"

if [[ ! -f "$LEDGER_FILE" ]]; then
	echo "Missing ledger file: $LEDGER_FILE"
	exit 3
fi

OPEN_HIGH_LINES="$({
	awk -F'|' '
		function trim(s) {
			gsub(/^[ \t]+|[ \t]+$/, "", s)
			return s
		}

		/^\| L-[0-9]+/ {
			id = trim($2)
			severity = trim($5)
			status = trim($10)
			if (severity == "High" && status != "RESOLVED" && status != "WAIVED") {
				print id "|" status
			}
		}
	' "$LEDGER_FILE"
} || true)"

COUNT=0
if [[ -n "$OPEN_HIGH_LINES" ]]; then
	COUNT=$(printf "%s\n" "$OPEN_HIGH_LINES" | grep -c '^' || true)
fi

echo "high_open_count: ${COUNT}"

if [[ "$COUNT" -gt 0 ]]; then
	echo "Open High contradictions detected:"
	printf '%s\n' "$OPEN_HIGH_LINES" | while IFS='|' read -r item_id item_status; do
		echo "- ${item_id} (status=${item_status})"
	done
	echo "Release gate blocked: resolve or waive all High items first."
	exit 2
fi

echo "No open High contradictions."
