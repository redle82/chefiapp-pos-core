import {
  buildDefaultAppStaffUrl,
  normalizeAppStaffWebUrl,
  shouldAllowAppStaffNavigation,
} from "../../app/appstaff-web-url";

describe("appstaff web url policy", () => {
  it("normalizes env url to AppStaff home path", () => {
    expect(
      normalizeAppStaffWebUrl(
        "http://localhost:5175/admin/reports",
        "localhost",
      ),
    ).toBe("http://localhost:5175/app/staff/home");
  });

  it("falls back to localhost appstaff home when env url is invalid", () => {
    expect(normalizeAppStaffWebUrl("not-a-url", "localhost")).toBe(
      "http://localhost:5175/app/staff/home",
    );
  });

  it("allows navigation only inside appstaff path on same origin", () => {
    const baseUrl = buildDefaultAppStaffUrl("localhost");

    expect(
      shouldAllowAppStaffNavigation(
        "http://localhost:5175/app/staff/home",
        baseUrl,
      ),
    ).toBe(true);
    expect(
      shouldAllowAppStaffNavigation(
        "http://localhost:5175/app/staff/home/manager",
        baseUrl,
      ),
    ).toBe(true);
    expect(
      shouldAllowAppStaffNavigation(
        "http://localhost:5175/auth/phone",
        baseUrl,
      ),
    ).toBe(true);
    expect(
      shouldAllowAppStaffNavigation(
        "http://localhost:5175/admin/reports",
        baseUrl,
      ),
    ).toBe(false);
    expect(
      shouldAllowAppStaffNavigation(
        "http://example.com/app/staff/home",
        baseUrl,
      ),
    ).toBe(false);
  });

  it("allows navigation to waiter routes for table management", () => {
    const baseUrl = buildDefaultAppStaffUrl("localhost");

    expect(
      shouldAllowAppStaffNavigation(
        "http://localhost:5175/app/waiter",
        baseUrl,
      ),
    ).toBe(true);
    expect(
      shouldAllowAppStaffNavigation(
        "http://localhost:5175/app/waiter/table/5",
        baseUrl,
      ),
    ).toBe(true);
    expect(
      shouldAllowAppStaffNavigation(
        "http://localhost:5175/app/waiter/calls",
        baseUrl,
      ),
    ).toBe(true);
  });
});
