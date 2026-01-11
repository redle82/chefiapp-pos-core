# Empire-Adapter Protocol: ChefIApp
**Role:** Sovereign Observer
**Contract:** Observable State Only (No Direct Control)

## The Contract (JSON Schema)
This is the ONLY data that ChefIApp is allowed to "emit" to the Empire Dashboard.
It must never expose internal logic, only consolidated state.

```typescript
type EmpireSignal = {
  // Who am I?
  system: "chefiapp-merchant-portal";
  deployment: "production-pilot-k"; // Phase K

  // Am I alive?
  heartbeat: string; // ISO Timestamp
  status: "healthy" | "degraded" | "down" | "maintenance";
  
  // What is my reality?
  vitality: {
    active_pilot: string; // "Sofia Gastrobar"
    menu_items: number;   // 1
    orders_today: number; // 0
    revenue_today: number; // 0.00
  };

  // Am I in danger?
  risk: {
    level: "low" | "medium" | "high";
    active_alerts: number;
  };
};
```

## Implementation Strategy (Phase K)
Since we are accepting the Monolith for now, the "Adapter" will be virtual.

1.  **Dashboard Side:** Reads `PILOT_FEEDBACK_LOG.md` (Human Signal) + `supabase.rows` (Data Signal).
2.  **ChefIApp Side:** Focuses only on generating the rows.
3.  **No Direct API:** We do not build an API for this yet to avoid premature coupling.

> "The Empire watches the Database. The Database captures the Reality."
