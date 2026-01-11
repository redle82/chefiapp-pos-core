# AppStaff Core (TypeScript)

Contrato soberano para trabalho humano: turnos, tarefas, conformidade e formação, com invariantes e eventos.

## Conteúdo
- `types.ts`: tipos de Worker, Role, Shift, Task, Compliance, Training.
- `events.ts`: eventos imutáveis (ShiftStarted, TaskAssigned, ...).
- `invariants.ts`: validações (descanso mínimo, sobreposição, contexto).
- `contracts.ts`: fachada de contratos que emite eventos.

## Uso Rápido

```ts
import { startShift, assignTask } from "./contracts";
import type { Worker, Shift } from "./types";
import type { LegalProfile } from "../src/lib/legal-types";

const worker: Worker = { id: "w1", name: "Ana", activeRoles: ["WAITER"] };
const legal: LegalProfile = {
  country: "Spain",
  iso: "ES",
  languages: ["es"],
  currency: "EUR",
  labor_laws: { max_hours_per_day: 9, max_hours_per_week: 40, mandatory_break_after: 6, min_rest_between_shifts_hours: 12 },
  data_protection: { gdpr: true, photo_restrictions: "explicit_consent", data_retention_max_years: 10 },
  hygiene_regulations: { haccp_required: true, temperature_logs_required: true, food_handler_certification_required: true, retention_years: 7 },
};

const recentShifts: Shift[] = [];
const start = startShift(worker, "WAITER", recentShifts, legal);
if (!start.ok) console.error(start.violations);
else console.log(start.result);

const taskSpec = { type: "SERVE_TABLE", riskLevel: "LOW", payload: { table: 12 } };
const assign = assignTask(worker.id, taskSpec);
if (!assign.ok) console.error(assign.violations);
else console.log(assign.result);
```

## Princípios
- Eventos são imutáveis e audíveis.
- Invariantes protegem justiça e conformidade.
- Integrações externas são adaptadores; não definem verdade.