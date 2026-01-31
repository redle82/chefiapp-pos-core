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
  useRef,
  useState,
} from "react";
import { CONFIG } from "../config";
import {
  fetchInstalledModules,
  fetchRestaurant,
  fetchSetupStatus,
  getOrCreateRestaurantId,
} from "../core-boundary/readers/RuntimeReader";
import {
  insertInstalledModule as persistInstalledModule,
  setProductMode as persistProductMode,
  setRestaurantStatus as persistRestaurantStatus,
  upsertSetupStatus as persistSetupStatus,
} from "../core-boundary/writers/RuntimeWriter";
import {
  deriveLifecycle,
  type RestaurantLifecycle,
} from "../core/lifecycle/Lifecycle";
import {
  ALL_KNOWN_MODULES,
  ALL_SAFE_MODULES_DEV,
  getModuleCapabilityEntry,
  type ModuleCapabilityEntry,
} from "../core/modules/moduleCatalog";
import { isDevStableMode } from "../core/runtime/devStableMode";

export type RestaurantMode = "onboarding" | "active" | "paused";
export type ProductMode = "demo" | "pilot" | "live";
export type SetupStatus = Record<string, boolean>;
export type PlanTier = "basic" | "premium";

function resolveProductModeFromEnv(): ProductMode {
  // B1 Persistence: Prioritize session storage for Pilot survival across refreshes
  const persisted =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("chefiapp_product_mode")
      : null;
  if (persisted === "demo" || persisted === "pilot" || persisted === "live") {
    return persisted as ProductMode;
  }

  const override = import.meta.env.VITE_FORCE_PRODUCT_MODE as
    | ProductMode
    | undefined;
  if (override === "demo" || override === "pilot" || override === "live") {
    return override;
  }
  return "demo";
}

export interface RestaurantRuntime {
  restaurant_id: string | null;
  mode: RestaurantMode;
  productMode: ProductMode;
  /** Módulos declarados como instalados (UI e roteamento) */
  installed_modules: string[];
  /** Módulos que podem rodar engine / ler-escrever (safe no ambiente atual) */
  active_modules: string[];
  plan: PlanTier;
  /** Por módulo: dataSource (mock|core), offline */
  capabilities: Record<string, ModuleCapabilityEntry>;
  setup_status: SetupStatus;
  isPublished: boolean;
  lifecycle: RestaurantLifecycle;
  loading: boolean;
  error: string | null;
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
  installed_modules: [],
  active_modules: [],
  plan: "basic",
  capabilities: {},
  setup_status: {},
  isPublished: false,
  lifecycle: deriveLifecycle(null, false, false),
  loading: true,
  error: null,
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
  const isDockerCore =
    CONFIG.SUPABASE_URL.includes("localhost:3001") ||
    CONFIG.SUPABASE_URL.includes("127.0.0.1:3001");

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
    } catch (e) {
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
        : "demo";

    const installed_modules = installedIds.length > 0 ? installedIds : [];
    const active_modules = installed_modules.filter((id) =>
      ALL_SAFE_MODULES_DEV.includes(id),
    );
    const plan: PlanTier =
      installed_modules.length >= ALL_KNOWN_MODULES.length
        ? "premium"
        : "basic";
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
      capabilities,
      setup_status: setupSections,
      isPublished: mode === "active",
    };
  }

  /** Setup completo para demo: checklist "Pagamentos configurados" e demais aparecem ok no System Tree. */
  const DEMO_SETUP_STATUS: SetupStatus = {
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
    restaurantId: string,
  ): Promise<
    Pick<
      RestaurantRuntime,
      | "mode"
      | "productMode"
      | "installed_modules"
      | "active_modules"
      | "plan"
      | "capabilities"
      | "setup_status"
      | "isPublished"
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
        productMode: "demo",
        installed_modules: [],
        active_modules: [],
        plan: "basic",
        capabilities: {},
        setup_status: DEMO_SETUP_STATUS,
        isPublished: true,
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
      capabilities,
      setup_status: {},
      isPublished: true,
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

      const coreState = isDockerCore
        ? await fetchRuntimeStateFromCore(restaurantId).catch(() =>
            fetchRuntimeStateFallback(restaurantId),
          )
        : await fetchRuntimeStateFallback(restaurantId);

      const mode: RestaurantMode = coreState.mode;
      const rawSetup = coreState.setup_status || {};
      const setup_status: SetupStatus = isDevStableMode()
        ? DEMO_SETUP_STATUS
        : rawSetup;
      const installed_modules: string[] = coreState.installed_modules || [];
      const active_modules: string[] = isDevStableMode()
        ? installed_modules
        : coreState.active_modules ?? installed_modules;
      const plan = coreState.plan ?? "basic";
      const capabilities = coreState.capabilities ?? {};
      const productMode: ProductMode =
        coreState.productMode ?? resolveProductModeFromEnv();

      const isPublished = coreState.isPublished ?? mode === "active";

      const lifecycle = deriveLifecycle(restaurantId, isPublished, false);

      setRuntime({
        restaurant_id: restaurantId,
        mode,
        productMode,
        installed_modules,
        active_modules,
        plan,
        capabilities,
        setup_status,
        isPublished,
        lifecycle,
        loading: false,
        error: null,
      });

      console.log("[RestaurantRuntime] ✅ Estado carregado:", {
        restaurant_id: restaurantId,
        mode,
        installed_modules: installed_modules.length,
        active_modules: active_modules.length,
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
  }, [loadOrCreateRestaurant]);

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
            console.warn("[RestaurantRuntime] persistSetupStatus:", error);
          }
        }
        setRuntime((prev) => ({ ...prev, setup_status: newSetupStatus }));
      } catch (error) {
        console.error(
          "[RestaurantRuntime] Erro ao atualizar setup_status:",
          error,
        );
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

      setRuntime((prev) => ({
        ...prev,
        mode: "active",
        installed_modules: baseModules,
        active_modules,
        capabilities,
      }));

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
      setRuntime((prev) => ({ ...prev, productMode: mode }));
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

  // Carregar estado inicial
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      refresh();
    }
  }, [refresh]);

  const value: RestaurantRuntimeContextType = {
    runtime,
    refresh,
    updateSetupStatus,
    publishRestaurant,
    installModule,
    setProductMode,
  };

  // Expose pilot setter to window for B1 resilience (Demo cards bypass)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore
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
