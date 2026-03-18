/**
 * TipsTypes — Sistema de gorjetas e analytics por colaborador.
 *
 * Modelo:
 * - TipEntry: gorjeta individual (associada a pedido/turno)
 * - TipSummary: resumo por período (dia/semana/mês)
 * - PerformanceMetrics: métricas de performance do colaborador
 */

import type { StaffRole } from "./StaffCoreTypes";

// ── Tips ─────────────────────────────────────────────────────────

export interface TipEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  order_id?: string;
  amount: number; // em centavos
  currency: string; // "EUR", "BRL"
  method: "cash" | "card" | "digital";
  date: string; // "2026-03-18"
  shift_id?: string;
  created_at: string;
}

export interface TipSummary {
  period: "day" | "week" | "month";
  start_date: string;
  end_date: string;
  total_amount: number; // centavos
  count: number;
  average: number; // centavos
  by_employee: EmployeeTipSummary[];
}

export interface EmployeeTipSummary {
  employee_id: string;
  employee_name: string;
  employee_role: StaffRole;
  total: number; // centavos
  count: number;
  average: number;
  percentage: number; // % do total
}

// ── Performance Analytics ────────────────────────────────────────

export interface PerformanceMetrics {
  employee_id: string;
  employee_name: string;
  employee_role: StaffRole;
  period: "day" | "week" | "month";
  // Produtividade
  orders_served: number;
  tables_attended: number;
  tasks_completed: number;
  tasks_assigned: number;
  // Tempo
  avg_service_time_ms: number; // tempo médio de atendimento
  total_hours_worked: number;
  punctuality_score: number; // 0-100
  // Qualidade
  customer_rating: number; // 1-5
  tips_received: number; // centavos
  complaints: number;
}

// ── Chart data ───────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string; // "Seg", "Ter", etc.
  value: number;
}
