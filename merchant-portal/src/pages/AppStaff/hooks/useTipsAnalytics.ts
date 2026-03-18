/**
 * useTipsAnalytics — Hook para gorjetas e métricas de performance.
 *
 * MVP: dados demo gerados. Pronto para integrar com pedidos reais.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  ChartDataPoint,
  EmployeeTipSummary,
  PerformanceMetrics,
  TipEntry,
  TipSummary,
} from "../context/TipsTypes";
import type { StaffRole } from "../context/StaffCoreTypes";

// ── Demo data generator ──────────────────────────────────────────

const DEMO_EMPLOYEES = [
  { id: "mock-1", name: "Ana Ferreira", role: "waiter" as StaffRole },
  { id: "mock-3", name: "João Costa", role: "manager" as StaffRole },
  { id: "mock-5", name: "Pedro Silva", role: "waiter" as StaffRole },
  { id: "mock-2", name: "Rui Oliveira", role: "kitchen" as StaffRole },
];

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function generateDemoTips(): TipEntry[] {
  const tips: TipEntry[] = [];
  const now = Date.now();

  for (let day = 0; day < 7; day++) {
    for (const emp of DEMO_EMPLOYEES) {
      const count = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < count; i++) {
        tips.push({
          id: `tip-${day}-${emp.id}-${i}`,
          employee_id: emp.id,
          employee_name: emp.name,
          amount: Math.floor(Math.random() * 800) + 100, // 1.00 - 9.00
          currency: "EUR",
          method: (["cash", "card", "digital"] as const)[
            Math.floor(Math.random() * 3)
          ],
          date: new Date(now - day * 86_400_000).toISOString().slice(0, 10),
          created_at: new Date(now - day * 86_400_000).toISOString(),
        });
      }
    }
  }

  return tips;
}

function generateDemoMetrics(): PerformanceMetrics[] {
  return DEMO_EMPLOYEES.map((emp) => ({
    employee_id: emp.id,
    employee_name: emp.name,
    employee_role: emp.role,
    period: "week" as const,
    orders_served: Math.floor(Math.random() * 80) + 20,
    tables_attended: Math.floor(Math.random() * 40) + 10,
    tasks_completed: Math.floor(Math.random() * 20) + 5,
    tasks_assigned: Math.floor(Math.random() * 25) + 8,
    avg_service_time_ms: Math.floor(Math.random() * 600_000) + 300_000,
    total_hours_worked: Math.floor(Math.random() * 20) + 25,
    punctuality_score: Math.floor(Math.random() * 30) + 70,
    customer_rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
    tips_received: Math.floor(Math.random() * 5000) + 1000,
    complaints: Math.floor(Math.random() * 3),
  }));
}

// ── Hook ─────────────────────────────────────────────────────────

export function useTipsAnalytics() {
  const [tips] = useState<TipEntry[]>(generateDemoTips);
  const [metrics] = useState<PerformanceMetrics[]>(generateDemoMetrics);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

  // Weekly tip summary
  const weekSummary: TipSummary = useMemo(() => {
    const total = tips.reduce((s, t) => s + t.amount, 0);
    const byEmployee = new Map<string, { name: string; role: StaffRole; total: number; count: number }>();

    for (const t of tips) {
      const existing = byEmployee.get(t.employee_id);
      if (existing) {
        existing.total += t.amount;
        existing.count += 1;
      } else {
        const emp = DEMO_EMPLOYEES.find((e) => e.id === t.employee_id);
        byEmployee.set(t.employee_id, {
          name: t.employee_name,
          role: emp?.role ?? "worker",
          total: t.amount,
          count: 1,
        });
      }
    }

    const employeeSummaries: EmployeeTipSummary[] = Array.from(
      byEmployee.entries(),
    )
      .map(([id, data]) => ({
        employee_id: id,
        employee_name: data.name,
        employee_role: data.role,
        total: data.total,
        count: data.count,
        average: Math.round(data.total / data.count),
        percentage: total > 0 ? Math.round((data.total / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      period: "week",
      start_date: tips[tips.length - 1]?.date ?? "",
      end_date: tips[0]?.date ?? "",
      total_amount: total,
      count: tips.length,
      average: tips.length > 0 ? Math.round(total / tips.length) : 0,
      by_employee: employeeSummaries,
    };
  }, [tips]);

  // Daily chart data
  const dailyChart: ChartDataPoint[] = useMemo(() => {
    const byDay = new Map<number, number>();
    for (const t of tips) {
      const dow = new Date(t.date).getDay();
      byDay.set(dow, (byDay.get(dow) ?? 0) + t.amount);
    }
    // Monday first
    return [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
      label: DAY_LABELS[dow === 0 ? 6 : dow - 1],
      value: byDay.get(dow) ?? 0,
    }));
  }, [tips]);

  // Top performer
  const topPerformer = useMemo(
    () =>
      metrics.reduce(
        (best, m) =>
          !best || m.orders_served > best.orders_served ? m : best,
        null as PerformanceMetrics | null,
      ),
    [metrics],
  );

  return {
    tips,
    weekSummary,
    dailyChart,
    metrics,
    topPerformer,
    period,
    setPeriod,
  };
}

// ── Formatters ───────────────────────────────────────────────────

export function formatCents(cents: number, currency = "EUR"): string {
  const symbol = currency === "BRL" ? "R$" : "€";
  return `${symbol} ${(cents / 100).toFixed(2)}`;
}

export function formatMinutes(ms: number): string {
  const mins = Math.round(ms / 60_000);
  return `${mins}min`;
}
