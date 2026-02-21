# Staff PWA Install Guide

> How staff install the ChefIApp Progressive Web App on their phones.

---

## Overview

Staff members (waiters, kitchen staff) install ChefIApp as a PWA on their
phones. The admin generates a provisioning QR code; the staff member scans
it with their phone camera and follows the install flow.

---

## Prerequisites

- Admin has a restaurant set up in ChefIApp
- Docker Core is running (PostgreSQL + PostgREST)
- Staff member has a phone with a camera and a modern browser (Chrome/Safari)

---

## Step-by-Step

### 1. Admin generates QR

1. Open **Admin → Sistema → Dispositivos** (`/admin/devices`)
2. Select type: **APPSTAFF** (for general staff) or **WAITER** (for table service)
3. Enter a name, e.g. "iPhone Ana"
4. Click **Gerar QR**
5. Show the QR code to the staff member (valid for 5 minutes)

### 2. Staff scans QR

1. Open the phone camera
2. Point at the QR code
3. Tap the link that appears → opens `/install?token=ABC123`

### 3. Automatic provisioning

The InstallPage:

- Calls `consume_device_install_token` RPC
- Validates the token (not expired, not already used)
- Creates a terminal record in `gm_terminals`
- Stores terminal identity locally on the phone

### 4. Add to Home Screen

After provisioning:

- **Android (Chrome):** A banner/button "Instalar no ecrã inicial" appears
- **iOS (Safari):** Tap Share → "Add to Home Screen"
- The app opens in standalone mode (no browser chrome)

### 5. Using the app

The staff member taps the home screen icon:

- Opens directly to `/app/staff/home`
- No login needed (terminal identity is stored locally)
- The app knows which restaurant this device belongs to

---

## Troubleshooting

| Problem                    | Solution                                                  |
| -------------------------- | --------------------------------------------------------- |
| QR expired                 | Admin generates a new one (they expire after 5 minutes)   |
| "Token inválido"           | The QR was already scanned by another device              |
| PWA install button missing | On iOS, use Safari → Share → Add to Home Screen           |
| App shows wrong restaurant | Clear browser data and re-scan a new QR                   |
| Device not in admin table  | Check Docker Core is running; try `/rest/v1/gm_terminals` |

---

## PWA Manifests

All three manifests are aligned with `start_url: "/"`:

1. `merchant-portal/vite.config.ts` — VitePWA plugin config
2. `merchant-portal/manifest.webmanifest` — static manifest
3. `merchant-portal/public/manifest.json` — fallback manifest

The service worker (Workbox) handles offline caching and navigation fallback.

---

## Related Documentation

- [Device Provisioning](./DEVICES_PROVISIONING.md) — Full technical details
- Admin page: `/admin/devices`
- Install page: `/install?token=xxx`
