import type { CommissioningTestId } from "../commissioningTypes";

type RunnerResult = { passed: boolean; error?: string };

interface SupabaseClient {
  from: (table: string) => {
    insert: (data: Record<string, unknown>) => {
      select: () => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
}

/**
 * Creates a test order in the TPV to validate the order creation pipeline.
 * Uses a special flag `is_test_order: true` so it can be filtered/cleaned later.
 */
export function createTestOrderRunner(
  supabase: SupabaseClient,
  restaurantId: string
): () => Promise<RunnerResult> {
  return async () => {
    try {
      const { data, error } = await supabase
        .from("gm_orders")
        .insert({
          restaurant_id: restaurantId,
          status: "pending",
          order_type: "dine_in",
          table_number: "TEST-001",
          is_test_order: true,
          items: [
            {
              name: "Pedido de Teste",
              quantity: 1,
              unit_price: 0,
              total: 0,
              notes: "Commissioning test — pode ser eliminado",
            },
          ],
          subtotal: 0,
          total: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { passed: false, error: `Failed to create test order: ${error.message}` };
      }

      if (!data) {
        return { passed: false, error: "Order created but no data returned" };
      }

      // Store order ID for subsequent tests
      if (typeof window !== "undefined") {
        (window as Record<string, unknown>).__chefiapp_test_order_id = data.id;
      }

      return { passed: true };
    } catch (err) {
      return {
        passed: false,
        error: err instanceof Error ? err.message : "Unknown error creating test order",
      };
    }
  };
}
