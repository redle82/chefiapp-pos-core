type AuthUserLike =
  | {
      id?: string | null;
      email?: string | null;
      user_metadata?: {
        name?: unknown;
        avatar_url?: unknown;
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
  const metadataName = normalizeText(user?.user_metadata?.name);
  const name =
    metadataName ?? (email ? email.split("@")[0] : null) ?? "Operador";
  const id = email ?? resolveOperatorId(user) ?? "—";
  const avatarUrl = normalizeText(user?.user_metadata?.avatar_url);

  return {
    name,
    id,
    avatarUrl,
  };
}
