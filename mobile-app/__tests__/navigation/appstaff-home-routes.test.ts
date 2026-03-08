import {
  APPSTAFF_CONFIG_DESKTOP_ONLY_ROUTE,
  APPSTAFF_HOME_CLEANING_ROUTE,
  APPSTAFF_HOME_KITCHEN_ROUTE,
  APPSTAFF_HOME_MANAGER_ROUTE,
  APPSTAFF_HOME_OWNER_ROUTE,
  APPSTAFF_HOME_WAITER_ROUTE,
  APPSTAFF_HOME_WORKER_ROUTE,
} from "../../constants/appStaffHomeRoutes";

describe("appstaff home route contract", () => {
  it("uses native owner home route", () => {
    expect(APPSTAFF_HOME_OWNER_ROUTE).toBe("/manager/home/owner");
  });

  it("uses native manager home route", () => {
    expect(APPSTAFF_HOME_MANAGER_ROUTE).toBe("/manager/home/manager");
  });

  it("uses native waiter home route", () => {
    expect(APPSTAFF_HOME_WAITER_ROUTE).toBe("/manager/home/waiter");
  });

  it("uses native kitchen home route", () => {
    expect(APPSTAFF_HOME_KITCHEN_ROUTE).toBe("/manager/home/kitchen");
  });

  it("uses native cleaning home route", () => {
    expect(APPSTAFF_HOME_CLEANING_ROUTE).toBe("/manager/home/cleaning");
  });

  it("uses native worker home route", () => {
    expect(APPSTAFF_HOME_WORKER_ROUTE).toBe("/manager/home/worker");
  });

  it("uses native config desktop only route", () => {
    expect(APPSTAFF_CONFIG_DESKTOP_ONLY_ROUTE).toBe(
      "/manager/config-desktop-only",
    );
  });
});
