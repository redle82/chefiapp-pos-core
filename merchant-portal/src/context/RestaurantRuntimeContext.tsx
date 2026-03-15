/**
 * RestaurantRuntimeContext - O CORAÇÃO DO SISTEMA
 *
 * Este é o contexto global que governa a identidade do restaurante.
 * Sem ele, o sistema não sabe quem ele é.
 *
 * Responsabilidades:
 * - Buscar ou criar restaurant_id
 * - Persistir estado global (onboarding/active)
 * - Gerenciar módulos instalados
 * - Ser usado por TODAS as telas
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchInstalledModules,
  fetchRestaurant,
  fetchSetupStatus,
  getOrCreateRestaurantId,
} from "../infra/readers/RuntimeReader";
import {
  insertInstalledModule as persistInstalledModule,
  setProductMode as persistProductMode,
  setRestaurantStatus as persistRestaurantStatus,
  upsertSetupStatus as persistSetupStatus,
} from "../infra/writers/RuntimeWriter";
import { isDebugMode } from "../core/debugMode";
import { isDockerBackend } from "../core/infra/backendAdapter";
import {
  deriveLifecycle,
  type RestaurantLifecycle,
} from "../core/lifecycle/Lifecycle";
import {
  deriveSystemState,
  type SystemState,
} from "../core/lifecycle/LifecycleState";
import {
  ALL_KNOWN_MODULES,
  ALL_SAFE_MODULES_DEV,
  getModuleCapabilityEntry,
  type ModuleCapabilityEntry,
} from "../core/modules/moduleCatalog";
import { isDevStableMode } from "../core/runtime/devStableMode";
import { getTabIsolated } from "../core/storage/TabIsolatedStorage";
import {
  clearActiveTenant,
  TENANT_SEALED_EVENT,
} from "../core/tenant/TenantResolver";

/** Estado operacional do Core: avisos só quando coreMode === 'offline-erro'. */
export type CoreMode = "offline-intencional" | "online" | "offline-erro";

export function deriveCoreMode(
  coreReachable: boolean,
  allowLocalMode: boolean,
): CoreMode {
  if (coreReachable) return "online";
  if (allowLocalMode) return "offline-intencional";
  return "offline-erro";
}

function allowLocalMode(
  systemState: SystemState,
  productMode: ProductMode,
): boolean {
  if (systemState === "SETUP") return true;
  if (productMode === "trial") return true;
  if (getTabIsolated("chefiapp_trial_mode") === "true") return true;
  return false;
}

export type RestaurantMode = "onboarding" | "active" | "paused";
export type ProductMode = "trial" | "pilot" | "live";

/**
 * Nós canónicos de setup crítico do restaurante.
 *
 * Estes são os mesmos nós que o Dashboard e a SystemTree tratam como
 * bloqueantes para operar: identidade, localização/moeda, menu e publicação.
 */
export type CriticalSetupNode = "identity" | "location" | "menu" | "publish";

/**
 * Valor conceptual de estado de setup para um nó crítico.
 *
 * NOTA: atualmente o Core persiste apenas flags booleanas por secção
 * (ex.: `identity: true`), mas a UI pode mapear essas flags para
 * INCOMPLETE/PARTIAL/COMPLETE conforme necessário.
 */
export type SetupStatusValue = "INCOMPLETE" | "PARTIAL" | "COMPLETE";

/**
 * Estado bruto de setup vindo do Core (restaurant_setup_status).
 *
 * Mantemos o formato flexível (Record<string, boolean>) para compatibilidade
 * com secções adicionais (schedule, people, payments, tables, etc.).
 * Os nós críticos são expostos via `CriticalSetupNode` e derivados
 * (por exemplo, em `deriveSystemTreeState`).
 */
export type SetupStatus = Record<string, boolean>;

export type PlanTier = "basic" | "premium";

