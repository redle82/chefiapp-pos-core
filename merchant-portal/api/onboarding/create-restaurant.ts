/**
 * POST /api/onboarding/create-restaurant
 *
 * Creates a real restaurant in Supabase for a newly authenticated user
 * who has no existing restaurant membership.
 *
 * Uses service_role to bypass RLS (the user has no membership yet).
 * Performs the full creation chain:
 *   1. gm_organizations -- INSERT company/org
 *   2. gm_restaurants   -- INSERT restaurant with country config
 *   3. gm_restaurant_members -- INSERT owner membership
 *   4. gm_org_members   -- INSERT org owner membership
 *   5. gm_onboarding_state -- INSERT onboarding tracker
 *
 * Rate-limited to auth tier (10/min per IP) to prevent abuse.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AuthError } from "../_lib/auth";
import { applyRateLimit } from "../_lib/rateLimit";
import { getSupabaseAdmin } from "../_lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateRestaurantBody {
  name: string;
  country: string;
  timezone: string;
  currency: string;
  locale: string;
  taxId?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  logoUrl?: string;
  restaurantType?: string;
  defaultTaxRateBps?: number;
}

interface CreateRestaurantResponse {
  restaurantId: string;
  orgId: string;
  onboardingId: string;
  restaurantName: string;
}

// ---------------------------------------------------------------------------
// Auth helper (lighter than verifyAuth -- no restaurant required)
// ---------------------------------------------------------------------------

async function verifyUser(req: VercelRequest): Promise<{ userId: string; email?: string }> {
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

  return { userId: user.id, email: user.email ?? undefined };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ALLOWED_COUNTRIES = ["PT", "ES", "BR", "FR", "IT", "DE", "GB", "US"];
const ALLOWED_TYPES = ["restaurante", "cafe", "bar", "fast_food", "fast_casual", "outro"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function validateBody(body: unknown): CreateRestaurantBody {
  if (!body || typeof body !== "object") {
    throw new AuthError("Request body is required", 400);
  }

  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length < 2 || name.length > 200) {
    throw new AuthError("Restaurant name must be 2-200 characters", 400);
  }

  const country = typeof b.country === "string" ? b.country.toUpperCase().trim() : "PT";
  if (!ALLOWED_COUNTRIES.includes(country)) {
    throw new AuthError(`Invalid country: ${country}`, 400);
  }

  const timezone = typeof b.timezone === "string" ? b.timezone.trim() : "Europe/Lisbon";
  const currency = typeof b.currency === "string" ? b.currency.toUpperCase().trim() : "EUR";
  const locale = typeof b.locale === "string" ? b.locale.trim() : "pt-PT";

  const taxId = typeof b.taxId === "string" ? b.taxId.trim() : undefined;
  const phone = typeof b.phone === "string" ? b.phone.trim() : undefined;
  const address = typeof b.address === "string" ? b.address.trim() : undefined;
  const city = typeof b.city === "string" ? b.city.trim() : undefined;
  const postalCode = typeof b.postalCode === "string" ? b.postalCode.trim() : undefined;
  const logoUrl = typeof b.logoUrl === "string" ? b.logoUrl.trim() : undefined;

  const rawType = typeof b.restaurantType === "string" ? b.restaurantType.toLowerCase().trim() : "restaurante";
  const restaurantType = ALLOWED_TYPES.includes(rawType) ? rawType : "restaurante";

  const defaultTaxRateBps = typeof b.defaultTaxRateBps === "number" ? b.defaultTaxRateBps : undefined;

  return {
    name,
    country,
    timezone,
    currency,
    locale,
    taxId,
    phone,
    address,
    city,
    postalCode,
    logoUrl,
    restaurantType,
    defaultTaxRateBps,
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Rate limit: auth tier (10/min per IP)
  if (applyRateLimit(req, res, "auth")) return;

  try {
    // 1. Verify user identity (no restaurant membership required)
    const { userId, email } = await verifyUser(req);

    // 2. Validate request body
    const data = validateBody(req.body);

    const supabase = getSupabaseAdmin();

    // 3. Check if user already has a restaurant (prevent duplicates)
    const { data: existingMembership } = await supabase
      .from("gm_restaurant_members")
      .select("id, restaurant_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (existingMembership) {
      res.status(409).json({
        error: "User already has a restaurant",
        restaurantId: existingMembership.restaurant_id,
      });
      return;
    }

    // 4. Create organization
    const slug = slugify(data.name) + "-" + Date.now().toString(36);

    const { data: org, error: orgError } = await supabase
      .from("gm_organizations")
      .insert({
        name: data.name,
        owner_id: userId,
        slug,
      })
      .select("id")
      .single();

    if (orgError || !org) {
      console.error("[onboarding] Failed to create organization:", orgError);
      throw new AuthError("Failed to create organization", 500);
    }

    // 5. Create restaurant with full config
    const restaurantSlug = slugify(data.name) + "-" + Date.now().toString(36);

    const { data: restaurant, error: restaurantError } = await supabase
      .from("gm_restaurants")
      .insert({
        org_id: org.id,
        name: data.name,
        slug: restaurantSlug,
        owner_id: userId,
        status: "setup",
        tax_id: data.taxId ?? null,
        logo_url: data.logoUrl ?? null,
        default_tax_rate_bps: data.defaultTaxRateBps ?? 2300,
        config_general: {
          country: data.country,
          timezone: data.timezone,
          currency: data.currency,
          locale: data.locale,
          phone: data.phone ?? null,
          address: data.address ?? null,
          city: data.city ?? null,
          postalCode: data.postalCode ?? null,
          restaurantType: data.restaurantType,
        },
      })
      .select("id, name")
      .single();

    if (restaurantError || !restaurant) {
      console.error("[onboarding] Failed to create restaurant:", restaurantError);
      // Cleanup org on failure
      await supabase.from("gm_organizations").delete().eq("id", org.id);
      throw new AuthError("Failed to create restaurant", 500);
    }

    // 6. Create restaurant membership (owner)
    const { error: memberError } = await supabase
      .from("gm_restaurant_members")
      .insert({
        restaurant_id: restaurant.id,
        user_id: userId,
        role: "owner",
      });

    if (memberError) {
      console.error("[onboarding] Failed to create membership:", memberError);
      // Cleanup
      await supabase.from("gm_restaurants").delete().eq("id", restaurant.id);
      await supabase.from("gm_organizations").delete().eq("id", org.id);
      throw new AuthError("Failed to create membership", 500);
    }

    // 7. Create org membership
    const { error: orgMemberError } = await supabase
      .from("gm_org_members")
      .insert({
        org_id: org.id,
        user_id: userId,
        role: "owner",
      });

    if (orgMemberError) {
      console.error("[onboarding] Failed to create org membership:", orgMemberError);
      // Non-fatal: restaurant + membership already created
    }

    // 8. Create onboarding state tracker
    let onboardingId: string | null = null;
    const { data: onboarding, error: onboardingError } = await supabase
      .from("gm_onboarding_state")
      .insert({
        org_id: org.id,
        restaurant_id: restaurant.id,
        user_id: userId,
        current_step: "welcome",
        restaurant_name: data.name,
        restaurant_slug: restaurantSlug,
        restaurant_phone: data.phone ?? null,
        restaurant_email: email ?? null,
        restaurant_country: data.country,
        restaurant_address: data.address ?? null,
        restaurant_city: data.city ?? null,
        restaurant_postal_code: data.postalCode ?? null,
        tax_id: data.taxId ?? null,
      })
      .select("id")
      .single();

    if (onboardingError) {
      console.error("[onboarding] Failed to create onboarding state:", onboardingError);
      // Non-fatal: restaurant is created
    } else {
      onboardingId = onboarding?.id ?? null;
    }

    // 9. Return success
    const result: CreateRestaurantResponse = {
      restaurantId: restaurant.id as string,
      orgId: org.id as string,
      onboardingId: onboardingId ?? "",
      restaurantName: restaurant.name as string,
    };

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("[onboarding] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
