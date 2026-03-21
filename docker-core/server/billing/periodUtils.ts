export interface BillingPeriod {
  periodStart: string;
  periodEnd: string;
}

function toIsoDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getPreviousMonthPeriod(
  referenceDate = new Date(),
): BillingPeriod {
  const currentYear = referenceDate.getUTCFullYear();
  const currentMonth = referenceDate.getUTCMonth();

  const previousMonthStart = new Date(
    Date.UTC(currentYear, currentMonth - 1, 1),
  );
  const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
  const previousMonthEnd = new Date(
    currentMonthStart.getTime() - 24 * 60 * 60 * 1000,
  );

  return {
    periodStart: toIsoDateUtc(previousMonthStart),
    periodEnd: toIsoDateUtc(previousMonthEnd),
  };
}

export function getCurrentMonthPeriod(
  referenceDate = new Date(),
): BillingPeriod {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  const start = new Date(Date.UTC(year, month, 1));
  const nextMonthStart = new Date(Date.UTC(year, month + 1, 1));
  const end = new Date(nextMonthStart.getTime() - 24 * 60 * 60 * 1000);

  return {
    periodStart: toIsoDateUtc(start),
    periodEnd: toIsoDateUtc(end),
  };
}

export function isCurrentMonthPeriod(
  periodStart: string,
  periodEnd: string,
  referenceDate = new Date(),
): boolean {
  const current = getCurrentMonthPeriod(referenceDate);
  return current.periodStart === periodStart && current.periodEnd === periodEnd;
}
