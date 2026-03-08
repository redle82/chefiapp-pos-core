import {
  APPSTAFF_KDS_MOBILE_ROUTE,
  APPSTAFF_PROFILE_ROUTE,
  APPSTAFF_PV_ROUTE,
} from "../../constants/appStaffParityRoutes";

describe("appstaff parity route contract", () => {
  it("uses native profile route", () => {
    expect(APPSTAFF_PROFILE_ROUTE).toBe("/manager/profile");
  });

  it("uses native pv route", () => {
    expect(APPSTAFF_PV_ROUTE).toBe("/manager/pv");
  });

  it("uses native kds mobile route", () => {
    expect(APPSTAFF_KDS_MOBILE_ROUTE).toBe("/manager/kds-mobile");
  });
});
