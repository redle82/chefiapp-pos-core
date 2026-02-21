/**
 * F1 Onda 3 — Registo de eventos de autenticação em gm_audit_logs (AUDIT_LOG_SPEC §3.1).
 * login_success, login_failure, logout para trilha de auditoria.
 * Usa Core (invokeRpc) quando backend é Docker.
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";
import { invokeRpc } from "../infra/coreRpc";

/** Regista login bem-sucedido (chamar após signIn success). */
export async function recordLoginSuccess(): Promise<void> {
  if (getBackendType() !== BackendType.docker) return;
  try {
    await invokeRpc("record_auth_event", {
      p_event_type: "login_success",
      p_metadata: {},
    });
  } catch {
    // Não bloquear fluxo de login; falha de audit é silenciosa
  }
}

/** Regista logout (chamar ANTES de signOut para manter sessão). */
export async function recordLogout(): Promise<void> {
  if (getBackendType() !== BackendType.docker) return;
  try {
    await invokeRpc("record_auth_event", {
      p_event_type: "logout",
      p_metadata: {},
    });
  } catch {
    // Não bloquear fluxo de logout
  }
}

/** Regista tentativa de login falhada (callable anon). */
export async function recordLoginFailure(
  identifier: string,
  reason: string
): Promise<void> {
  if (getBackendType() !== BackendType.docker) return;
  try {
    await invokeRpc("log_login_failure", {
      p_identifier: identifier ?? "",
      p_reason: reason ?? "",
    });
  } catch {
    // Não bloquear UI
  }
}
