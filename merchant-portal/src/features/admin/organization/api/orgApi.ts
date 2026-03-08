/**
 * Organization API — Core PostgREST queries for gm_organizations + gm_org_members.
 *
 * Follows the same pattern as devicesApi.ts: uses `db.from()` (PostgREST fetch).
 * All calls go through Docker Core PostgREST.
 *
 * Sovereignty: Organization data lives ONLY in Core. No Supabase.
 */

import type {
  Organization,
  OrgMember,
  OrgMembership,
  OrgRole,
  PlanTier,
} from "../../../../../../billing-core/types";
import { db } from "../../../../core/db";
import { Logger } from "../../../../core/logger";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all organizations the current user is a member of.
 */
export async function fetchUserOrganizations(
  userId: string,
): Promise<OrgMembership[]> {
  const { data, error } = await db
    .from("gm_org_members")
    .select("org_id, role, gm_organizations(id, name, slug, plan_tier)")
    .eq("user_id", userId);

  if (error) {
    Logger.error("[orgApi] fetchUserOrganizations error:", error);
    return [];
  }

  if (!data || !Array.isArray(data)) return [];

  interface OrgMemberRow {
    org_id: string;
    role: string;
    gm_organizations?: {
      id: string;
      name: string;
      slug: string;
      plan_tier: string;
    };
  }

  return (data as OrgMemberRow[])
    .filter((row) => row.gm_organizations)
    .map((row) => ({
      org_id: row.org_id,
      org_name: row.gm_organizations!.name,
      org_slug: row.gm_organizations!.slug,
      role: row.role as OrgRole,
      plan_tier: row.gm_organizations!.plan_tier as PlanTier,
    }));
}

/**
 * Fetch a single organization by ID.
 */
export async function fetchOrganization(
  orgId: string,
): Promise<Organization | null> {
  const { data, error } = await db
    .from("gm_organizations")
    .select("*")
    .eq("id", orgId)
    .limit(1)
    .single();

  if (error || !data) {
    Logger.error("[orgApi] fetchOrganization error:", error);
    return null;
  }

  return data as unknown as Organization;
}

/**
 * Fetch all members of an organization.
 */
export async function fetchOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await db
    .from("gm_org_members")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    Logger.error("[orgApi] fetchOrgMembers error:", error);
    return [];
  }

  return (data as unknown as OrgMember[]) ?? [];
}

/**
 * Fetch all restaurants belonging to an organization.
 */
export async function fetchOrgRestaurants(orgId: string): Promise<
  Array<{
    id: string;
    name: string;
    status: string;
    billing_status: string | null;
  }>
> {
  const { data, error } = await db
    .from("gm_restaurants")
    .select("id, name, status, billing_status")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    Logger.error("[orgApi] fetchOrgRestaurants error:", error);
    return [];
  }

  return (
    (data as Array<{
      id: string;
      name: string;
      status: string;
      billing_status: string | null;
    }>) ?? []
  );
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update organization details.
 */
export async function updateOrganization(
  orgId: string,
  updates: Partial<
    Pick<
      Organization,
      "name" | "billing_email" | "country" | "tax_id" | "logo_url"
    >
  >,
): Promise<Organization | null> {
  const { data, error } = await db
    .from("gm_organizations")
    .update(updates)
    .eq("id", orgId)
    .select("*")
    .single();

  if (error) {
    Logger.error("[orgApi] updateOrganization error:", error);
    return null;
  }

  return data as unknown as Organization;
}

/**
 * Add a member to an organization.
 */
export async function addOrgMember(
  orgId: string,
  userId: string,
  role: OrgRole = "admin",
): Promise<OrgMember | null> {
  const { data, error } = await db
    .from("gm_org_members")
    .insert({ org_id: orgId, user_id: userId, role })
    .select("*")
    .single();

  if (error) {
    Logger.error("[orgApi] addOrgMember error:", error);
    return null;
  }

  return data as unknown as OrgMember;
}

/**
 * Update a member's role in an organization.
 */
export async function updateOrgMemberRole(
  memberId: string,
  role: OrgRole,
): Promise<boolean> {
  const { error } = await db
    .from("gm_org_members")
    .update({ role })
    .eq("id", memberId);

  if (error) {
    Logger.error("[orgApi] updateOrgMemberRole error:", error);
    return false;
  }

  return true;
}

/**
 * Remove a member from an organization.
 */
export async function removeOrgMember(memberId: string): Promise<boolean> {
  const { error } = await db.from("gm_org_members").delete().eq("id", memberId);

  if (error) {
    Logger.error("[orgApi] removeOrgMember error:", error);
    return false;
  }

  return true;
}

/**
 * Create a new organization (for onboarding / bootstrap).
 */
export async function createOrganization(input: {
  name: string;
  slug: string;
  owner_id: string;
  billing_email?: string;
  country?: string;
  tax_id?: string;
}): Promise<Organization | null> {
  const { data, error } = await db
    .from("gm_organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      owner_id: input.owner_id,
      billing_email: input.billing_email ?? null,
      country: input.country ?? "PT",
      tax_id: input.tax_id ?? null,
      plan_tier: "trial",
    })
    .select("*")
    .single();

  if (error) {
    Logger.error("[orgApi] createOrganization error:", error);
    return null;
  }

  const org = data as unknown as Organization;

  // Auto-add creator as owner member
  await addOrgMember(org.id, input.owner_id, "owner");

  return org;
}
