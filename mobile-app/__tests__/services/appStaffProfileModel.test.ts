import { buildAppStaffProfileModel } from "../../features/manager/appStaffProfileModel";

describe("buildAppStaffProfileModel", () => {
  it("builds active shift profile data", () => {
    const model = buildAppStaffProfileModel({
      userName: "Maria",
      userId: "user-123",
      email: "maria@chefia.app",
      roleLabel: "Gerente",
      businessName: "Chefia Centro",
      shiftState: "active",
      shiftStart: 1710000000000,
    });

    expect(model.displayName).toBe("Maria");
    expect(model.email).toBe("maria@chefia.app");
    expect(model.shiftStatusLabel).toBe("Turno ativo");
    expect(model.shiftStartedAtLabel).not.toBe("-");
  });

  it("falls back when shift is offline", () => {
    const model = buildAppStaffProfileModel({
      userName: "",
      userId: "user-999",
      roleLabel: "Garçom",
      businessName: "Chefia Norte",
      shiftState: "offline",
      shiftStart: null,
    });

    expect(model.displayName).toBe("Colaborador");
    expect(model.email).toBe("-");
    expect(model.shiftStatusLabel).toBe("Sem turno ativo");
    expect(model.shiftStartedAtLabel).toBe("-");
  });
});
