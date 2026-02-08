/**
 * 🧬 SURFACE REGISTRY
 *
 * Registry of all surfaces (TPV, KDS, Staff, Panel, Web).
 * Each surface has a health check function.
 */

import type { SurfaceDefinition, SurfaceId, SurfaceStatus } from "./types";

// ========================================
// SURFACE DEFINITIONS
// ========================================

const SURFACES: Record<SurfaceId, SurfaceDefinition> = {
  panel: {
    id: "panel",
    name: "Dashboard",
    route: "/app/dashboard",
    description: "Central command center for restaurant management",
    requiredSystems: ["orders", "tables", "cashRegister"],
    isLauncher: false,
    healthCheck: async () => {
      // Panel is always ACTIVE if we're rendering
      return "ACTIVE";
    },
  },

  tpv: {
    id: "tpv",
    name: "TPV (Ponto de Venda)",
    route: "/app/tpv",
    description: "Point of sale terminal for order creation and payment",
    requiredSystems: ["orders", "menu", "cashRegister", "fiscal"],
    isLauncher: true,
    healthCheck: async () => {
      try {
        // TPV minimal: módulo atual de ponto de venda (TPV.tsx legado removido)
        const module = await import("../../pages/TPVMinimal/TPVMinimal");
        return module ? "ACTIVE" : "ERROR";
      } catch {
        return "ERROR";
      }
    },
  },

  kds: {
    id: "kds",
    name: "KDS (Kitchen Display)",
    route: "/app/kds",
    description: "Real-time kitchen order display",
    requiredSystems: ["orders"],
    isLauncher: true,
    healthCheck: async () => {
      try {
        const module = await import("../../pages/TPV/KDS/KitchenDisplay");
        return module ? "ACTIVE" : "ERROR";
      } catch {
        return "ERROR";
      }
    },
  },

  staff: {
    id: "staff",
    name: "AppStaff",
    route: "/app/staff",
    description: "Staff task management and waiter app",
    requiredSystems: ["orders", "tables", "staff"],
    isLauncher: true,
    healthCheck: async () => {
      try {
        const module = await import("../../pages/AppStaff/StaffModule");
        return module ? "ACTIVE" : "ERROR";
      } catch {
        return "ERROR";
      }
    },
  },

  web: {
    id: "web",
    name: "Public Web",
    route: "/public",
    description: "Public-facing menu and restaurant pages",
    requiredSystems: ["menu"],
    isLauncher: false,
    healthCheck: async () => {
      // Web is always active if menu exists
      return "ACTIVE";
    },
  },
};

// ========================================
// REGISTRY API
// ========================================

export const SurfaceRegistry = {
  /**
   * Get all surface definitions
   */
  getAll(): SurfaceDefinition[] {
    return Object.values(SURFACES);
  },

  /**
   * Get a specific surface
   */
  get(id: SurfaceId): SurfaceDefinition | undefined {
    return SURFACES[id];
  },

  /**
   * Check health of a specific surface
   */
  async check(id: SurfaceId): Promise<SurfaceStatus> {
    const surface = SURFACES[id];
    if (!surface) return "ERROR";

    try {
      return await surface.healthCheck();
    } catch {
      return "ERROR";
    }
  },

  /**
   * Check health of all surfaces
   */
  async checkAll(): Promise<Record<SurfaceId, SurfaceStatus>> {
    const results: Partial<Record<SurfaceId, SurfaceStatus>> = {};

    for (const id of Object.keys(SURFACES) as SurfaceId[]) {
      results[id] = await this.check(id);
    }

    return results as Record<SurfaceId, SurfaceStatus>;
  },

  /**
   * Get surfaces that require a specific system
   */
  getSurfacesRequiring(systemId: string): SurfaceDefinition[] {
    return Object.values(SURFACES).filter((s) =>
      s.requiredSystems.includes(systemId as any),
    );
  },
};
