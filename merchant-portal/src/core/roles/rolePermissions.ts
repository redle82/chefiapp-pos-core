/**
 * Sistema de papéis — permissões por módulo/rota
 * Ver docs/CHEFIAPP_ROLE_SYSTEM_SPEC.md
 */

import { normalizePath } from "./normalizePath";

export type UserRole = "owner" | "manager" | "staff";

/**
 * Rotas ou prefixos → roles permitidos.
 * Ordem de match: mais específico primeiro (ex.: /config/integrations antes /config).
 * Paths são normalizadas via normalizePath antes de consultar.
 */
const ROUTE_ALLOWED_ROLES: Record<string, UserRole[]> = {
  // Config: owner-only
  "/config/integrations": ["owner"],
  "/config/modules": ["owner"],
  "/config/status": ["owner"],
  "/config/payments": ["owner"],
  "/config/perception": ["owner", "manager"],
  "/dashboard": ["owner", "manager", "staff"],
  "/billing": ["owner"],
  "/app/billing": ["owner"],
  "/mentor": ["owner", "manager"],
  "/health": ["owner", "manager"],
  "/system-tree": ["owner"],
  "/op": ["owner", "manager", "staff"],
  "/tpv": ["owner", "manager", "staff"],
  "/kds-minimal": ["owner", "manager", "staff"],
  "/tasks": ["owner", "manager", "staff"],
  "/alerts": ["owner", "manager", "staff"],
  "/people": ["owner", "manager", "staff"],
  "/garcom": ["owner", "manager", "staff"],
  "/menu-builder": ["owner", "manager"],
  "/operacao": ["owner", "manager"],
  "/inventory-stock": ["owner", "manager"],
  "/financial": ["owner", "manager"],
  "/groups": ["owner"],
  "/purchases": ["owner", "manager"],
  "/reservations": ["owner", "manager"],
  // App tree: backoffice, setup redirects
  "/app": ["owner", "manager", "staff"],
  // Perfil: owner-only, manager-only, staff pode employee
  "/owner": ["owner"],
  "/manager": ["owner", "manager"],
  "/employee": ["owner", "manager", "staff"],
};

/**
 * Devolve os roles que podem aceder a esta path.
 * A path é normalizada (sem query, hash, trailing slash).
 * Comparação por prefixo: /config/integrations confere antes /config.
 */
export function getAllowedRolesForPath(path: string): UserRole[] {
  const normalized = normalizePath(path);
  const exact = ROUTE_ALLOWED_ROLES[normalized];
  if (exact) return exact;
  // Prefix match (ordem: mais específico primeiro)
  const sorted = Object.keys(ROUTE_ALLOWED_ROLES).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of sorted) {
    if (key !== "/" && (normalized === key || normalized.startsWith(key + "/")))
      return ROUTE_ALLOWED_ROLES[key];
  }
  return ["owner", "manager", "staff"]; // default: todos
}

export function canAccessPath(role: UserRole, path: string): boolean {
  const allowed = getAllowedRolesForPath(path);
  return allowed.includes(role);
}
