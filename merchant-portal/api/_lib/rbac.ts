/**
 * Server-side RBAC Middleware for Vercel API Routes
 *
 * Verifies JWT + checks operator role from gm_restaurant_members.
 * Returns AuthContext with role information or throws 403.
 * Caches role lookups for 5 minutes (in-memory Map with TTL).
 */
import type { VercelRequest } from "@vercel/node";
import { verifyAuth, AuthError } from "./auth";
import type { AuthContext } from "./auth";
import { getSupabaseAdmin } from "./supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "owner" | "manager" | "cashier" | "waiter" | "kitchen";

export interface RBACContext extends AuthContext {
  role: Role;
  operatorId: string;
}

// ---------------------------------------------------------------------------
// Role Cache (in-memory, 5-minute TTL)
// ---------------------------------------------------------------------------

interface CachedRole {
  role: Role;
  operatorId: string;
  expiresAt: number;
}

const ROLE_CACHE_TTL_MS = 5 * 60 * 1000;
const roleCache = new Map<string, CachedRole>();

function cacheKey(userId: string, restaurantId: string): string {
  return `${userId}:${restaurantId}`;
}

/** Periodically evict expired entries to prevent memory leaks. */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of roleCache) {
      if (now >= entry.expiresAt) roleCache.delete(key);
    }
  },
  5 * 60 * 1000,
);

// ---------------------------------------------------------------------------
// Role Lookup
// ---------------------------------------------------------------------------

const VALID_ROLES: ReadonlySet<string> = new Set<string>([
  "owner",
  "manager",
  "cashier",
  "waiter",
  "kitchen",
]);

async function lookupRole(
  userId: string,
  restaurantId: string,
): Promise<{ role: Role; operatorId: string }> {
  const key = cacheKey(userId, restaurantId);
  const cached = roleCache.get(key);

  if (cached && Date.now() < cached.expiresAt) {
    return { role: cached.role, operatorId: cached.operatorId };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("gm_restaurant_members")
    .select("id, role")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error) {
    throw new AuthError(`Failed to look up operator role: ${error.message}`, 500);
  }

  if (!data) {
    throw new AuthError(
      "User is not a member of this restaurant",
      403,
    );
  }

  const rawRole = (data.role as string)?.toLowerCase() ?? "staff";
  const role: Role = VALID_ROLES.has(rawRole) ? (rawRole as Role) : "waiter";

  roleCache.set(key, {
    role,
    operatorId: data.id as string,
    expiresAt: Date.now() + ROLE_CACHE_TTL_MS,
  });

  return { role, operatorId: data.id as string };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verify JWT, resolve operator role, and enforce that the role is in allowedRoles.
 * Throws AuthError (401/403) on failure.
 */
export async function requireRole(
  req: VercelRequest,
  allowedRoles: Role[],
): Promise<RBACContext> {
  const auth = await verifyAuth(req);
  const { role, operatorId } = await lookupRole(auth.userId, auth.restaurantId);

  if (!allowedRoles.includes(role)) {
    throw new AuthError(
      `Role "${role}" is not authorized for this operation. Required: ${allowedRoles.join(", ")}`,
      403,
    );
  }

  return {
    ...auth,
    role,
    operatorId,
  };
}

/**
 * Verify JWT and resolve operator role without enforcing a specific role.
 * Useful when role-based logic is handled inline (e.g. discount thresholds).
 */
export async function resolveRole(
  req: VercelRequest,
): Promise<RBACContext> {
  const auth = await verifyAuth(req);
  const { role, operatorId } = await lookupRole(auth.userId, auth.restaurantId);

  return {
    ...auth,
    role,
    operatorId,
  };
}
