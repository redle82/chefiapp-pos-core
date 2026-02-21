import type { EffectContext } from "../../../../core-engine/effects";
import { getTableClient, invokeRpc } from "../infra/coreRpc";
import { Logger } from "../logger";
import { PaymentEngine } from "../tpv/PaymentEngine"; // Reuse logic for total calculation

/**
 * Cash Register Projection (Sovereign Write)
 *
 * Enforces Law 1 (Single Writer) by projecting Kernel Events to the Database.
 */

/**
 * Persist Open Cash Register
 * Maps 'OPEN' event to 'open_cash_register_atomic' RPC.
 */
export async function persistOpenCashRegister(
  context: EffectContext,
): Promise<void> {
  const { entityId, restaurantId, opening_balance_cents, opened_by, name } =
    context;

  Logger.info("[Sovereignty] Projecting Cash Register Open...", { entityId });

  // Call Atomic RPC — Core quando Docker (FINANCIAL_CORE_VIOLATION_AUDIT)
  const { data: result, error } = await invokeRpc("open_cash_register_atomic", {
    p_restaurant_id: restaurantId,
    p_name: name || "Caixa Principal",
    p_opened_by: opened_by,
    p_opening_balance_cents: opening_balance_cents,
  });

  if (error) {
    Logger.error("[Sovereignty] Open Projection Failed", error);
    // If already open, we might need to handle idempotency or throw
    if (error.message && error.message.includes("CASH_REGISTER_ALREADY_OPEN")) {
      Logger.warn(
        "[Sovereignty] Cash Register already open, skipping projection.",
      );
      return;
    }
    throw new Error(`Open Projection Failed: ${error.message}`);
  }

  Logger.info("[Sovereignty] Cash Register Opened Successfully", {
    id: (result as { id: string }).id,
  });
}

/**
 * Persist Close Cash Register
 * Maps 'CLOSE' event to database update.
 */
export async function persistCloseCashRegister(
  context: EffectContext,
): Promise<void> {
  const { entityId, restaurantId, closing_balance_cents, closed_by } = context;

  Logger.info("[Sovereignty] Projecting Cash Register Close...", { entityId });

  // 1. Calculate Total Sales (Reusing PaymentEngine logic for consistency)
  // NOTE: In a pure Event Sourced system, total_sales would be an accumulation of 'ORDER_PAID' events.
  // For Phase 16, we still calculate it from 'gm_payments' query to ensure accuracy during transition.
  const todayPayments = await PaymentEngine.getTodayPayments(restaurantId);
  const totalSalesCents = todayPayments.reduce(
    (sum, payment) => sum + payment.amountCents,
    0,
  );

  // 2. Perform Update via Gate (Sovereign Context)
  // We use "CashRegisterEngine" tag effectively, OR we could use "SovereignKernel" tag if we added it.
  // Since we are migrating, we can assume this projection acts AS the Engine in the new world.

  // Core quando Docker — Fase 4 (FINANCIAL_CORE_VIOLATION_AUDIT)
  const client = await getTableClient();
  const { data, error } = await client
    .from("gm_cash_registers")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: closed_by,
      closing_balance_cents: closing_balance_cents,
      total_sales_cents: totalSalesCents,
    })
    .eq("id", entityId)
    .eq("restaurant_id", restaurantId) // Safety
    .select()
    .single();

  if (error) {
    Logger.error("[Sovereignty] Close Projection Failed", error);
    throw new Error(`Close Projection Failed: ${error.message}`);
  }

  Logger.info("[Sovereignty] Cash Register Closed Successfully", {
    id: entityId,
    totalSales: totalSalesCents,
  });
}
