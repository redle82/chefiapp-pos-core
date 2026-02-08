// Example usage: run with ts-node or compile with tsc
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
console.log("startShift:", start);

const assign = assignTask(worker.id, { type: "SERVE_TABLE", riskLevel: "LOW", payload: { table: 7 } });
console.log("assignTask:", assign);
