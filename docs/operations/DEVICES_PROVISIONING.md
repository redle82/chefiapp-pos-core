# Device Provisioning — Operations Guide

> How terminals (TPV, KDS, AppStaff, Waiter) get linked to a restaurant
> via QR-based token provisioning.

---

## Architecture Overview

```
Admin (browser)                  Device (phone/tablet/desktop)
─────────────────                ──────────────────────────────
1. /admin/devices
   → Choose type + name
   → "Gerar QR"
   ↓
   create_device_install_token
   → returns 6-char token
   → QR shown on screen
                                 2. Scan QR → /install?token=ABC123
                                    ↓
                                    consume_device_install_token
                                    → validates token (expiry, not consumed)
                                    → creates gm_terminals row
                                    → marks token consumed
                                    → returns terminal data
                                 3. Persists terminal_id locally
                                 4. Redirects to app (/op/tpv, /op/kds, /app/staff/home)
```

---

## Database Tables

### `gm_terminals`

Stores registered terminal devices.

| Column            | Type        | Description                                        |
| ----------------- | ----------- | -------------------------------------------------- |
| id                | UUID (PK)   | Terminal identifier                                |
| restaurant_id     | UUID (FK)   | Links to restaurant                                |
| type              | TEXT        | TPV, KDS, APPSTAFF, WEB, WAITER, BACKOFFICE, ADMIN |
| name              | TEXT        | Human-friendly name (e.g. "TPV_BALCAO_01")         |
| registered_at     | TIMESTAMPTZ | When the terminal was first registered             |
| last_heartbeat_at | TIMESTAMPTZ | Last heartbeat received                            |
| last_seen_at      | TIMESTAMPTZ | Alias for last activity                            |
| status            | TEXT        | active, offline, revoked                           |
| metadata          | JSONB       | userAgent, screen size, etc.                       |

### `gm_device_install_tokens`

One-time tokens for QR-based provisioning.

| Column        | Type          | Description                                     |
| ------------- | ------------- | ----------------------------------------------- |
| id            | UUID (PK)     | Token record ID                                 |
| restaurant_id | UUID (FK)     | Target restaurant                               |
| token         | TEXT (UNIQUE) | 6-char alphanumeric code                        |
| device_type   | TEXT          | TPV, KDS, APPSTAFF, WAITER                      |
| device_name   | TEXT          | Assigned name for the terminal                  |
| expires_at    | TIMESTAMPTZ   | Default: now() + 5 minutes                      |
| consumed_at   | TIMESTAMPTZ   | NULL until consumed                             |
| terminal_id   | UUID (FK)     | Links to created gm_terminals after consumption |
| created_by    | UUID          | Admin user who generated the token              |

### `gm_device_heartbeats`

Heartbeat log for terminal health monitoring.

| Column       | Type        | Description            |
| ------------ | ----------- | ---------------------- |
| id           | UUID (PK)   | Heartbeat record ID    |
| terminal_id  | UUID (FK)   | Source terminal        |
| heartbeat_at | TIMESTAMPTZ | Timestamp of heartbeat |
| metadata     | JSONB       | Additional health data |

---

## RPCs (PostgREST)

### `create_device_install_token`

**Called by:** Admin panel (`/admin/devices`)

```sql
create_device_install_token(
  p_restaurant_id UUID,
  p_device_type   TEXT,    -- 'TPV' | 'KDS' | 'APPSTAFF' | 'WAITER'
  p_device_name   TEXT,    -- e.g. 'TPV_BALCAO_01'
  p_ttl_minutes   INT DEFAULT 5
) → JSONB { id, token, expires_at }
```

### `consume_device_install_token`

**Called by:** Device landing on `/install?token=xxx`

```sql
consume_device_install_token(
  p_token      TEXT,
  p_device_meta JSONB  -- { userAgent, screen, installedAt }
) → JSONB { terminal_id, restaurant_id, type, name }
```

Validates:

- Token exists and is not consumed
- Token has not expired
- Creates `gm_terminals` row
- Marks token as consumed (sets `consumed_at`, links `terminal_id`)

### `device_heartbeat`

**Called by:** Running device (periodic, every 60s)

```sql
device_heartbeat(
  p_terminal_id UUID,
  p_meta        JSONB DEFAULT '{}'
) → VOID
```

Updates `gm_terminals.last_heartbeat_at` and logs to `gm_device_heartbeats`.

### `revoke_terminal`

**Called by:** Admin panel (revoke button)

```sql
revoke_terminal(p_terminal_id UUID) → VOID
```

Sets `gm_terminals.status = 'revoked'`.

---

## Admin Workflow

1. Navigate to **Admin → Sistema → Dispositivos**
2. Select device type (APPSTAFF, TPV, KDS, WAITER)
3. Enter a descriptive name (e.g. "iPad Cozinha")
4. Click **"Gerar QR"**
5. A QR code appears with a 5-minute countdown
6. Device scans the QR → automatic provisioning
7. Device appears in the **Active Devices** table
8. Admin can **Revoke** any device from the same page

---

## Device Workflow

1. Staff member opens camera app on phone/tablet
2. Scans QR code displayed on admin screen
3. Browser opens `/install?token=ABC123`
4. InstallPage consumes the token automatically
5. On success:
   - Terminal ID + restaurant ID stored locally
   - "Add to Home Screen" prompt offered (PWA)
   - "Open App" button redirects to appropriate view
6. On error:
   - Token expired → ask admin for new QR
   - Token invalid → verify QR code

---

## Local Storage Keys

After successful provisioning, the device stores:

| Key                      | Value                   | Purpose                      |
| ------------------------ | ----------------------- | ---------------------------- |
| `chefiapp_terminal_id`   | UUID                    | Identifies this terminal     |
| `chefiapp_restaurant_id` | UUID                    | Identifies the restaurant    |
| `chefiapp_terminal_type` | TPV/KDS/APPSTAFF/WAITER | Determines which app opens   |
| `chefiapp_terminal_name` | String                  | Human label for the terminal |

---

## Migration File

`docker-core/schema/migrations/20260303_device_install_tokens.sql`

Applied automatically when Docker Core starts. Contains the table DDL, all 4 RPCs, and GRANT statements.

---

## Files

| File                                                               | Purpose                                              |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| `merchant-portal/src/features/admin/devices/AdminDevicesPage.tsx`  | Admin page: QR generation + device table + downloads |
| `merchant-portal/src/features/admin/devices/api/devicesApi.ts`     | TypeScript API layer (types + functions)             |
| `merchant-portal/src/pages/InstallPage.tsx`                        | Device-side: consumes token, persists identity       |
| `merchant-portal/src/pages/InstallPage.module.css`                 | Styles for InstallPage                               |
| `docker-core/schema/migrations/20260303_device_install_tokens.sql` | DB migration                                         |
