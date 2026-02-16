/**
 * Sistema de papéis — permissões por módulo/rota
 * Ver docs/CHEFIAPP_ROLE_SYSTEM_SPEC.md
 */

import { normalizePath } from "./normalizePath";

export type UserRole = "owner" | "manager" | "staff";

/**
 * Rotas ou prefixos → roles permitidos.
 * FASE 3 Passo 4: Staff só executa; Gerente acompanha; Dono vê tudo.
 * Web de configuração canónica: /admin/config (legado /config eliminado).
 */
const ROUTE_ALLOWED_ROLES: Record<string, UserRole[]> = {
  // Admin config: apenas owner/manager (staff não acede a configuração sensível)
  "/admin/config/integrations": ["owner"],
  "/admin/config/modules": ["owner"],
  "/admin/config/status": ["owner"],
  "/admin/config/payments": ["owner"],
  "/admin/config/suscripcion": ["owner"],
  "/admin/config/perception": ["owner", "manager"],
  "/admin/config": ["owner", "manager"],
  // Config sidebar (legacy paths — sem /admin prefix)
  "/config/integrations": ["owner"],
  "/config/modules": ["owner"],
  "/config/status": ["owner"],
  "/config/payments": ["owner"],
  "/config/suscripcion": ["owner"],
  "/config/perception": ["owner", "manager"],
  "/config": ["owner", "manager"],
  // Dashboard: owner/manager (gerente acompanha; staff só execução em /op, /tasks, etc.)
  "/dashboard": ["owner", "manager"],
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
  "/app/reports": ["owner", "manager"],
  "/groups": ["owner"],
  "/purchases": ["owner", "manager"],
  "/reservations": ["owner", "manager"],
  // Catálogo (admin) — nested under /admin/catalog/*
  "/admin/catalog": ["owner", "manager"],
  "/admin/catalog/list": ["owner", "manager"],
  "/admin/catalog/assignments": ["owner", "manager"],
  "/admin/catalog/products": ["owner", "manager"],
  "/admin/catalog/modules": ["owner", "manager"],
  "/admin/modules": ["owner", "manager"],
  "/admin/catalog/modifiers": ["owner", "manager"],
  "/admin/catalog/combos": ["owner", "manager"],
  "/admin/catalog/translations": ["owner", "manager"],
  // App tree: backoffice owner/manager; staff só execução (garcom, tpv, etc.)
  "/app/backoffice": ["owner", "manager"],
  "/app/waiter": ["owner", "manager", "staff"],
  "/app": ["owner", "manager", "staff"],
  "/admin/tables": ["owner", "manager"],
  "/admin/printers": ["owner", "manager"],
  "/admin/users": ["owner", "manager"],
  "/admin/integrations": ["owner", "manager"],
  "/admin/legal": ["owner", "manager"],
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
