type RunnerResult = { passed: boolean; error?: string };

interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
}

/**
 * Validates that the test order is visible/receivable by KDS.
 * Checks that the order exists with a status that KDS would display.
 */
export function kdsReceiveRunner(supabase: SupabaseClient): () => Promise<RunnerResult> {
  return async () => {
    try {
      const testOrderId = typeof window !== "undefined"
        ? (window as Record<string, unknown>).__chefiapp_test_order_id
        : undefined;

      if (!testOrderId) {
        return { passed: false, error: "No test order ID found — run tpv_order_create first" };
      }

      const { data, error } = await supabase
        .from("gm_orders")
        .select("id,status,order_type,table_number")
        .eq("id", testOrderId)
        .maybeSingle();

      if (error) {
        return { passed: false, error: `Failed to query order: ${error.message}` };
      }

      if (!data) {
        return { passed: false, error: "Test order not found in database" };
      }

      // KDS displays orders with status pending, preparing, ready
      const kdsVisibleStatuses = ["pending", "preparing", "ready"];
      if (!kdsVisibleStatuses.includes(data.status as string)) {
        return {
          passed: false,
          error: `Order status "${data.status}" is not visible on KDS (expected: ${kdsVisibleStatuses.join(", ")})`,
        };
      }

      return { passed: true };
    } catch (err) {
      return {
        passed: false,
        error: err instanceof Error ? err.message : "Unknown error checking KDS",
      };
    }
  };
}
