import { ShiftState } from "@/context/AppStaffContext";

export type AppStaffProfileModelInput = {
  userName: string;
  userId: string;
  email?: string;
  roleLabel: string;
  businessName: string;
  shiftState: ShiftState;
  shiftStart: number | null;
};

export type AppStaffProfileModel = {
  displayName: string;
  userId: string;
  email: string;
  roleLabel: string;
  businessName: string;
  shiftStatusLabel: string;
  shiftStartedAtLabel: string;
};

export function buildAppStaffProfileModel(
  input: AppStaffProfileModelInput,
): AppStaffProfileModel {
  const shiftStatusLabel =
    input.shiftState === "active" ? "Turno ativo" : "Sem turno ativo";

  const shiftStartedAtLabel =
    input.shiftState === "active" && input.shiftStart
      ? new Date(input.shiftStart).toLocaleString("pt-PT")
      : "-";

  return {
    displayName: input.userName.trim() || "Colaborador",
    userId: input.userId,
    email: input.email ?? "-",
    roleLabel: input.roleLabel,
    businessName: input.businessName,
    shiftStatusLabel,
    shiftStartedAtLabel,
  };
}
