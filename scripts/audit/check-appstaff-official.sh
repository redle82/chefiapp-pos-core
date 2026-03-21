#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[A] Baseline Admin->QR->Token->Install checks"
rg -n "InstallQRPanel|create_device_install_token|consume_device_install_token|createDeviceInstallToken|consumeInstallToken" merchant-portal/src
rg -n "path=\"/app/staff|/app/staff/|AppStaffWrapper|StaffModule" merchant-portal/src
rg -n "searchParams|get\('token'\)|/install\?token=|consumeInstallToken" merchant-portal/src/pages/InstallPage.tsx

echo
echo "[A.1] Canonical surface checks (must exist)"
rg -n "path=\"/app/staff/\*\"|path=\"/app/staff\"" merchant-portal/src/routes
rg -n "path=\"/install\"|path=\"/app/install\"" merchant-portal/src/routes
rg -n "path=\"/install\"|path=\"/app/install\"" merchant-portal/src/routes | rg -n "AppStaff|/app/staff|InstallPage|Navigate"

echo

echo "[B] Mobile surface + identity"
rg -n "appstaff-web|WebView|/app/staff" mobile-app/app
rg -n '"bundleIdentifier"|"package"|"scheme"' mobile-app/app.json

echo
echo "[B.1] Identity allowlist checks (official package only)"
rg -n '"bundleIdentifier"\s*:\s*"com\.goldmonkey\.chefiapp"' mobile-app/app.json
rg -n '"package"\s*:\s*"com\.goldmonkey\.chefiapp"' mobile-app/app.json
rg -n '"scheme"\s*:\s*\[[^]]*"chefiapp"' mobile-app/app.json

echo
echo "[B.2] Identity deny checks (must be empty)"
if rg -n --no-ignore "com\.chefiapp\.app|com\.chefiapp\.pos|com\.chefiapp\.|com\.goldmonkey\.pos" mobile-app merchant-portal docs scripts package.json; then
  echo "[FAIL] Legacy or non-official package identity detected"
  exit 1
fi

echo

echo "[C] Anti-legacy guard (must be empty)"
if rg -n --no-ignore \
  -g '!scripts/audit/check-appstaff-official.sh' \
  "com\.chefiapp\.app|com\.chefiapp\.pos|appstaff[-_]?legacy|appstaff antigo|old appstaff|legacy appstaff|appstaff-v0|chefiapp_old|pages/AppStaff/legacy|AppStaff\.legacy" \
  merchant-portal mobile-app docs scripts package.json; then
  echo "[FAIL] Legacy AppStaff vestige detected"
  exit 1
fi

echo "[PASS] No legacy AppStaff vestige found"

echo

echo "[D] Runtime duplication checks"
if command -v adb >/dev/null 2>&1; then
  adb shell pm list packages | rg -ni "chefi|gold|monkey|staff|pos" || true
  adb shell dumpsys activity activities | rg -n "topResumedActivity|mCurrentFocus|chefiapp" | head -n 40 || true
else
  echo "adb not found - skipping Android runtime checks"
fi

if command -v xcrun >/dev/null 2>&1; then
  xcrun simctl listapps booted | rg -ni "chefi|gold|monkey|staff|pos" || true
else
  echo "xcrun not found - skipping iOS runtime checks"
fi
