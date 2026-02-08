/**
 * connectByCode — CODE_AND_DEVICE_PAIRING_CONTRACT.
 * Role and resolution always come from contract/invite, NEVER from code text.
 */

import { isDebugMode } from "../../../core/debugMode";
import { RUNTIME } from "../../../core/runtime/RuntimeContext";
import type { OperationalContract, StaffRole } from "../../../pages/AppStaff/context/StaffCoreTypes";
import { DEMO_CODES } from "../../../pages/AppStaff/data/operatorProfiles";
import type { ConnectByCodeContext, ConnectByCodeResult } from "./types";

const allowMocks = () =>
  isDebugMode() ||
  (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test") ||
  RUNTIME.isDemo;

/** Demo: resolve code to role from mock invite table (code → role). Role never parsed from code text. */
function getDemoRoleFromInviteTable(code: string): StaffRole | null {
  const entry = Object.entries(DEMO_CODES).find(([, c]) => c === code);
  return entry ? (entry[0] as StaffRole) : null;
}

/**
 * Resolves a code to an operational contract and role.
 * Role always comes from invite/contract/backend, never from parsing the code string.
 */
export async function connectByCode(
  code: string,
  ctx?: ConnectByCodeContext
): Promise<ConnectByCodeResult> {
  const restaurantHint = ctx?.restaurantHint ?? null;

  try {
    // A) MOCK PATH (Dev only) — code in DEMO_CODES; role from mock invite table
    if (allowMocks() && code.includes("mock")) {
      await new Promise((r) => setTimeout(r, 800));
      if (code === "FAIL")
        return { success: false, roleSource: null, message: "Simulação de Falha de Rede." };
      const resolvedRole = getDemoRoleFromInviteTable(code) ?? "worker";
      const contract: OperationalContract = {
        id: restaurantHint ?? "mock-restaurant-connected",
        type: "restaurant",
        name: "Restaurante Conectado (Demo)",
        mode: "connected",
        permissions: [],
      };
      return {
        success: true,
        operationalContract: contract,
        resolvedRole,
        roleSource: "invite",
      };
    }

    // A') DEMO FALLBACK — any code when demo + restaurantId; role from mock invite table if code matches
    if (allowMocks() && restaurantHint) {
      await new Promise((r) => setTimeout(r, 400));
      const resolvedRole = getDemoRoleFromInviteTable(code) ?? "worker";
      const contract: OperationalContract = {
        id: restaurantHint,
        type: "restaurant",
        name: "Seu Restaurante (Demo)",
        mode: "connected",
        permissions: [],
      };
      return {
        success: true,
        operationalContract: contract,
        resolvedRole,
        roleSource: "invite",
      };
    }

    // B) PRODUCTION — active_invites; role from data.role_granted (invite)
    const { supabase } = await import("../../../core/supabase");
    if (typeof supabase === "undefined") {
      return {
        success: false,
        roleSource: null,
        message: "Modo remoto indisponível (Supabase Runtime Missing).",
      };
    }

    const { data, error } = await supabase
      .from("active_invites")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !data) {
      let message = "Código inválido ou expirado.";
      if (error?.code === "PGRST116") message = "Código não encontrado. Verifique se digitou corretamente.";
      else if (error?.code === "22P02") message = "Formato de código inválido. Use o formato CHEF-XXXX-XX.";
      else if (error?.message?.includes("expired")) message = "Este código expirou. Solicite um novo ao gerente.";
      return { success: false, roleSource: null, message };
    }

    const role = (data.role_granted as StaffRole) || "worker";
    const contract: OperationalContract = {
      id: data.restaurant_id,
      type: "restaurant",
      name: "Restaurante Conectado",
      mode: "connected",
      permissions: [],
    };
    return {
      success: true,
      operationalContract: contract,
      resolvedRole: role,
      roleSource: "invite",
    };
  } catch (err) {
    console.error(err);
    return { success: false, roleSource: null, message: "Erro de conexão." };
  }
}
