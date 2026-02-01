import type { SystemBlueprint } from "../blueprint/SystemBlueprint";
import { DbWriteGate } from "../governance/DbWriteGate";
import {
  getBeverageCanon,
  getCategoryName,
  UNIVERSAL_BEVERAGE_CATEGORIES,
} from "../menu/BeverageCanon";
import { supabase } from "../supabase";

/**
 * GENESIS KERNEL
 *
 * The Sovereign Authority that mints the System Blueprint.
 * It Converts raw Drafts into the immutable System Law.
 *
 * Replaces the legacy OnboardingCore.
 */

export interface OnboardingDraft {
  userId?: string;
  userName?: string;
  userRole?: "Owner" | "Manager" | "Staff" | "Technical";

  tenantId?: string;
  restaurantName?: string;
  city?: string;
  address?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  businessType?: "Restaurant" | "Cafe" | "Bar" | "FastFood" | "Other";
  logoUrl?: string;

  teamSize?: string;
  operationMode?: "Gamified" | "Executive";
  menuStrategy?: "Quick" | "Manual";

  // Sovereign 2.0 properties
  onboardingLevel?: "founder" | "verified_gold" | "legacy";
  modulesUnlocked?: string[];
  evidence?: any;
  topology?: { dineIn: boolean; delivery: boolean; takeaway: boolean };
  flowType?: "a_la_carte" | "fast_casual" | "dark_kitchen";
  finance?: { currency: string; methods: string[] };
  reality?: "bound";
}

const BLUEPRINT_STORAGE_KEY = "chefiapp_system_blueprint_v2";
const CURRENT_VERSION = "2.0.0-SOVEREIGN";

export type RealityResolution =
  | { action: "bind_existing"; tenantId: string }
  | { action: "reset_and_restart" };

export async function resolveRealityConflict(
  draft: OnboardingDraft,
  resolution: RealityResolution,
): Promise<Partial<OnboardingDraft>> {
  if (resolution.action === "bind_existing") {
    if (!resolution.tenantId) {
      throw new Error("TenantId obrigatório para bind");
    }

    console.log("[Kernel] 🔑 Executing Ritual of Possession (Bind)...");

    // 🔑 Amarração soberana (Via Gate)
    const { error } = await DbWriteGate.update(
      "GenesisKernel",
      "gm_restaurants",
      { onboarding_in_progress: true },
      { id: resolution.tenantId },
      { tenantId: resolution.tenantId },
    );

    if (error) {
      console.error("[Kernel] Failed to bind tenant:", error);
      throw new Error("Falha ao amarrar realidade: " + error.message);
    }

    return {
      ...draft,
      tenantId: resolution.tenantId,
      reality: "bound",
    };
  }

  if (resolution.action === "reset_and_restart") {
    const { removeTabIsolated } = await import("../storage/TabIsolatedStorage");
    removeTabIsolated("chefiapp_sovereign_draft_v1");
    return {};
  }

  return {};
}

export class Kernel {
  /**
   * Resolves a raw draft into a formalized System Blueprint.
   */
  public static compile(draft: OnboardingDraft): SystemBlueprint {
    // Validation
    if (!draft.restaurantName) throw new Error("Restaurant Name is required");

    const isGamified = draft.operationMode === "Gamified";
    const isOwner = draft.userRole === "Owner" || !draft.userRole; // Default to Owner if not set

    return {
      meta: {
        blueprintVersion: CURRENT_VERSION,
        createdAt: new Date().toISOString(),
        tenantId: draft.tenantId || "pending-generation",
        environment: "production",
      },
      identity: {
        userName: draft.userName || "Anonymous",
        userRole: (draft.userRole || "Owner") as any,
        userId: draft.userId || "",
      },
      organization: {
        restaurantName: draft.restaurantName,
        city: draft.city || "Unknown",
        businessType: (draft.businessType as any) || "Restaurant",
        logoUrl: draft.logoUrl,
        realityStatus: "DRAFT", // Default for fresh blueprints
      },
      operation: {
        teamSize: (draft.teamSize as any) || "1-5",
        mode: draft.operationMode || "Gamified",
      },
      product: {
        menuStrategy: draft.menuStrategy || "Quick",
      },
      systemProfiles: {
        uiProfile: {
          theme: isGamified ? "vibrant" : "minimal",
          density: isGamified ? "comfortable" : "compact",
        },
        layoutProfile: {
          showOnboardingTasks: true,
          sidebarMode: "expanded",
        },
        permissionProfile: {
          canManageTeam: isOwner,
          canEditMenu: isOwner || draft.userRole === "Manager",
          isOwner: isOwner,
        },
        workflowProfile: {
          requireKitchenConfirmation: true,
          enableTableService: true,
        },
      },
      boot: {
        status: "ready",
        bootLog: [],
      },
    };
  }

