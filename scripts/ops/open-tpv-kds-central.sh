#!/usr/bin/env bash
# Abre TPV central e KDS central no browser (merchant-portal).
# Uso: ./scripts/ops/open-tpv-kds-central.sh [base_url]
# Ex.: ./scripts/ops/open-tpv-kds-central.sh
#      ./scripts/ops/open-tpv-kds-central.sh http://localhost:5175

set -e
BASE="${1:-http://localhost:5175}"
TPV="${BASE}/op/tpv"
KDS="${BASE}/op/kds"

echo "TPV central: $TPV"
echo "KDS central: $KDS"

if command -v open >/dev/null 2>&1; then
  open "$TPV"
  open "$KDS"
  echo "Abriu TPV e KDS no browser."
else
  echo "Comando 'open' não encontrado. Abre manualmente:"
  echo "  $TPV"
  echo "  $KDS"
fi
