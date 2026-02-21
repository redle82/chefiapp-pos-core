// @ts-nocheck
import type { DockerCoreClientShape } from "../infra/dockerCoreFetchClient";

// PRESET DEFINITIONS
// Ideally this would live in a JSON file or DB, but for V1 we hardcode for speed.
const PRESETS: Record<string, any> = {
  CAFE_V1: {
    name: "Café & Bistro",
    categories: [
      {
        name: "Bebidas Quentes",
        items: [
          { name: "Café Expresso", price: 1.0 },
          { name: "Meia de Leite", price: 1.5 },
          { name: "Abatanado", price: 1.2 },
          { name: "Cappuccino", price: 2.5 },
        ],
      },
      {
        name: "Pastelaria",
        items: [
          { name: "Pastel de Nata", price: 1.2 },
          { name: "Croissant Simples", price: 1.5 },
          { name: "Torrada Mista", price: 2.5 },
        ],
      },
      {
        name: "Bebidas Frias",
        items: [
          { name: "Água 33cl", price: 1.0 },
          { name: "Coca Cola", price: 1.8 },
          { name: "Compal", price: 1.8 },
        ],
      },
    ],
  },
  BAR_V1: {
    name: "Bar & Pub",
    categories: [
      {
        name: "Cervejas",
        items: [
          { name: "Imperial", price: 1.5 },
          { name: "Caneca", price: 3.0 },
          { name: "Artesanal IPA", price: 4.5 },
        ],
      },
      {
        name: "Cocktails",
        items: [
          { name: "Mojito", price: 7.0 },
          { name: "Caipirinha", price: 6.5 },
          { name: "Gin Tónico", price: 8.0 },
        ],
      },
    ],
  },
  RESTAURANT_V1: {
    name: "Restaurante Típico",
    categories: [
      {
        name: "Entradas",
        items: [
          { name: "Pão e Azeitonas", price: 2.5 },
          { name: "Sopa do Dia", price: 3.0 },
        ],
      },
      {
        name: "Pratos Principais",
        items: [
          { name: "Bitoque", price: 12.0 },
          { name: "Bacalhau à Brás", price: 14.0 },
          { name: "Hambúrguer da Casa", price: 11.5 },
        ],
      },
      {
        name: "Bebidas",
        items: [
          { name: "Água", price: 1.5 },
          { name: "Refrigerante", price: 2.0 },
          { name: "Vinho Jarro 0.5L", price: 6.0 },
        ],
      },
    ],
  },
};

// Contexto para V2 (Owner's Mind) e V1 (Decisão)
export interface BootstrapContext {
  // Basic (Quick)
  businessType: string; // 'CAFE', 'BAR', 'RESTAURANT'
  serviceStyle: string[]; // 'TABLE', 'COUNTER', 'DELIVERY'
  operationSpeed: string; // 'FAST', 'BALANCED', 'DETAILED'

  // Guided (Questionnaire)
  mode?: "QUICK" | "GUIDED";
  cuisine?: string; // 'MEDITERRANEAN', 'ITALIAN', etc.
  priceTier?: "BUDGET" | "MID" | "PREMIUM";
  sellsAlcohol?: boolean;
  hasBreakfast?: boolean;
  hasMenuOfDay?: boolean;

  // Future
  deliveryApps?: string[];
}

import { getErrorMessage } from "../errors/ErrorMessages";
import { DbWriteGate } from "../governance/DbWriteGate";

/** CORE_FAILURE_MODEL: pass executeSafe (from useKernel()) to get failureClass on error. Local type; was from archived OrderProcessingService. */
export type ExecuteSafeFn = (req: any) => Promise<{
  ok: boolean;
  result?: any;
  reason?: string;
  error?: any;
  failureClass?: string;
}>;

export class MenuBootstrapService {
  constructor(private supabase: DockerCoreClientShape) {}

