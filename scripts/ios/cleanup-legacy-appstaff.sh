#!/usr/bin/env bash
# Limpa qualquer instalação anterior do AppStaff legado no simulador iOS.
# Não mexe no código nem no app oficial; apenas remove binários já instalados.
#
# Uso:
#   bash scripts/ios/cleanup-legacy-appstaff.sh
#
# O script é idempotente: tentar desinstalar um bundle inexistente não falha o processo.

set -euo pipefail

BUNDLE_ID="com.goldmonkey.chefiapp"

echo "==> A detectar simulador iOS 'booted'…"
BOOTED_DEVICE=$(xcrun simctl list devices booted | awk -F'[()]' '/Booted/{print $2}' || true)

if [ -z "${BOOTED_DEVICE}" ]; then
  echo "Nenhum simulador iOS está arrancado (Booted)."
  echo "Abre o Simulator (ou corre um build) e volta a executar o script."
  exit 0
fi

echo "Simulador ativo: ${BOOTED_DEVICE}"

echo "==> A tentar desinstalar bundle legado '${BUNDLE_ID}' do simulador booted…"
if xcrun simctl uninstall booted "${BUNDLE_ID}" >/dev/null 2>&1; then
  echo "Bundle '${BUNDLE_ID}' desinstalado (se existia)."
else
  echo "Bundle '${BUNDLE_ID}' não estava instalado ou já tinha sido removido."
fi

echo "==> Listando apps restantes com 'chefiapp' no nome (apenas para verificação)…"
if xcrun simctl listapps booted 2>/dev/null | grep -i chefiapp || true; then
  :
else
  echo "Nenhum app com 'chefiapp' encontrado no simulador booted."
fi

echo "Limpeza concluída."

