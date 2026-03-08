import { describe, expect, it } from "vitest";
import {
  ADMIN_ROUTES,
  APP_ROUTES,
  DASHBOARD_ROUTES,
  DESKTOP_OPERATIONAL_ROUTES,
  LAST_ROUTE_ALLOWED,
  OPERATIONAL_ROUTES,
} from "./routeConstants";

describe("routeConstants", () => {
  it("defines canonical operational and admin routes", () => {
    expect(OPERATIONAL_ROUTES.TPV).toBe("/op/tpv");
    expect(OPERATIONAL_ROUTES.KDS).toBe("/op/kds");
    expect(ADMIN_ROUTES.CONFIG).toBe("/admin/config");
    expect(ADMIN_ROUTES.DEVICES).toBe("/admin/devices");
    expect(ADMIN_ROUTES.DESKTOP).toBe("/admin/desktop");
    expect(APP_ROUTES.BILLING).toBe("/app/billing");
    expect(APP_ROUTES.STAFF_HOME).toBe("/app/staff/home");
  });

  it("keeps shared route collections aligned with billing and desktop flows", () => {
    expect(DESKTOP_OPERATIONAL_ROUTES).toEqual([
      OPERATIONAL_ROUTES.TPV,
      OPERATIONAL_ROUTES.KDS,
    ]);
    expect(LAST_ROUTE_ALLOWED).toContain(ADMIN_ROUTES.CONFIG);
    expect(LAST_ROUTE_ALLOWED).toContain(OPERATIONAL_ROUTES.TPV);
    expect(LAST_ROUTE_ALLOWED).toContain(OPERATIONAL_ROUTES.CASH);
    expect(LAST_ROUTE_ALLOWED).toContain(DASHBOARD_ROUTES.APP);
  });
});
