import {
  MANAGER_ALERTS_ROUTE,
  MANAGER_KDS_ROUTE,
  MANAGER_OPERATION_ROUTE,
  MANAGER_TASKS_ROUTE,
  MANAGER_TEAM_ROUTE,
  MANAGER_TPV_ROUTE,
  MANAGER_TURN_ROUTE,
} from "../../constants/managerRoutes";

describe("manager mode route contract", () => {
  it("uses native operation route", () => {
    expect(MANAGER_OPERATION_ROUTE).toBe("/manager/operation");
  });

  it("uses native turn route", () => {
    expect(MANAGER_TURN_ROUTE).toBe("/manager/turn");
  });

  it("uses native tpv route", () => {
    expect(MANAGER_TPV_ROUTE).toBe("/manager/tpv");
  });

  it("uses native kds route", () => {
    expect(MANAGER_KDS_ROUTE).toBe("/manager/kds");
  });

  it("uses native tasks route", () => {
    expect(MANAGER_TASKS_ROUTE).toBe("/manager/tasks");
  });

  it("uses native alerts route", () => {
    expect(MANAGER_ALERTS_ROUTE).toBe("/manager/alerts");
  });

  it("uses native team route", () => {
    expect(MANAGER_TEAM_ROUTE).toBe("/manager/team");
  });
});
