import {
  OWNER_SECTOR_CLEANING_ROUTE,
  OWNER_SECTOR_KITCHEN_ROUTE,
  OWNER_SECTOR_OPERATION_ROUTE,
  OWNER_SECTOR_TASKS_ROUTE,
  OWNER_SECTOR_TEAM_ROUTE,
} from "../../constants/ownerSectorRoutes";

describe("owner sector route contract", () => {
  it("uses native operation sector route", () => {
    expect(OWNER_SECTOR_OPERATION_ROUTE).toBe("/manager/sector/operation");
  });

  it("uses native tasks sector route", () => {
    expect(OWNER_SECTOR_TASKS_ROUTE).toBe("/manager/sector/tasks");
  });

  it("uses native team sector route", () => {
    expect(OWNER_SECTOR_TEAM_ROUTE).toBe("/manager/sector/team");
  });

  it("uses native kitchen sector route", () => {
    expect(OWNER_SECTOR_KITCHEN_ROUTE).toBe("/manager/sector/kitchen");
  });

  it("uses native cleaning sector route", () => {
    expect(OWNER_SECTOR_CLEANING_ROUTE).toBe("/manager/sector/cleaning");
  });
});
