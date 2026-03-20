/**
 * JWT Authentication for API Routes
 *
 * Verifies the Supabase JWT from the Authorization header and
 * extracts user context (user_id, restaurant_id).
 */
import type { VercelRequest } from "@vercel/node";
import { getSupabaseAdmin } from "./supabase";

export interface AuthContext {
  userId: string;
  restaurantId: string;
  email?: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Verify JWT from Authorization header and resolve user context.
 * Throws AuthError if token is missing, invalid, or user has no restaurant.
 */
export async function verifyAuth(req: VercelRequest): Promise<AuthContext> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AuthError("Missing or malformed Authorization header");
  }

  const token = header.slice(7);
  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError("Invalid or expired token");
  }

  const restaurantId =
    (user.app_metadata?.restaurant_id as string) ??
    (user.user_metadata?.restaurant_id as string);

  if (!restaurantId) {
    throw new AuthError("User has no associated restaurant", 403);
  }

  return {
    userId: user.id,
    restaurantId,
    email: user.email,
  };
}
