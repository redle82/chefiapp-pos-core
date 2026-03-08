import { buildTurnSummaryModel } from "../../features/manager/turnSummaryModel";

describe("buildTurnSummaryModel", () => {
  it("returns active state and running duration", () => {
    const now = 1710003600000;
    const shiftStart = 1710000000000;
    const model = buildTurnSummaryModel({
      shiftState: "active",
      shiftStart,
      now,
    });

    expect(model.shiftStatusLabel).toBe("Turno ativo");
    expect(model.primaryActionLabel).toBe("Encerrar turno");
    expect(model.durationMinutes).toBe(60);
  });

  it("returns offline defaults when no shift is active", () => {
    const model = buildTurnSummaryModel({
      shiftState: "offline",
      shiftStart: null,
      now: 1710003600000,
    });

    expect(model.shiftStatusLabel).toBe("Sem turno ativo");
    expect(model.primaryActionLabel).toBe("Iniciar turno");
    expect(model.durationMinutes).toBe(0);
  });
});
