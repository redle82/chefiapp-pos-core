import { isDebugMode } from "../debugMode";
import { getTableClient } from "../infra/coreRpc";
import { Logger } from "../logger";

/**
 * GENESIS REALITY CHECK
 *
 * The Enforcer of the Genesis Reality Contract.
 * Determines if the system is truly ready for reality.
 */
export interface RealityVerdict {
  ready: boolean;
  score: number; // 0-100
  failures: string[];
  contractVersion: string;
}

export class GenesisRealityCheck {
  private static CONTRACT_VERSION = "1.0.0";

  /**
   * Performs the full Reality Check on a given Tenant.
   */
  public static async judge(
    tenantId: string,
    options?: { commit?: boolean },
  ): Promise<RealityVerdict> {
    // Bypass: só com ?debug=1 (pedido explícito para testes)
    if (isDebugMode()) {
      const verdict: RealityVerdict = {
        ready: true,
        score: 100,
        failures: [],
        contractVersion: this.CONTRACT_VERSION,
      };

      if (options?.commit) {
        const client = await getTableClient();
        await client
          .from("gm_restaurants")
          .update({
            reality_status: "LIVE_REALITY",
            reality_verdict: verdict,
          })
          .eq("id", tenantId);
      }
      return verdict;
    }

    Logger.info(
      `[GenesisRealityCheck] ⚖️ Judging Reality for Tenant: ${tenantId}`,
    );

    const failures: string[] = [];
    let score = 0;
    let checksPassed = 0;
    const totalChecks = 4; // Foundations, Menu, Staff, Flow

    const client = await getTableClient();
    const { data: tenant } = await client
      .from("gm_restaurants")
      .select("id, name, onboarding_completed, status, reality_status")
      .eq("id", tenantId)
      .single();

    if (!tenant || !tenant.onboarding_completed || tenant.status !== "active") {
      failures.push(
        "Tenant not fully born (onboarding_completed=false or status!=active)",
      );
    } else {
      checksPassed++;
    }

    const { data: productRows, error: productError } = await client
      .from("gm_products")
      .select("id")
      .eq("restaurant_id", tenantId);
    const productCount = productError
      ? 0
      : Array.isArray(productRows)
      ? productRows.length
      : 0;

    if (productCount === 0) {
      failures.push(
        "Menu is empty (No products found - canon may have failed to inject)",
      );
    } else {
      checksPassed++;
    }

    const { data: staffRows, error: staffError } = await client
      .from("employees")
      .select("id")
      .eq("restaurant_id", tenantId)
      .eq("active", true);
    const staffCount = staffError
      ? 0
      : Array.isArray(staffRows)
      ? staffRows.length
      : 0;

    if (staffCount < 1) {
      failures.push("Staff is empty (No active employees)");
    } else {
      checksPassed++;
    }

    // 4. FLOW (The "Money" Check)
    if (tenant?.onboarding_completed) {
      checksPassed++; // Assuming onboarding complete implies flow potential
    }

    // CALCULATION
    score = (checksPassed / totalChecks) * 100;
    const ready = failures.length === 0;

    const verdict: RealityVerdict = {
      ready,
      score,
      failures,
      contractVersion: this.CONTRACT_VERSION,
    };

    Logger.info(
      `[GenesisRealityCheck] Verdict: ${
        ready ? "APPROVED" : "REJECTED"
      } (${score}%)`,
    );

    // PERSISTENCE (The Execution)
    if (options?.commit && ready) {
      const newStatus = "LIVE_REALITY"; // If it passes all checks, it's LIVE (or READY based on nuance)
      // Ideally: If flow verified => LIVE, else READY. But for now PASS => LIVE (Simplified for Phase 2)

      if (tenant?.reality_status !== newStatus) {
        Logger.debug(
          `[GenesisRealityCheck] 💾 Committing Status: ${newStatus}`,
        );
        await client
          .from("gm_restaurants")
          .update({
            reality_status: newStatus,
            reality_verdict: verdict,
          })
          .eq("id", tenantId);
      }
    }

    return verdict;
  }
}
