/**
 * 🧬 SYSTEMS REGISTRY
 *
 * Registry of all operational systems (Orders, Tables, CashRegister, Fiscal, Menu, Staff).
 * Each system has a health check and evidence files for Truth Scan.
 */

// LEGACY / LAB — blocked in Docker mode
import { supabase } from "../supabase";
import type { SystemDefinition, SystemId, SystemStatus } from "./types";

// ========================================
// SYSTEM DEFINITIONS
// ========================================

const SYSTEMS: Record<SystemId, SystemDefinition> = {
  orders: {
    id: "orders",
    name: "Order System",
    description: "Order creation, management, and lifecycle",
    evidenceFiles: [
      "src/core/sovereignty/OrderSovereignty.ts",
      "src/pages/TPV/context/OrderContextReal.tsx",
      "src/pages/AppStaff/PulseList.tsx",
    ],
    runtimeGuards: ["assertNoMock"],
    healthCheck: async () => {
      try {
        // Check if gm_orders table is accessible
        const { error } = await supabase
          .from("gm_orders")
          .select("id")
          .limit(1);

        return error ? "PARTIAL" : "OK";
      } catch {
        return "MISSING";
      }
    },
  },

  tables: {
    id: "tables",
    name: "Table System",
    description: "Table management and status tracking",
    evidenceFiles: [
      "src/core/sovereignty/TableSovereignty.ts",
      "src/pages/Settings/TableManager.tsx",
    ],
    runtimeGuards: [],
    healthCheck: async () => {
      try {
        const { error } = await supabase
          .from("gm_tables")
          .select("id")
          .limit(1);

        return error ? "PARTIAL" : "OK";
      } catch {
        return "MISSING";
      }
    },
  },

  cashRegister: {
    id: "cashRegister",
    name: "Cash Register System",
    description: "Shift management, open/close register, cash control",
    evidenceFiles: [
      "src/core/sovereignty/CashRegisterSovereignty.ts",
      "src/pages/TPV/context/CashRegisterContext.tsx",
    ],
    runtimeGuards: ["dbWriteGate"],
    healthCheck: async () => {
      try {
        const { error } = await supabase
          .from("gm_cash_sessions")
          .select("id")
          .limit(1);

        return error ? "PARTIAL" : "OK";
      } catch {
        return "MISSING";
      }
    },
  },

  fiscal: {
    id: "fiscal",
    name: "Fiscal System",
    description: "Invoice generation, tax compliance (InvoiceXpress)",
    evidenceFiles: [
      "src/fiscal-modules/FiscalService.ts",
      "src/fiscal-modules/InvoiceXpressAdapter.ts",
      "server/api/fiscal/InvoiceXpressAdapterServer.ts",
    ],
    runtimeGuards: ["assertNoMock"],
    healthCheck: async () => {
      try {
        // Check if fiscal config exists for current tenant
        // This is a simplified check - real check would validate credentials
        const { data } = await supabase
          .from("gm_restaurants")
          .select("fiscal_config")
          .limit(1)
          .single();

        if (data?.fiscal_config?.invoicexpress_api_key) {
          return "OK";
        }
        return data?.fiscal_config ? "CONFIGURED" : "PARTIAL";
      } catch {
        return "PARTIAL";
      }
    },
  },

  menu: {
    id: "menu",
    name: "Menu System",
    description: "Menu categories, products, and templates",
    evidenceFiles: ["src/pages/MenuBuilder/MenuBuilderMinimal.tsx"],
    runtimeGuards: [],
    healthCheck: async () => {
      try {
        const { error } = await supabase
          .from("gm_menu_categories")
          .select("id")
          .limit(1);

        return error ? "PARTIAL" : "OK";
      } catch {
        return "MISSING";
      }
    },
  },

  staff: {
    id: "staff",
    name: "Staff System",
    description: "Employee management and task assignment",
    evidenceFiles: [
      "src/pages/AppStaff/StaffModule.tsx",
      "src/pages/AppStaff/context/StaffContext.tsx",
    ],
    runtimeGuards: [],
    healthCheck: async () => {
      try {
        const { error } = await supabase
          .from("gm_employees")
          .select("id")
          .limit(1);

        return error ? "PARTIAL" : "OK";
      } catch {
        return "MISSING";
      }
    },
  },
};

// ========================================
// REGISTRY API
// ========================================

export const SystemsRegistry = {
  /**
   * Get all system definitions
   */
  getAll(): SystemDefinition[] {
    return Object.values(SYSTEMS);
  },

  /**
   * Get a specific system
   */
  get(id: SystemId): SystemDefinition | undefined {
    return SYSTEMS[id];
  },

  /**
   * Check health of a specific system
   */
  async check(id: SystemId): Promise<SystemStatus> {
    const system = SYSTEMS[id];
    if (!system) return "MISSING";

    try {
      return await system.healthCheck();
    } catch {
      return "MISSING";
    }
  },

  /**
   * Check health of all systems
   */
  async checkAll(): Promise<Record<SystemId, SystemStatus>> {
    const results: Partial<Record<SystemId, SystemStatus>> = {};

    for (const id of Object.keys(SYSTEMS) as SystemId[]) {
      results[id] = await this.check(id);
    }

    return results as Record<SystemId, SystemStatus>;
  },

  /**
   * Get evidence files for a system (for Truth Scan)
   */
  getEvidence(id: SystemId): string[] {
    return SYSTEMS[id]?.evidenceFiles ?? [];
  },

  /**
   * Get all evidence files (for Truth Scan)
   */
  getAllEvidence(): Record<SystemId, string[]> {
    const result: Partial<Record<SystemId, string[]>> = {};
    for (const [id, system] of Object.entries(SYSTEMS)) {
      result[id as SystemId] = system.evidenceFiles;
    }
    return result as Record<SystemId, string[]>;
  },
};