function resolveProductModeFromEnv(): ProductMode {
  // B1 Persistence: Prioritize session storage for Pilot survival across refreshes
  const persisted =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("chefiapp_product_mode")
      : null;
  if (persisted === "trial" || persisted === "pilot" || persisted === "live") {
    return persisted as ProductMode;
  }

  const override = import.meta.env.VITE_FORCE_PRODUCT_MODE as
    | ProductMode
    | undefined;
  if (override === "trial" || override === "pilot" || override === "live") {
    return override;
  }
  return "trial";
}

/** Verdade dos dados: trial = simulação, live = dados reais. Derivado de productMode. */
export type DataMode = "trial" | "live";

export interface RestaurantRuntime {
  restaurant_id: string | null;
  mode: RestaurantMode;
  productMode: ProductMode;
  /** Verdade dos dados: trial = simulação, live = dados reais. Derivado de productMode. */
  dataMode: DataMode;
  /** Módulos declarados como instalados (UI e roteamento) */
  installed_modules: string[];
  /** Módulos que podem rodar engine / ler-escrever (safe no ambiente atual) */
  active_modules: string[];
  plan: PlanTier;
  /** Status bruto vindo do DB (operacional: active, paused, onboarding) */
  status: string;
  /** Estado de faturação SaaS (gm_restaurants.billing_status): trial | active | past_due | canceled */
  billing_status?: string | null;
  /** Fim do período de trial (14 dias). Para countdown e paywall. */
  trial_ends_at?: string | null;
  /** Por módulo: dataSource (mock|core), offline */
  capabilities: Record<string, ModuleCapabilityEntry>;
  setup_status: SetupStatus;
  isPublished: boolean;
  lifecycle: RestaurantLifecycle;
  loading: boolean;
  error: string | null;
  /** false quando backend é Docker e o Core está em baixo (usa fallback). */
  coreReachable: boolean;
  /** FASE C: estado único do sistema (SETUP | TRIAL | ACTIVE | SUSPENDED). Derivado de hasOrganization, billing_status, isBootstrapComplete. */
  systemState: SystemState;
  /** Estado operacional: avisos só quando === 'offline-erro'. */
  coreMode: CoreMode;
}

interface RestaurantRuntimeContextType {
  runtime: RestaurantRuntime;
  refresh: () => Promise<void>;
  updateSetupStatus: (section: string, complete: boolean) => Promise<void>;
  publishRestaurant: () => Promise<void>;
  installModule: (moduleId: string) => Promise<void>;
  /** Stub: altera productMode apenas na sessão (sem persistir no Core). */
  setProductMode: (mode: ProductMode) => void;
}
const INITIAL_RUNTIME: RestaurantRuntime = {
  restaurant_id: null,
  mode: "onboarding",
  productMode: resolveProductModeFromEnv(),
  dataMode: resolveProductModeFromEnv() === "live" ? "live" : "trial",
  installed_modules: [],
  active_modules: [],
  plan: "basic",
  status: "onboarding",
  billing_status: null,
  trial_ends_at: null,
  capabilities: {},
  setup_status: {},
  isPublished: false,
  lifecycle: deriveLifecycle(null, false, false),
  loading: true,
  error: null,
  // Fail-fast por omissão: assumimos Core inacessível até o primeiro refresh bem-sucedido.
  coreReachable: false,
  systemState: "SETUP",
  coreMode: "online",
};

export const RestaurantRuntimeContext =
  createContext<RestaurantRuntimeContextType>({
    runtime: INITIAL_RUNTIME,
    refresh: async () => {},
    updateSetupStatus: async () => {},
    publishRestaurant: async () => {},
    installModule: async () => {},
    setProductMode: () => {},
  });

