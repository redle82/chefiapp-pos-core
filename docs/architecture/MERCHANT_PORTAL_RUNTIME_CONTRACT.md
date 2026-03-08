# Merchant Portal Runtime Contract (The Cockpit)

## Summary

The **Merchant Portal** is the operational nerve center (Cockpit). It must operate in strict synchronization with the **Docker Core** backend services. This contract defines the canonical ports, environment variables, and boot procedures.

---

## 1. Canonical Topology

| Service       | Host        | Port    | Protocol                        | Description                                                   |
| ------------- | ----------- | ------- | ------------------------------- | ------------------------------------------------------------- |
| **Core API**  | `localhost` | `3001`  | PostgREST (Supabase compatible) | Main data entry point for restaurants, orders, and registers. |
| **Realtime**  | `localhost` | `4000`  | WebSockets (Supabase Realtime)  | Sync for TPV/KDS events.                                      |
| **Portal UI** | `localhost` | `5157`  | Vite/React                      | Merchant Portal interface (porta oficial; não mudar).         |
| **Core DB**   | `localhost` | `54320` | PostgreSQL                      | Physical persistence layer.                                   |

---

## 2. Mandatory Environment Variables (Portal)

All variables must be defined in `merchant-portal/.env`.

```env
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long
VITE_API_BASE=http://localhost:4320 # (Optional: Control Plane)
```

---

## 3. Boot Protocol (The Single Command)

To ensure consistency, the development environment should be started using the `chef` utility (or root `package.json` scripts).

### 3.1. Manual Boot Sequence

1. Start Docker Desktop.
2. `docker compose -f docker-core/docker-compose.core.yml up -d`
3. `cd merchant-portal && npm run dev`

---

## 4. Operational Health Check

The Portal is considered healthy only if:

1. `localhost:5157` returns the login/onboarding screen.
2. The browser console shows `Runtime Mode: DEMO` or `Runtime Mode: PRODUCTION`.
3. Calls to `localhost:3001/rest/v1/gm_restaurants` return `200 OK`.

---

## 5. Status

**FINALIZED** — 2026-01-31.
Compliance is mandatory for all architectural changes.
