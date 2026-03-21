# Activation Intelligence v3 — Batch Job Design

**Propósito:** Persistir snapshots diários de activation por restaurante. Base para MoM, cohorts, early warning. Idempotente por `(restaurant_id, period_date)`.

**Referências:** [Activation Intelligence v3 Blueprint](#), `gm_activation_snapshots`, `activation_upsert_snapshot` RPC.

---

## 1. Fluxo Técnico

```
Cron / Edge Function (1x/dia)
        │
        ▼
GET restaurants com trial ativo (ou todos que tenham eventos)
        │
        ▼
Para cada restaurant:
  │  fetch eventos comerciais do período
  │  computeActivationMetrics(events)  ← server/activationMetrics.ts
  │  derivar: activation_velocity, org_classification, dropoff_step
  │  activation_upsert_snapshot(restaurant_id, period_date, ...)
        │
        ▼
Fim
```

**Motor único:** `computeActivationMetrics` (server/activationMetrics.ts). Chamado por Debug, Endpoint, Batch Job.

---

## 2. Input / Output do Job

### Input
- `period_date`: DATE — dia de referência (hoje ou backfill)
- Fonte de eventos: 
  - **Opção A:** Buffer persistido (tabela `gm_commercial_events` — futura)
  - **Opção B:** Query agregada via Supabase (se eventos forem guardados)
  - **Opção C:** POST a serviço externo (PostHog/GA4) que retorna eventos — batch chama API

### Output
- N linhas em `gm_activation_snapshots` (1 por restaurant com trial/eventos no período)
- Idempotente: UPSERT por `(restaurant_id, period_date)`

---

## 3. Pseudocódigo Exato

```typescript
// activationSnapshotBatch.ts (Edge Function ou Node script)

import { computeActivationMetrics } from "./server/activationMetrics";
import { supabase } from "./supabaseClient"; // service_role

type ActivationEvent = {
  event: string;
  restaurant_id?: string;
  timestamp?: string;
  amount_cents?: number;
};

async function runActivationSnapshotJob(periodDate: string): Promise<void> {
  const period = new Date(periodDate); // YYYY-MM-DD

  // 1. Restaurants ativos (trial ou com eventos no período)
  const { data: restaurants } = await supabase
    .from("gm_restaurants")
    .select("id")
    .in("billing_status", ["trial", "active"])
    .or("created_at.gte." + period.toISOString() + ",updated_at.gte." + period.toISOString());

  if (!restaurants?.length) return;

  // 2. Para cada restaurant: buscar eventos do período
  for (const r of restaurants) {
    const events = await fetchEventsForRestaurant(r.id, period);
    if (events.length === 0) continue;

    const metrics = computeActivationMetrics(events);

    // 3. Encontrar score deste restaurant (pode haver vários; pegar o mais alto)
    const scoreForRestaurant = metrics.activationScores.find(
      (s) => s.restaurantId === r.id
    );
    if (!scoreForRestaurant) continue;

    // 4. Derivar velocity (0–100) e classification
    const timeToFirstOrderHours = metrics.timeToFirstOrderHoursMedian;
    const velocity = deriveVelocity(timeToFirstOrderHours);
    const classification = deriveClassification(
      timeToFirstOrderHours,
      scoreForRestaurant.score,
      metrics.aggregates.dropoffByStep
    );
    const dropoffStep = deriveDropoffStep(metrics.aggregates.dropoffByStep);

    // 5. Upsert
    await supabase.rpc("activation_upsert_snapshot", {
      p_restaurant_id: r.id,
      p_period_date: periodDate,
      p_score_raw: scoreForRestaurant.score,
      p_score_normalized: scoreForRestaurant.scoreNormalized,
      p_activation_velocity: velocity,
      p_dropoff_step: dropoffStep,
      p_org_classification: classification,
      p_trial_starts: metrics.trialStarts,
      p_first_orders: metrics.firstOrders,
      p_first_payments: metrics.firstPayments,
    });
  }
}

function deriveVelocity(timeToFirstOrderHours: number): number {
  if (timeToFirstOrderHours <= 0) return 0;
  // Mais rápido = maior velocity. 0h → 100, 50h → 0
  const v = Math.max(0, 100 - timeToFirstOrderHours * 2);
  return Math.round(v);
}

function deriveClassification(
  timeHours: number,
  score: number,
  dropoff: { noMenu: number; noShift: number; noOrder: number; noPayment: number }
): "fast" | "slow" | "stalled" {
  if (score >= 15) return "fast"; // fully activated
  if (timeHours > 72 || Object.values(dropoff).some((d) => d > 0)) return "stalled";
  if (timeHours <= 24) return "fast";
  return "slow";
}

function deriveDropoffStep(dropoff: {
  noMenu: number;
  noShift: number;
  noOrder: number;
  noPayment: number;
}): string | null {
  if (dropoff.noMenu > 0) return "no_menu";
  if (dropoff.noShift > 0) return "no_shift";
  if (dropoff.noOrder > 0) return "no_order";
  if (dropoff.noPayment > 0) return "no_payment";
  return null;
}

async function fetchEventsForRestaurant(
  restaurantId: string,
  period: Date
): Promise<ActivationEvent[]> {
  const periodStr = period.toISOString().slice(0, 10);
  const nextStr = addDays(period, 1).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("gm_commercial_events")
    .select("event_type as event, restaurant_id, occurred_at as timestamp, payload_json")
    .eq("restaurant_id", restaurantId)
    .gte("period_date", periodStr)
    .lt("period_date", nextStr);
  return (data ?? []).map((row) => ({
    event: row.event_type,
    restaurant_id: row.restaurant_id,
    timestamp: row.occurred_at,
    amount_cents: row.payload_json?.amount_cents,
  }));
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
```

---

## 4. Fonte de Eventos — implementado

O batch lê de `gm_commercial_events`.

**Fluxo implementado:**
- Frontend: `CommercialTrackingService.track()` → `persistCommercialEvent()` (best-effort)
- Endpoint: `POST /internal/commercial/event` → insert em `gm_commercial_events`
- Batch: `SELECT * FROM gm_commercial_events WHERE restaurant_id = ? AND period_date <= ?`

---

## 5. Cron / Schedule

- **Frequência:** 1x por dia (ex.: 02:00 UTC)
- **Period date:** dia anterior (D-1)
- **Implementação:** Supabase Edge Function + cron, ou Render cron job, ou GitHub Actions

---

## 6. Queries Desbloqueadas (após snapshots)

### MoM — média de score por período
```sql
SELECT
  period_date,
  AVG(score_normalized) AS avg_score,
  COUNT(*) AS restaurant_count
FROM gm_activation_snapshots
GROUP BY period_date
ORDER BY period_date;
```

### Cohort — trial_start → score aos 30 dias
```sql
-- Requer trial_start_date por restaurant (gm_restaurants ou tabela derivada)
SELECT
  date_trunc('month', r.created_at)::date AS cohort_month,
  AVG(s.score_normalized) AS avg_score_30d
FROM gm_restaurants r
JOIN gm_activation_snapshots s
  ON s.restaurant_id = r.id
  AND s.period_date = r.created_at::date + 30
GROUP BY 1;
```

### Early Warning — score caiu >20% vs 7 dias atrás
```sql
WITH current_scores AS (
  SELECT restaurant_id, score_normalized, period_date
  FROM gm_activation_snapshots
  WHERE period_date = CURRENT_DATE - 1
),
prev_scores AS (
  SELECT restaurant_id, score_normalized, period_date
  FROM gm_activation_snapshots
  WHERE period_date = CURRENT_DATE - 8
)
SELECT c.restaurant_id
FROM current_scores c
JOIN prev_scores p ON p.restaurant_id = c.restaurant_id
WHERE c.score_normalized < p.score_normalized * 0.8
  AND p.score_normalized > 0;
```

---

## 7. Idempotência

- **UPSERT** por `(restaurant_id, period_date)` via `activation_upsert_snapshot`
- Rodar job manualmente ou reprocessar D-1 não duplica linhas
- Backfill: chamar job com `period_date` históricos

---

## 8. Fase Seguinte (v3.1 — não agora)

- `activation_trend_score` — tendência (subiu/desceu)
- `churn_risk_score` — score de risco de churn
- `ltv_prediction_signal` — sinal para LTV
- Automação: trigger email/tooltip baseado em score/dropoff