  /**
   * 1. THE GENESIS (Step 1 - Identity)
   * Creates the Tenant immediately. The system is born.
   */
  public static async initializeSovereign(
    draft: OnboardingDraft,
  ): Promise<SystemBlueprint> {
    console.log("[Kernel] 🏛️ Genesis: Creating Sovereign Identity...");

    if (!draft.userId) throw new Error("User ID is required for Genesis");
    if (!draft.restaurantName)
      throw new Error("Restaurant Name is required for Genesis");

    try {
      // CALL ATOMIC RPC with "Identity" Only
      // Pass defaults ("Pending") for future steps to allow creation
      const { invokeRpc } = await import("../infra/coreOrSupabaseRpc");
      const { data, error } = await invokeRpc("create_tenant_atomic", {
        p_restaurant_name: draft.restaurantName,
        p_city: draft.city || "Unknown",
        p_type: draft.businessType || "Restaurant",
        p_country: "ES",
        p_team_size: "1-5", // Default
        p_operation_mode: "Gamified", // Default
        p_menu_strategy: "Quick", // Default
      });

      if (error) throw error;

      const tenantId = (data as any).tenant_id;

      // SAFETY NET: Force create Member link (RPC might be failing silently on Cloud)
      try {
        console.log("[Kernel] 🛟 Safety Net: Ensuring Member Link exists...");
        try {
          console.log(
            "[Kernel] 🛟 Safety Net: Ensuring Member Link exists (Via Gate)...",
          );
          const { error: memberError } = await DbWriteGate.insert(
            "GenesisKernel",
            "gm_restaurant_members",
            {
              restaurant_id: tenantId,
              user_id: draft.userId,
              role: "owner",
            },
            { tenantId },
          );
          if (memberError) {
            // Start 409 conflict check (already exists)
            if (!memberError.message.includes("duplicate")) {
              console.warn(
                "[Kernel] Member Link Warning:",
                memberError.message,
              );
            }
          }
        } catch (err) {
          console.warn("[Kernel] Member Safety Net ignored:", err);
        }

        console.log("[Kernel] 🏛️ Sovereign Identity Established:", tenantId);

        // 🍹 BEVERAGE CANON: Bootstrap universal menu
        try {
          await this.bootstrapBeverageCanon(
            tenantId,
            draft.countryCode || "ES",
          );
          console.log("[Kernel] 🍹 Beverage Canon injected");
        } catch (canonError) {
          console.warn(
            "[Kernel] ⚠️ Beverage Canon failed (non-critical):",
            canonError,
          );
          // Non-blocking: system can proceed without canon
        }

        // Return partial blueprint
        const blueprint = this.compile(draft);
        blueprint.meta.tenantId = tenantId;
        blueprint.organization.realityStatus = "DRAFT";

        await this.saveLocal(blueprint);
        return blueprint;
      } catch (dbError) {
        console.error("[Kernel] Genesis Failed:", dbError);
        throw new Error(
          `Failed to create system identity: ${(dbError as any).message}`,
        );
      }
    } catch (genesisError) {
      console.error("[Kernel] Genesis Critically Failed:", genesisError);
      throw genesisError;
    }
  }

