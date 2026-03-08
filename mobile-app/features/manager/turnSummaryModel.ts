import { ShiftState } from "@/context/AppStaffContext";

export type TurnSummaryModelInput = {
  shiftState: ShiftState;
  shiftStart: number | null;
  now: number;
};

export type TurnSummaryModel = {
  shiftStatusLabel: string;
  primaryActionLabel: string;
  durationMinutes: number;
};

export function buildTurnSummaryModel(
  input: TurnSummaryModelInput,
): TurnSummaryModel {
  const isActive = input.shiftState === "active";
  const durationMinutes =
    isActive && input.shiftStart
      ? Math.max(0, Math.floor((input.now - input.shiftStart) / 60000))
      : 0;

  return {
    shiftStatusLabel: isActive ? "Turno ativo" : "Sem turno ativo",
    primaryActionLabel: isActive ? "Encerrar turno" : "Iniciar turno",
    durationMinutes,
  };
}
