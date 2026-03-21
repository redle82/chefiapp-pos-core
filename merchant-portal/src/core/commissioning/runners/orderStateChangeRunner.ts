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
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
}

/**
 * Validates that a test order can transition through states:
 * pending -> preparing -> ready
 */
export function orderStateChangeRunner(supabase: SupabaseClient): () => Promise<RunnerResult> {
  return async () => {
    try {
      const testOrderId = typeof window !== "undefined"
        ? (window as Record<string, unknown>).__chefiapp_test_order_id
        : undefined;

      if (!testOrderId) {
        return { passed: false, error: "No test order ID found" };
      }

      // Transition: pending -> preparing
      const { error: err1 } = await supabase
        .from("gm_orders")
        .update({ status: "preparing", updated_at: new Date().toISOString() })
        .eq("id", testOrderId);

      if (err1) {
        return { passed: false, error: `Failed to transition to preparing: ${err1.message}` };
      }

      // Verify state
      const { data: check1, error: errCheck1 } = await supabase
        .from("gm_orders")
        .select("status")
        .eq("id", testOrderId)
        .maybeSingle();

      if (errCheck1 || check1?.status !== "preparing") {
        return { passed: false, error: `State verification failed: expected "preparing", got "${check1?.status}"` };
      }

      // Transition: preparing -> ready
      const { error: err2 } = await supabase
        .from("gm_orders")
        .update({ status: "ready", updated_at: new Date().toISOString() })
        .eq("id", testOrderId);

      if (err2) {
        return { passed: false, error: `Failed to transition to ready: ${err2.message}` };
      }

      return { passed: true };
    } catch (err) {
      return {
        passed: false,
        error: err instanceof Error ? err.message : "Unknown error in state change test",
      };
    }
  };
}