export function RestaurantRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [runtime, setRuntime] = useState<RestaurantRuntime>(INITIAL_RUNTIME);
  const isInitialLoadRef = useRef(true);
  const isDockerCore = isDockerBackend();

  /**
   * TODO FASE 1 → FASE 3:
   * Este contexto antes dependia de Supabase para:
   * - criar restaurante,
   * - ler setup_status,
   * - ler/instalar módulos,
   * - publicar restaurante.
   *
   * Em PURE DOCKER MODE, todas essas operações devem ser movidas para
   * serviços Docker/Core (PostgREST / RPC).
   *
   * Nesta fase, removemos Supabase e mantemos apenas placeholders seguros.
   */

  /** Quando backend é Docker: lê do Core (primeiro restaurante ou seed). */
  async function loadOrCreateRestaurantFromCore(): Promise<string | null> {
    try {
      return await getOrCreateRestaurantId();
    } catch {
      if (import.meta.env.DEV) {
        console.warn("[RestaurantRuntime] Core indisponível, usando seed id:");
      }
      const seedId = "00000000-0000-0000-0000-000000000100";
      if (typeof window !== "undefined") {
        localStorage.setItem("chefiapp_restaurant_id", seedId);
      }
      return seedId;
    }
  }

  /** Quando backend é Docker: lê estado do Core (gm_restaurants, installed_modules, restaurant_setup_status). */
  async function fetchRuntimeStateFromCore(
    restaurantId: string,
  ): Promise<
    Pick<
      RestaurantRuntime,
      | "mode"
      | "productMode"
      | "installed_modules"
      | "active_modules"
      | "plan"
      | "status"
      | "billing_status"
      | "trial_ends_at"
      | "capabilities"
      | "setup_status"
      | "isPublished"
    >
  > {
    const [restaurant, installedIds, setupSections] = await Promise.all([
      fetchRestaurant(restaurantId),
      fetchInstalledModules(restaurantId),
      fetchSetupStatus(restaurantId),
    ]);

    if (!restaurant && isDockerCore) {
      throw new Error("Restaurant not found in Core");
    }

    const mode: RestaurantMode =
      restaurant?.status === "paused"
        ? "paused"
        : restaurant?.status === "active"
        ? "active"
        : "onboarding";

    const productMode: ProductMode =
      restaurant?.product_mode === "pilot" ||
      restaurant?.product_mode === "live"
        ? restaurant.product_mode
        : "trial";

    const installed_modules = installedIds.length > 0 ? installedIds : [];
    const active_modules = installed_modules.filter((id) =>
      ALL_SAFE_MODULES_DEV.includes(id),
    );
    const plan: PlanTier =
      installed_modules.length >= ALL_KNOWN_MODULES.length
        ? "premium"
        : "basic";
    const status: string = restaurant?.status ?? "onboarding";
    const billing_status: string | null = restaurant?.billing_status ?? null;
    const trial_ends_at: string | null = restaurant?.trial_ends_at ?? null;
    const capabilities: Record<string, ModuleCapabilityEntry> = {};
    for (const id of installed_modules.length > 0
      ? installed_modules
      : ALL_KNOWN_MODULES) {
      capabilities[id] = getModuleCapabilityEntry(id);
    }

    return {
      mode,
      productMode,
      installed_modules,
      active_modules,
      plan,
      status,
      billing_status,
      trial_ends_at,
      capabilities,
      setup_status: setupSections,
      isPublished: mode === "active",
    };
  }

  /** Setup completo para trial: checklist "Pagamentos configurados" e demais aparecem ok no System Tree. */
  const TRIAL_SETUP_STATUS: SetupStatus = {
    identity: true,
    location: true,
    menu: true,
    schedule: true,
    people: true,
    payments: true,
    publish: true,
  };

  /** Fallback quando Core não é Docker ou quando fetch do Core falha. */
  async function fetchRuntimeStateFallback(
    _restaurantId: string,
  ): Promise<
    Pick<
      RestaurantRuntime,
      | "mode"
      | "productMode"
      | "installed_modules"
      | "active_modules"
      | "plan"
      | "status"
      | "billing_status"
      | "trial_ends_at"
      | "capabilities"
      | "setup_status"
      | "isPublished"
      | "systemState"
    >
  > {
    if (isDevStableMode()) {
      const installed_modules = [...ALL_KNOWN_MODULES];
      const active_modules = [...installed_modules];
      const capabilities: Record<string, ModuleCapabilityEntry> = {};
      for (const id of ALL_KNOWN_MODULES) {
        capabilities[id] = getModuleCapabilityEntry(id);
      }
      return {
        mode: "active", // In Dev stable, we are always active
        productMode: "trial",
        installed_modules: [],
        active_modules: [],
        plan: "basic",
        status: "active",
        billing_status: "trial",
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        capabilities: {},
        setup_status: TRIAL_SETUP_STATUS,
        isPublished: true,
        systemState: deriveSystemState({
          hasOrganization: true,
          billingStatus: "trial",
          isBootstrapComplete: true,
        }),
      };
    }
    const baseInstalled = [
      "tasks",
      "appstaff",
      "system-tree",
      "config",
      "health",
      "alerts",
      "restaurant-web",
    ];
    const capabilities: Record<string, ModuleCapabilityEntry> = {};
    for (const id of baseInstalled) {
      capabilities[id] = getModuleCapabilityEntry(id);
    }
    return {
      mode: "active",
      productMode: resolveProductModeFromEnv(),
      installed_modules: baseInstalled,
      active_modules: baseInstalled.filter((id) =>
        ALL_SAFE_MODULES_DEV.includes(id),
      ),
      plan: "basic",
      status: "active",
      billing_status: "trial",
      trial_ends_at: null,
      capabilities,
      setup_status: {},
      isPublished: true,
      systemState: deriveSystemState({
        hasOrganization: true,
        billingStatus: "trial",
        isBootstrapComplete: true,
      }),
    };
  }

  /**
   * Buscar ou criar restaurant_id.
   * Docker Core: localStorage → primeiro restaurante do Core → seed (dev).
   */
  const loadOrCreateRestaurant = useCallback(async (): Promise<
    string | null
  > => {
    try {
      if (isDockerCore) {
        return await loadOrCreateRestaurantFromCore();
      }
      const savedId =
        typeof window !== "undefined"
          ? localStorage.getItem("chefiapp_restaurant_id")
          : null;
      return savedId;
    } catch (error) {
      console.error(
        "[RestaurantRuntime] Erro ao carregar/criar restaurante:",
        error,
      );
      return null;
    }
  }, [isDockerCore]);

  /**
   * Carregar estado completo do restaurante
   */
  const refresh = useCallback(async () => {
    setRuntime((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const restaurantId = await loadOrCreateRestaurant();

      if (!restaurantId) {
        setRuntime((prev) => ({
          ...prev,
          loading: false,
          error: "Não foi possível carregar ou criar restaurante",
        }));
        return;
      }

      let coreReachable = true;
      let coreState: Awaited<
        ReturnType<typeof fetchRuntimeStateFromCore>
      > | null = null;
      if (isDockerCore) {
        try {
          coreState = await fetchRuntimeStateFromCore(restaurantId);
          coreReachable = true;
        } catch (err: unknown) {
          coreReachable = false;
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === "Restaurant not found in Core") {
            clearActiveTenant();
            setRuntime((prev) => ({
              ...prev,
              restaurant_id: null,
              loading: false,
              error: "Restaurante não encontrado",
            }));
            return;
          }
          coreState = await fetchRuntimeStateFallback(restaurantId);
        }
      } else {
        coreState = await fetchRuntimeStateFallback(restaurantId);
      }

      if (!coreState) {
        return;
      }

      const mode: RestaurantMode = coreState.mode;
      const rawSetup = coreState.setup_status || {};
      const setup_status: SetupStatus = isDevStableMode()
        ? TRIAL_SETUP_STATUS
        : rawSetup;
      const installed_modules: string[] = coreState.installed_modules || [];
      const plan = coreState.plan ?? "basic";
      const status = coreState.status ?? "active";
      const billing_status = coreState.billing_status ?? null;
      const trial_ends_at = (coreState as { trial_ends_at?: string | null }).trial_ends_at ?? null;
      const capabilities = coreState.capabilities ?? {};
      const productMode: ProductMode =
        coreState.productMode ?? resolveProductModeFromEnv();

      const isPublished = coreState.isPublished ?? mode === "active";
      const systemState = deriveSystemState({
        hasOrganization: true,
        billingStatus: billing_status,
        isBootstrapComplete: mode === "active",
      });

      const allowLocal = allowLocalMode(systemState, productMode);
      const coreMode = deriveCoreMode(coreReachable, allowLocal);

      setRuntime({
        restaurant_id: restaurantId,
        mode,
        productMode,
        dataMode: productMode === "live" ? "live" : "trial",
        installed_modules,
        active_modules: coreState.active_modules ?? installed_modules,
        plan,
        status,
        billing_status,
        trial_ends_at,
        capabilities,
        setup_status,
        isPublished,
        lifecycle: deriveLifecycle(restaurantId, isPublished, false),
        loading: false,
        error: null,
        coreReachable,
        systemState,
        coreMode,
      });

      console.log("[RestaurantRuntime] ✅ Estado carregado:", {
        restaurant_id: restaurantId,
        mode,
        installed_modules: installed_modules.length,
        active_modules: (coreState.active_modules ?? installed_modules).length,
        plan,
        setup_status,
      });
    } catch (error: any) {
      console.error("[RestaurantRuntime] Erro ao carregar estado:", error);
      setRuntime((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || "Erro ao carregar restaurante",
      }));
    }
  }, [loadOrCreateRestaurant, isDockerCore]);

  /**
   * Atualizar status de uma seção do onboarding.
   * Docker Core: persiste em restaurant_setup_status.
   */
  const updateSetupStatus = useCallback(
    async (section: string, complete: boolean) => {
      if (!runtime.restaurant_id) {
        console.warn(
          "[RestaurantRuntime] Sem restaurant_id para atualizar setup_status",
        );
        return;
      }

      const newSetupStatus = {
        ...runtime.setup_status,
        [section]: complete,
      };

      try {
        if (isDockerCore) {
          const { error } = await persistSetupStatus(
            runtime.restaurant_id,
            newSetupStatus,
          );
          if (error) {
            const msg = error?.message ?? String(error);
            if (!msg.includes("aborted")) {
              console.warn("[RestaurantRuntime] persistSetupStatus:", error);
            }
          }
        }
        setRuntime((prev) => ({ ...prev, setup_status: newSetupStatus }));
      } catch (error: any) {
        const msg = error?.message ?? String(error);
        if (!msg.includes("abort") && !msg.includes("Failed to fetch")) {
          console.error(
            "[RestaurantRuntime] Erro ao atualizar setup_status:",
            error,
          );
        }
      }
    },
    [runtime.restaurant_id, runtime.setup_status, isDockerCore],
  );

  /**
   * Publicar restaurante (ativação real).
   * Docker Core: PATCH gm_restaurants status='active' + INSERT installed_modules.
   */
  const publishRestaurant = useCallback(async () => {
    if (!runtime.restaurant_id) {
      throw new Error("Restaurant ID não encontrado");
    }

    const baseModules =
      runtime.plan === "premium"
        ? [...ALL_KNOWN_MODULES]
        : [
            "tpv",
            "kds",
            "menu",
            "tasks",
            "people",
            "health",
            "alerts",
            "mentor",
            "purchases",
            "financial",
            "reservations",
            "groups",
          ];

    try {
      if (isDockerCore) {
        const { error: statusErr } = await persistRestaurantStatus(
          runtime.restaurant_id,
          "active",
        );
        if (statusErr) {
          console.warn("[RestaurantRuntime] setRestaurantStatus:", statusErr);
        }
        for (const moduleId of baseModules) {
          await persistInstalledModule(
            runtime.restaurant_id,
            moduleId,
            moduleId,
          );
        }
      }

      const active_modules = baseModules.filter((id) =>
        ALL_SAFE_MODULES_DEV.includes(id),
      );

      const capabilities: Record<string, ModuleCapabilityEntry> = {};
      for (const id of baseModules) {
        capabilities[id] = getModuleCapabilityEntry(id);
      }

      setRuntime((prev) => {
        const systemState = deriveSystemState({
          hasOrganization: true,
          billingStatus: prev.billing_status,
          isBootstrapComplete: true,
        });
        return {
          ...prev,
          mode: "active",
          installed_modules: baseModules,
          active_modules,
          capabilities,
          systemState,
        };
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("chefiapp_onboarding_state");
      }
    } catch (error: any) {
      console.error("[RestaurantRuntime] Erro ao publicar restaurante:", error);
      throw error;
    }
  }, [runtime.restaurant_id, runtime.plan, isDockerCore]);

  /**
   * Instalar módulo.
   * Docker Core: INSERT em installed_modules, depois refresh.
   */
  const installModule = useCallback(
    async (moduleId: string) => {
      if (!runtime.restaurant_id) {
        throw new Error("Restaurant ID não encontrado");
      }

      try {
        if (isDockerCore) {
          const { error } = await persistInstalledModule(
            runtime.restaurant_id,
            moduleId,
            moduleId,
          );
          if (error) {
            console.warn("[RestaurantRuntime] insertInstalledModule:", error);
          }
        }
        setRuntime((prev) => ({
          ...prev,
          installed_modules: prev.installed_modules.includes(moduleId)
            ? prev.installed_modules
            : [...prev.installed_modules, moduleId],
        }));
      } catch (error) {
        console.error("[RestaurantRuntime] Erro ao instalar módulo:", error);
        throw error;
      }
    },
    [runtime.restaurant_id, isDockerCore],
  );

  /** Altera productMode: persiste no Core quando backend é Docker; atualiza estado local. */
  const setProductMode = useCallback(
    async (mode: ProductMode) => {
      setRuntime((prev) => ({
        ...prev,
        productMode: mode,
        dataMode: mode === "live" ? "live" : "trial",
      }));
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("chefiapp_product_mode", mode);
      }
      if (isDockerCore && runtime.restaurant_id) {
        const { error } = await persistProductMode(runtime.restaurant_id, mode);
        if (error) {
          console.warn("[RestaurantRuntime] persistProductMode:", error);
        }
      }
    },
    [isDockerCore, runtime.restaurant_id],
  );

  // Carregar estado inicial - Somente na primeira vez ou quando o restaurantId mudar
  // Não depender de 'refresh' diretamente se ele for recriado a cada render do runtime
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      refresh();
    }
  }, [runtime.restaurant_id]); // Apenas re-hidratar se o restaurantId (propriedade externa) mudar

  // Fluxo soberano: quando FlowGate sela o tenant por membership, sincronizar o runtime
  useEffect(() => {
    const handler = () => refresh();
    if (typeof window === "undefined") return;
    window.addEventListener(TENANT_SEALED_EVENT, handler);
    return () => window.removeEventListener(TENANT_SEALED_EVENT, handler);
  }, [refresh]);

  const value = useMemo<RestaurantRuntimeContextType>(
    () => ({
      runtime,
      refresh,
      updateSetupStatus,
      publishRestaurant,
      installModule,
      setProductMode,
    }),
    [
      runtime,
      refresh,
      updateSetupStatus,
      publishRestaurant,
      installModule,
      setProductMode,
    ],
  );

  // CONTRATO_TRIAL_REAL: não expor setter de pilot na UI. Bypass apenas em debug (?debug=1) para testes.
  useEffect(() => {
    if (typeof window !== "undefined" && isDebugMode()) {
      // @ts-expect-error debug-only hook for E2E/tests
      window.__CHEF_SET_PILOT = () => setProductMode("pilot");
    }
  }, [setProductMode]);

  return (
    <RestaurantRuntimeContext.Provider value={value}>
      {children}
    </RestaurantRuntimeContext.Provider>
  );
}

export function useRestaurantRuntime() {
  const context = useContext(RestaurantRuntimeContext);
  return context;
}
