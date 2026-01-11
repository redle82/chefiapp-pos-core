# ChefIApp Adapter Specification
**Function:** `sendPulse()`
**Frequency:** Every 10 minutes

## Overview
This adapter is responsible for emitting the vital signs of the ChefIApp instance to the shared reality (Database), allowing the GoldMonkey Empire Dashboard to observe it without coupling.

## The Contract
The pulse must adhere to the schema defined in `docs/EMPIRE_ADAPTER_PROTOCOL.md`.

```typescript
// payload structure
{
  system: "chefiapp-merchant-portal",
  status: "healthy", // or "degraded"
  vitality: {
    active_pilot: "Sofia Gastrobar",
    menu_items: <count>,
    orders_today: <count>,
    revenue_today: <calculated>
  },
  timestamp: <ISO string>
}
```

## Implementation Details
1.  **Location:** `src/core/adapter/empire-pulse.ts`
2.  **Trigger:** Client-side interval (since this is a SPA).
3.  **Destination:** Supabase Table `system_pulses` (or `rpc/send_pulse`).

> Note: In Phase K, if the app is closed, no pulse is sent. This is correct behavior: if the portal is closed, "business operations" are effectively offline/unmonitored from this specific viewpoint.