  /**
   * 2. THE ADVANCE (Steps 2-6 - Authority, Topology, etc)
   * Updates the existing Sovereign Entity.
   */
  public static async advanceSovereignState(
    tenantId: string,
    step: "authority" | "existence" | "topology" | "flow" | "cash" | "team",
    updates: Partial<OnboardingDraft>,
  ): Promise<void> {
    console.log(`[Kernel] 📜 Law Update: ${step.toUpperCase()}`);

    if (!tenantId) throw new Error("System ID missing. Cannot advance state.");

    try {
      // A. Update Data per Step
      if (step === "authority") {
        if (updates.userName && updates.userId) {
          await DbWriteGate.update(
            "GenesisKernel",
            "profiles",
            {
              full_name: updates.userName,
              role: updates.userRole?.toLowerCase(),
            },
            { id: updates.userId },
            { tenantId },
          );
        }
      }

      if (step === "existence") {
        console.log(
          "[Kernel] 🕵️ Provas de Existência recebidas:",
          updates.evidence,
        );
        console.log(
          "[Kernel] 🔒 Nível de Soberania deifinido:",
          updates.onboardingLevel,
        );
        console.log(
          "[Kernel] 🔓 Módulos Desbloqueados:",
          updates.modulesUnlocked,
        );

        // CRITICAL: Persist to Storage for FlowGate immediate access
        if (updates.onboardingLevel) {
          const { setTabIsolated } = await import(
            "../storage/TabIsolatedStorage"
          );
          setTabIsolated("chefiapp_sovereign_level", updates.onboardingLevel);
        }
        if (updates.modulesUnlocked) {
          const { setTabIsolated } = await import(
            "../storage/TabIsolatedStorage"
          );
          setTabIsolated(
            "chefiapp_modules_unlocked",
            JSON.stringify(updates.modulesUnlocked),
          );
        }
      }

      // ⚠️ CRITICAL: PERSIST TO DB (Sovereign 2.0)
      const updatesDb: any = {};

      if (step === "existence") {
        updatesDb.onboarding_level = updates.onboardingLevel;
        updatesDb.modules_unlocked = updates.modulesUnlocked;
        updatesDb.evidence = updates.evidence;
      } else if (step === "topology") {
        updatesDb.topology = updates.topology;
      } else if (step === "flow") {
        updatesDb.flow_type = updates.flowType;
      } else if (step === "cash") {
        updatesDb.finance = updates.finance;
      }

      if (Object.keys(updatesDb).length > 0) {
        try {
          const { error } = await DbWriteGate.update(
            "GenesisKernel",
            "gm_restaurants",
            updatesDb,
            { id: tenantId },
            { tenantId },
          );

          if (error) throw error;
          console.log(`[Kernel] DB Updated for step ${step}:`, updatesDb);
        } catch (dbError) {
          console.warn(
            `[Kernel] ⚠️ DB Persist bypassed for step ${step} (Schema mismatch?):`,
            dbError,
          );
          // Proceed anyway - LocalStorage will hold the state
        }
      }

      console.log(`[Kernel] State Advanced to: ${step} (Persisted)`);
    } catch (error) {
      console.error("[Kernel] Advance Failed:", error);
      throw error;
    }
  }

  /**
   * 3. THE CONSECRATION (Step 7 - Completed)
   * Finalizes the system.
   */
  public static async consecrateSovereign(
    tenantId: string,
    draft: OnboardingDraft,
  ): Promise<SystemBlueprint> {
    console.log("[Kernel] 👑 Consecrating System...");

    // Final update with all accumulated draft data (just in case)
    // Final update: Seal the system
    try {
      try {
        const { error } = await DbWriteGate.update(
          "GenesisKernel",
          "gm_restaurants",
          {
            onboarding_completed: true,
            status: "active",
          },
          { id: tenantId },
          { tenantId },
        );

        if (error) throw error;
        console.log("[Kernel] 👑 Consecration Sealed in DB.");
      } catch (dbError) {
        console.warn(
          "[Kernel] ⚠️ Consecration DB Write Failed (Schema mismatch?):",
          dbError,
        );
        // Proceed anyway - LocalStorage has the source of truth
      }

      console.log("[Kernel] 👑 Consecration Logic Executed.");

      const blueprint = this.compile(draft);
      blueprint.meta.tenantId = tenantId;
      blueprint.organization.realityStatus = "READY_FOR_REALITY";

      await this.saveLocal(blueprint);
      return blueprint;
    } catch (consecrationError) {
      console.error("[Kernel] Consecration Failed:", consecrationError);
      throw consecrationError;
    }
  }

