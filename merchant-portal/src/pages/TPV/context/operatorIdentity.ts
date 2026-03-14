type AuthUserLike =
  | {
      id?: string | null;
      email?: string | null;
      /** Name at root level (ex.: Keycloak, generic OIDC adapters). */
      name?: unknown;
      /** Role at root level when not using Supabase metadata. */
      role?: unknown;
      user_metadata?: {
        /** Supabase-style display name. */
        name?: unknown;
        avatar_url?: unknown;
        /** Supabase-style role, when present. */
        role?: unknown;
      } | null;
    }
  | null
  | undefined;

export function resolveOperatorId(user: AuthUserLike): string | null {
  const id = user?.id;
  if (typeof id !== "string") return null;
  const normalized = id.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function resolveOperatorProfile(user: AuthUserLike): {
  name: string;
  id: string;
  avatarUrl: string | null;
} {
  const email = normalizeText(user?.email);
  const rootName = normalizeText((user as any)?.name);
  const metadataName = normalizeText(user?.user_metadata?.name);

  const name =
    rootName ?? metadataName ?? (email ? email.split("@")[0] : null) ?? "Utilizador";

  const idFromMetadata = normalizeText(
    (user as any)?.user_metadata?.id ??
      (user as any)?.user_metadata?.user_id,
  );

  const id = email ?? idFromMetadata ?? resolveOperatorId(user) ?? "—";
  const avatarUrl = normalizeText(user?.user_metadata?.avatar_url);

  return {
    name,
    id,
    avatarUrl,
  };
}