  /** CORE_FAILURE_MODEL: pass executeSafe (from useKernel()) to get failureClass on error */
  async injectPreset(
    restaurantId: string,
    presetKey: string,
    kernel: any,
    context?: BootstrapContext,
    executeSafe?: ExecuteSafeFn
  ) {
    if (!PRESETS[presetKey]) {
      throw new Error(`Preset ${presetKey} not found.`);
    }

    const preset = PRESETS[presetKey];
    console.log(
      `[MBE] Injecting preset: ${presetKey} for ${restaurantId}`,
      context
    );

    // 1. Log Source
    // We combine the Preset Data + The Operational Context into the payload
    // This preserves the "Mind of the Owner" decision for V2 analysis.
    const payload = {
      preset_data: preset,
      operational_context: context || {},
    };

    const { data: source, error: sourceError } = await DbWriteGate.insert(
      "MenuBootstrapService",
      "menu_bootstrap_sources",
      {
        restaurant_id: restaurantId,
        source_type: "PRESET",
        source_origin: presetKey,
        raw_payload: payload,
      },
      { tenantId: restaurantId }
    );

    if (sourceError) throw sourceError;

    // 2. Create Run Log (Gate)
    const { data: run, error: runError } = await DbWriteGate.insert(
      "MenuBootstrapService",
      "menu_bootstrap_runs",
      {
        source_id: source.id,
        status: "PENDING",
      },
      { tenantId: restaurantId }
    );

    if (runError) throw runError;

    try {
      let itemsCount = 0;
      let categoriesCount = 0;

      // 3. Execution (Normalization & Insertion via Core)
      // Note: In a real scenario, this should be transactional or an RPC.
      // For V1, we do efficient client-side calls.

      for (const cat of preset.categories) {
        // V1 PATCH: Alcohol Filter
        // If user explicitly said "No Alcohol" (Guided Mode), skip alcohol categories
        // Simple heuristic: check if category name contains "Vinho", "Cerveja", "Cocktail"
        if (context?.sellsAlcohol === false) {
          const isAlcohol = /vinho|cerveja|cocktail|beer|wine|imperial/i.test(
            cat.name
          );
          if (isAlcohol) continue;
        }

        // A. Create/Find Category (Via Gate - Structural Data)
        // Ideally checks if exists, but assuming empty start for now or duplicate name acceptable
        const { data: categoryData, error: catError } =
          await DbWriteGate.insert(
            "MenuBootstrapService",
            "gm_menu_categories",
            {
              restaurant_id: restaurantId,
              name: cat.name,
              is_visible: true,
              order: 0,
            },
            { tenantId: restaurantId }
          );

        if (catError) throw catError;
        categoriesCount++;

        // B. Create Items (Via SOVEREIGN KERNEL - Product Domain)
        // We use the Kernel to create products in the Sovereign Table (gm_products)
        // This ensures TPV (which reads gm_products) sees the items.

        if (!kernel && !executeSafe) {
          throw new Error(
            "Sovereignty Violation: Kernel or executeSafe required for Menu Bootstrap"
          );
        }

        for (const item of cat.items) {
          const productId = crypto.randomUUID();
          const payload = {
            entity: "PRODUCT",
            entityId: productId,
            event: "CREATE",
            restaurantId,
            payload: {
              name: item.name,
              priceCents: Math.round(item.price * 100),
              trackStock: false,
              stockQuantity: 0,
              categoryId: categoryData.id,
            },
          };

          if (executeSafe) {
            const res = await executeSafe(payload);
            if (!res.ok) {
              const err = new Error(
                getErrorMessage(res.error) || "Erro ao criar produto do preset."
              ) as Error & { failureClass?: string };
              err.failureClass = res.failureClass;
              throw err;
            }
          } else {
            await kernel.execute(payload);
          }
          itemsCount++;
        }
      }

      // 4. Update Restaurant Status (Gate)
      await DbWriteGate.update(
        "MenuBootstrapService",
        "gm_restaurants",
        {
          menu_status: "draft",
          menu_version: 1,
        },
        { id: restaurantId },
        { tenantId: restaurantId }
      );

      // 5. Success Log (Gate)
      await DbWriteGate.update(
        "MenuBootstrapService",
        "menu_bootstrap_runs",
        {
          status: "SUCCESS",
          completed_at: new Date().toISOString(),
          log: [{ message: "Preset injection successful" }],
        },
        { id: run.id },
        { tenantId: restaurantId }
      );

      // 6. Result Record (Gate)
      await DbWriteGate.insert(
        "MenuBootstrapService",
        "menu_bootstrap_results",
        {
          run_id: run.id,
          created_items_count: itemsCount,
          created_categories_count: categoriesCount,
          normalization_report: { method: "PRESET_DIRECT_MAP" },
        },
        { tenantId: restaurantId }
      );

      return { success: true, itemsCount, categoriesCount };
    } catch (error: any) {
      console.error("[MBE] Injection Failed:", error);

      await DbWriteGate.update(
        "MenuBootstrapService",
        "menu_bootstrap_runs",
        {
          status: "FAILED",
          completed_at: new Date().toISOString(),
          log: [{ message: error.message, error }],
        },
        { id: run.id },
        { tenantId: restaurantId }
      );

      throw error;
    }
  }
}