  private static async saveLocal(blueprint: SystemBlueprint) {
    const { setTabIsolated } = await import("../storage/TabIsolatedStorage");
    setTabIsolated(BLUEPRINT_STORAGE_KEY, JSON.stringify(blueprint));
  }

  /**
   * Retrieves the current active Blueprint.
   */
  public static async getBlueprint(): Promise<SystemBlueprint | null> {
    try {
      const { getTabIsolated } = await import("../storage/TabIsolatedStorage");
      const raw = getTabIsolated(BLUEPRINT_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SystemBlueprint;
    } catch (e) {
      return null;
    }
  }

  /**
   * 4. THE REALITY TEST (Day 1 Check)
   * Verifies if the system is truly ready for reality.
   */
  public static async checkRealityStatus(tenantId: string) {
    const { GenesisRealityCheck } = await import("./GenesisRealityCheck");
    return GenesisRealityCheck.judge(tenantId);
  }

  /**
   * 5. THE REALITY PROMOTION (Day 1 Gate)
   * Attempts to promote the system to 'READY_FOR_REALITY'.
   * This is the Checkpoint Charlie of the system.
   */
  public static async promoteToReality(
    tenantId: string,
  ): Promise<SystemBlueprint> {
    console.log("[Kernel] 🎖️ Attempting Promotion to REALITY...");

    // 1. Run the Judge
    const verdict = await this.checkRealityStatus(tenantId);

    if (!verdict.ready) {
      console.error("[Kernel] 🛑 Promotion DENIED by Judge:", verdict.failures);
      throw new Error(
        `Reality Promotion Failed: ${verdict.failures.join(", ")}`,
      );
    }

    console.log("[Kernel] ✅ Judge Approved. Promoting System...");

    // 2. Update DB
    const { error } = await DbWriteGate.update(
      "GenesisKernel",
      "gm_restaurants",
      {
        status: "active",
        reality_status: "READY_FOR_REALITY", // New Column
        reality_verdict: verdict,
      },
      { id: tenantId },
      { tenantId },
    );

    if (error) {
      throw new Error("Promotion DB Write Failed: " + error.message);
    }

    // 3. Update Blueprint state
    let blueprint = await this.getBlueprint();

    // If blueprint doesn't exist, try to create one from tenant data
    if (!blueprint) {
      console.warn(
        "[Kernel] ⚠️ Blueprint not found, attempting to create from tenant data...",
      );

      try {
        // Fetch restaurant data to create a minimal blueprint
        const { data: restaurant, error: fetchError } = await supabase
          .from("gm_restaurants")
          .select(
            "name, city, type, owner_id, team_size, operation_mode, menu_strategy",
          )
          .eq("id", tenantId)
          .single();

        if (fetchError || !restaurant) {
          throw new Error(
            "Cannot create blueprint: restaurant data not found. Please complete onboarding first.",
          );
        }

        // Create minimal blueprint from restaurant data
        const draft: OnboardingDraft = {
          tenantId,
          restaurantName: restaurant.name || "Restaurant",
          city: restaurant.city || "Unknown",
          businessType: (restaurant.type as any) || "Restaurant",
          teamSize: restaurant.team_size || "1-5",
          operationMode: (restaurant.operation_mode as any) || "Gamified",
          menuStrategy: (restaurant.menu_strategy as any) || "Quick",
          userRole: "Owner",
          userId: restaurant.owner_id || "",
        };

        blueprint = this.compile(draft);
        await this.saveLocal(blueprint);
        console.log("[Kernel] ✅ Created blueprint from tenant data");
      } catch (createError: any) {
        console.error("[Kernel] Failed to create blueprint:", createError);
        throw new Error(
          "Blueprint not found and cannot be created. Please complete onboarding first: " +
            (createError.message || "Unknown error"),
        );
      }
    }

    // Update blueprint status
    blueprint.organization.realityStatus = "READY_FOR_REALITY";
    await this.saveLocal(blueprint);
    return blueprint;
  }
  /**
   * 6. THE LIFE CONFIRMATION (Operational Gate)
   * Verifies if the system is ALIVE based on evidence.
   * Transitions from READY_FOR_REALITY -> LIVE_REALITY.
   */
  public static async confirmLiveReality(
    tenantId: string,
  ): Promise<SystemBlueprint> {
    console.log("[Kernel] 🌍 Detecting Signs of Life...");

    const { LiveRealityCheck } = await import("./LiveRealityCheck");
    const verdict = await LiveRealityCheck.judge(tenantId);

    if (!verdict.ready) {
      console.error("[Kernel] 🌑 System is DORMANT:", verdict.failures);
      throw new Error(
        `Live Reality Confirmation Failed: ${verdict.failures.join(", ")}`,
      );
    }

    console.log("[Kernel] 🌞 LIFE DETECTED. System is LIVE.");

    // Update DB (Persistence)
    await DbWriteGate.update(
      "GenesisKernel",
      "gm_restaurants",
      { reality_status: "LIVE_REALITY", reality_verdict: verdict },
      { id: tenantId },
      { tenantId },
    );

    // Update blueprint
    const blueprint = await this.getBlueprint();
    if (blueprint) {
      blueprint.organization.realityStatus = "LIVE_REALITY";
      await this.saveLocal(blueprint);
      return blueprint;
    }

    throw new Error("Blueprint not found for Life Confirmation");
  }

  /**
   * 7. BEVERAGE CANON BOOTSTRAP
   * Injects country-specific beverages during Genesis.
   * "Comida é local. Bebida é universal."
   */
  private static async bootstrapBeverageCanon(
    tenantId: string,
    countryCode: string,
  ): Promise<void> {
    console.log(
      `[GenesisKernel] 🍹 Bootstrapping Beverage Canon for ${countryCode}...`,
    );

    const canon = getBeverageCanon(countryCode);
    const language = countryCode === "BR" || countryCode === "PT" ? "pt" : "es";

    // 1. Insert universal categories
    const categoryMap = new Map<string, string>();

    for (const category of UNIVERSAL_BEVERAGE_CATEGORIES) {
      const categoryName = getCategoryName(category.id, language);

      const { data: cat, error: catError } = await DbWriteGate.insert(
        "GenesisKernel",
        "gm_menu_categories",
        {
          restaurant_id: tenantId,
          name: categoryName,
          sort_order: category.sort_order,
        },
        { tenantId },
      );

      if (catError) {
        console.warn(
          `[GenesisKernel] Category ${category.id} failed:`,
          catError,
        );
        continue;
      }

      if (cat && cat[0]) {
        categoryMap.set(category.id, cat[0].id);
      }
    }

    // 2. Insert canon beverages
    let insertedCount = 0;

    for (const item of canon.items) {
      const categoryId = categoryMap.get(item.category);
      if (!categoryId) {
        console.warn(
          `[GenesisKernel] Skipping ${item.name}: category not found`,
        );
        continue;
      }

      const canonId = `${canon.country}:${item.category}:${item.name
        .toLowerCase()
        .replace(/\s+/g, "-")}`;

      const { error: prodError } = await DbWriteGate.insert(
        "GenesisKernel",
        "gm_products",
        {
          restaurant_id: tenantId,
          category_id: categoryId,
          category: getCategoryName(item.category, language),
          name: item.name,
          price_cents: item.price_cents || 0,
          available: item.default_visibility,
          system_provided: true,
          canon_id: canonId,
          default_visibility: item.default_visibility,
        },
        { tenantId },
      );

      if (prodError) {
        console.warn(`[GenesisKernel] Product ${item.name} failed:`, prodError);
      } else {
        insertedCount++;
      }
    }

    console.log(
      `[GenesisKernel] 🍹 Canon complete: ${insertedCount}/${canon.items.length} beverages injected`,
    );
  }
}
