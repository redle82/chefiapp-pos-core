import { useCallback, useEffect, useRef, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  fetchRestaurantForIdentity,
  getOrCreateRestaurantId,
} from "../../infra/readers/RuntimeReader";
import { isDockerBackend } from "../infra/backendAdapter";
import { RUNTIME_MODE } from "../kernel/RuntimeContext";
import { configureSentryScope } from "../logger/Logger";
import { TRIAL_RESTAURANT_ID } from "../readiness/operationalRestaurant";

export interface RestaurantIdentity {
  id: string | null;
  name: string;
  city: string;
  type: string;
  legalName?: string;
  slug?: string;
  isTestLike?: boolean;
  environmentLabel?: "TEST" | "Sandbox";
  isTrial: boolean;
  loading: boolean;
  ownerName?: string;
  logoUrl?: string; // Brand Identity
  lastPulse?: {
    type: string;
    created_at: string;
    payload: any;
  };
}

/** Placeholder para modo Supabase (quando backend !== docker). */
let identityTodoLoggedOnce = false;

function asTrimmedText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function pickFirstText(...values: unknown[]): string | null {
  for (const value of values) {
    const text = asTrimmedText(value);
    if (text) return text;
  }
  return null;
}

function resolveCanonicalRestaurantName(row: Record<string, unknown>): {
  displayName: string;
  legalName?: string;
  slug?: string;
} {
  const commercialName = pickFirstText(
    row.commercial_name,
    row.display_name,
    row.name,
  );
  const legalName = pickFirstText(row.legal_name);
  const slug = pickFirstText(row.slug);
  return {
    displayName: commercialName || legalName || slug || "Restaurante",
    legalName: legalName ?? undefined,
    slug: slug ?? undefined,
  };
}

function resolveEnvironmentLabel(
  row: Record<string, unknown>,
  opts: { isTrial: boolean; productMode?: string | null },
): { isTestLike: boolean; environmentLabel?: "TEST" | "Sandbox" } {
  const slug = asTrimmedText(row.slug) ?? "";
  const explicitIsTest = row.is_test === true;
  const byMode =
    opts.productMode === "trial" ||
    opts.productMode === "pilot" ||
    opts.isTrial;
  const bySlug = /(sandbox|test|trial)/i.test(slug);
  const isTestLike = explicitIsTest || byMode || bySlug;

  if (!isTestLike) {
    return { isTestLike: false };
  }
  if (opts.productMode === "pilot") {
    return { isTestLike: true, environmentLabel: "Sandbox" };
  }
  return { isTestLike: true, environmentLabel: "TEST" };
}

async function hydrateIdentityFromSupabasePlaceholder(
  setIdentity: (
    updater: (prev: RestaurantIdentity) => RestaurantIdentity,
  ) => void,
) {
  if (!identityTodoLoggedOnce) {
    identityTodoLoggedOnce = true;
    console.warn("[Identity] Backend sem Core: usando identidade trial.");
  }
  setIdentity((prev) => ({
    ...prev,
    id: prev.id || TRIAL_RESTAURANT_ID,
    name: prev.name || "Seu restaurante",
    city: prev.city || "Trial",
    type: prev.type || "Restaurante",
    isTrial: true,
    loading: false,
    ownerName: prev.ownerName || "Visitante",
  }));
}

