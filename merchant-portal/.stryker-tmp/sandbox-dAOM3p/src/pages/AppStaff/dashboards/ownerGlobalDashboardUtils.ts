// @ts-nocheck
import type { ShiftHistoryItem } from "../../../hooks/useShiftHistory";

export function deriveFinancialSnapshot(
  history: ShiftHistoryItem[],
  now: Date,
) {
  const todayKey = getDateKey(now);
  const yesterdayKey = getDateKey(new Date(now.getTime() - 24 * 3600 * 1000));
  const last7Keys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() - index * 24 * 3600 * 1000);
    return getDateKey(date);
  });

  const totalsByDay = new Map<string, number>();

  history.forEach((shift) => {
    const key = getDateKey(new Date(shift.opened_at));
    const total = (totalsByDay.get(key) ?? 0) + shift.total_sales_cents;
    totalsByDay.set(key, total);
  });

  const todayCents = totalsByDay.get(todayKey) ?? 0;
  const yesterdayCents = totalsByDay.get(yesterdayKey) ?? 0;
  const total7d = last7Keys.reduce(
    (acc, key) => acc + (totalsByDay.get(key) ?? 0),
    0,
  );
  const avg7dCents = Math.round(total7d / 7);

  return { todayCents, yesterdayCents, avg7dCents };
}

export function buildFinancialAlerts(snapshot: {
  todayCents: number;
  yesterdayCents: number;
  avg7dCents: number;
}) {
  const alerts: string[] = [];
  if (snapshot.avg7dCents > 0 && snapshot.todayCents < snapshot.avg7dCents) {
    alerts.push("Receita abaixo da media 7 dias");
  }
  if (
    snapshot.yesterdayCents > 0 &&
    snapshot.todayCents < snapshot.yesterdayCents
  ) {
    alerts.push("Receita abaixo de ontem");
  }
  return alerts;
}

export function getLatestShift(history: ShiftHistoryItem[]) {
  if (history.length === 0) return null;
  return [...history].sort((a, b) => (a.opened_at < b.opened_at ? 1 : -1))[0];
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
