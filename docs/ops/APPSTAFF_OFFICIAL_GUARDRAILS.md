# AppStaff Official Guardrails

## Product truth

- Official AppStaff baseline is web/PWA at `/app/staff/*`.
- Provisioning source-of-truth is Admin QR/token (`/install?token=...`) and web install flow.
- Mobile app may exist as controlled evolution, but must not redefine the official operational surface.

## Executable checklist

Run:

`bash scripts/audit/check-appstaff-official.sh`

This verifies:

1. Admin QR + token creation/consumption code-paths are present.
2. Canonical `/app/staff/*` route wiring is present.
3. Install token consumer redirects to AppStaff route.
4. Mobile identity keys (`bundleIdentifier`, `package`, `scheme`) are explicit.
5. Legacy fingerprint scan returns empty.
6. Runtime package/focus checks for Android and iOS (when available).

## Runtime commands (manual)

Android:

- `adb shell pm list packages | rg -ni "chefi|gold|monkey|staff|pos"`
- `adb shell dumpsys activity activities | rg -n "topResumedActivity|mCurrentFocus|chefiapp" | head -n 40`

iOS:

- `xcrun simctl listapps booted | rg -ni "chefi|gold|monkey|staff|pos"`