export function useRestaurantIdentity() {
  const runtimeContext = useRestaurantRuntime();
  const runtime = runtimeContext?.runtime ?? null;
  const sentryConfiguredRef = useRef(false);

  const [identity, setIdentity] = useState<RestaurantIdentity>({
    id: null,
    name: "",
    city: "",
    type: "",
    isTrial: false,
    loading: true,
    ownerName: "",
    logoUrl: undefined,
  });

  const mountedRef = useRef(true);

  const hydrate = useCallback(async () => {
    if (!mountedRef.current) return;
    setIdentity((prev) => ({ ...prev, loading: true }));

    // A) TRIAL MODE CHECK
    const params = new URLSearchParams(window.location.search);
    const { getTabIsolated } = await import("../storage/TabIsolatedStorage");
    const isTrial =
      getTabIsolated("chefiapp_trial_mode") === "true" ||
      params.get("mode") === "trial";

    // A) TRIAL ou REAL: identidade do Core para o restaurante atual (nome + logo em KDS/TPV)
    try {
      if (isDockerBackend()) {
        const storedRestaurantId = getTabIsolated("chefiapp_restaurant_id");
        const restaurantId = isTrial
          ? TRIAL_RESTAURANT_ID
          : runtime?.restaurant_id ??
            storedRestaurantId ??
            (await getOrCreateRestaurantId());
        if (!restaurantId) {
          if (mountedRef.current)
            setIdentity((prev) => ({
              ...prev,
              id: null,
              name: "",
              city: "",
              type: "",
              loading: false,
            }));
          return;
        }
        const row = await fetchRestaurantForIdentity(restaurantId);
        if (!mountedRef.current) return;
        if (row) {
          const rawRow = row as unknown as Record<string, unknown>;
          const canonical = resolveCanonicalRestaurantName(rawRow);
          const env = resolveEnvironmentLabel(rawRow, {
            isTrial: !!isTrial,
            productMode: runtime?.productMode,
          });

          setIdentity({
            id: row.id,
            name: canonical.displayName,
            legalName: canonical.legalName,
            slug: canonical.slug,
            isTestLike: env.isTestLike,
            environmentLabel: env.environmentLabel,
            city: row.city ?? (isTrial ? "Trial" : "Local desconhecido"),
            type: row.type ?? "Restaurante",
            isTrial: !!isTrial,
            loading: false,
            ownerName: isTrial ? "Visitante" : "Comandante",
            logoUrl: row.logo_url ?? undefined,
            ...(isTrial && {
              lastPulse: {
                type: "TRIAL_PULSE",
                created_at: new Date().toISOString(),
                payload: { message: "Sistema em modo de trial" },
              },
            }),
          });
          return;
        }
        // Fallback quando Core não devolve linha (ex.: trial sem fetch)
        if (isTrial) {
          setIdentity({
            id: TRIAL_RESTAURANT_ID,
            name: "Restaurante",
            city: "Trial",
            type: "Restaurante",
            isTrial: true,
            isTestLike: true,
            environmentLabel: "TEST",
            loading: false,
            ownerName: "Visitante",
            logoUrl: undefined,
            lastPulse: {
              type: "TRIAL_PULSE",
              created_at: new Date().toISOString(),
              payload: { message: "Sistema em modo de trial" },
            },
          });
          return;
        }
        if (mountedRef.current) {
          setIdentity((prev) => ({
            ...prev,
            id: restaurantId,
            name: prev.name || "Restaurante",
            city: prev.city || "Local desconhecido",
            type: prev.type || "Geral",
            loading: false,
          }));
        }
      } else {
        await hydrateIdentityFromSupabasePlaceholder(setIdentity);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Identity: Crash hydration:", msg);
      if (mountedRef.current) {
        setIdentity((prev) => ({
          ...prev,
          name: prev.name || "Restaurante",
          city: prev.city || "Local desconhecido",
          type: prev.type || "Geral",
          loading: false,
          isTrial: prev.isTrial || false,
        }));
      }
    }
  }, [runtime?.restaurant_id]);

  useEffect(() => {
    mountedRef.current = true;
    hydrate();
    return () => {
      mountedRef.current = false;
    };
  }, [hydrate]);

  // Configure Sentry scope once when restaurant identity resolves
  useEffect(() => {
    if (identity.id && !identity.loading && !sentryConfiguredRef.current) {
      sentryConfiguredRef.current = true;
      configureSentryScope({
        restaurantId: identity.id,
        runtimeMode: RUNTIME_MODE,
        restaurantName: identity.name || undefined,
      });
    }
  }, [identity.id, identity.loading, identity.name]);

  return { identity, refreshIdentity: hydrate };
}
