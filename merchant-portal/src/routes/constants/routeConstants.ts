export const DASHBOARD_ROUTES = {
  ROOT: "/dashboard",
  APP: "/app/dashboard",
} as const;

export const OPERATIONAL_ROUTES = {
  TPV: "/op/tpv",
  KDS: "/op/kds",
  CASH: "/op/cash",
  POS_ALIAS: "/op/pos",
} as const;

export const APP_ROUTES = {
  ROOT: "/app",
  ACTIVATION: "/app/activation",
  BILLING: "/app/billing",
  STAFF: "/app/staff",
  STAFF_HOME: "/app/staff/home",
  SELECT_TENANT: "/app/select-tenant",
} as const;

export const ADMIN_ROUTES = {
  CONFIG: "/admin/config",
  DEVICES: "/admin/devices",
  DESKTOP: "/admin/desktop",
  RESERVATIONS: "/admin/reservations",
  REPORTS_OVERVIEW: "/admin/reports/overview",
  MODULES: "/admin/modules",
} as const;

export const DESKTOP_OPERATIONAL_ROUTES = [
  OPERATIONAL_ROUTES.TPV,
  OPERATIONAL_ROUTES.KDS,
] as const;

export const LAST_ROUTE_ALLOWED = [
  DASHBOARD_ROUTES.ROOT,
  DASHBOARD_ROUTES.APP,
  ADMIN_ROUTES.CONFIG,
  OPERATIONAL_ROUTES.TPV,
  OPERATIONAL_ROUTES.KDS,
  OPERATIONAL_ROUTES.CASH,
] as const;

export const CRITICAL_BILLING_ROUTES = [
  OPERATIONAL_ROUTES.TPV,
  OPERATIONAL_ROUTES.KDS,
  OPERATIONAL_ROUTES.CASH,
] as const;
