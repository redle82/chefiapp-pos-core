type RunnerResult = { passed: boolean; error?: string };

interface SupabaseClient {
  from: (table: string) => {
    update: (data: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    };
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
    delete: () => {
      eq: (column: string, value: unknown) => Promise<{
        error: { message: string } | null;
      }>;
    };
  };
}

/**
 * Validates order completion (ready -> delivered) and cleanup.
 * Also cleans up the test order after verification.
 */
export function orderCompleteRunner(supabase: SupabaseClient): () => Promise<RunnerResult> {
  return async () => {
    try {
      const testOrderId = typeof window !== "undefined"
        ? (window as Record<string, unknown>).__chefiapp_test_order_id
        : undefined;

      if (!testOrderId) {
        return { passed: false, error: "No test order ID found" };
      }

      // Transition: ready -> delivered
      const { error: err1 } = await supabase
        .from("gm_orders")
        .update({ status: "delivered", updated_at: new Date().toISOString() })
        .eq("id", testOrderId);

      if (err1) {
        return { passed: false, error: `Failed to mark as delivered: ${err1.message}` };
      }

      // Verify final state
      const { data, error: errCheck } = await supabase
        .from("gm_orders")
        .select("status")
        .eq("id", testOrderId)
        .maybeSingle();

      if (errCheck || data?.status !== "delivered") {
        return { passed: false, error: `Final state verification failed: expected "delivered", got "${data?.status}"` };
      }

      // Clean up test order
      await supabase.from("gm_orders").delete().eq("id", testOrderId);

      // Clear stored test order ID
      if (typeof window !== "undefined") {
        delete (window as Record<string, unknown>).__chefiapp_test_order_id;
      }

      return { passed: true };
    } catch (err) {
      return {
        passed: false,
        error: err instanceof Error ? err.message : "Unknown error in order completion test",
      };
    }
  };
}
