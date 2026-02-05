/**
 * RoleContext — papel do utilizador para gates e navegação
 * Ver docs/CHEFIAPP_ROLE_SYSTEM_SPEC.md
 *
 * FASE B: Sem roleOverride, role é "owner". Toggle por localStorage só com ?debug=1.
 *
 * Fonte do role:
 * - roleOverride (opcional): quando fornecido (ex.: sessão/backend), é a fonte de verdade; setRole fica no-op.
 * - Sem roleOverride: "owner" em produto; com ?debug=1 permite override por localStorage (testes).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { isDebugMode } from "../debugMode";
import type { UserRole } from "./rolePermissions";

const STORAGE_KEY = "chefiapp_user_role";

function readStoredRole(): UserRole {
  if (typeof window === "undefined") return "owner";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "owner" || raw === "manager" || raw === "staff") return raw;
  return "owner";
}

export interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  /** true quando o role vem do backend/sessão (roleOverride); false quando vem de default owner */
  fromServer: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export interface RoleProviderProps {
  children: React.ReactNode;
  /**
   * Role vindo do backend/sessão. Quando definido, é a fonte de verdade e setRole não altera o role.
   * Ex.: <RoleProvider role={session?.user?.role}> quando existir API de auth/perfil.
   */
  role?: UserRole | null;
}

export function RoleProvider({
  children,
  role: roleOverride,
}: RoleProviderProps) {
  const [localRole, setLocalRole] = useState<UserRole>(readStoredRole);

  // Sem override: "owner" em produto; com ?debug=1 permite toggle (localStorage) para testes.
  const role: UserRole = roleOverride ?? (isDebugMode() ? localRole : "owner");
  const fromServer = roleOverride != null;

  const setRole = useCallback(
    (next: UserRole) => {
      if (fromServer) return;
      setLocalRole(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    },
    [fromServer]
  );

  const value = useMemo(
    () => ({ role, setRole, fromServer }),
    [role, setRole, fromServer]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return ctx;
}

export function useRoleOptional(): RoleContextValue | null {
  return useContext(RoleContext);
}
