import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

export type Action = {
    type: "CREATE_ALERT" | "SEND_EMAIL" | "WEBHOOK";
    alert_type?: string;
    severity?: string;
    message: string;
    metadata?: any;
};

/**
 * Executes a side-effect action based on the Rule Engine decision.
 * 
 * @param action The action configuration from the Rule.
 * @param context Contextual data (restaurant_id, rule_id, dynamic vars).
 */
export async function executeAction(
    action: Action,
    context: { restaurant_id: string; rule_id: string; silenceMinutes?: number }
) {
    console.log(`[Dispatcher] Executing ${action.type} for ${context.restaurant_id}`);

    // 1. Interpolate Message Variables (Simple {{var}} replacement)
    let finalMessage = action.message;
    if (context.silenceMinutes) {
        finalMessage = finalMessage.replace("{{threshold_minutes}}", context.silenceMinutes.toString());
        finalMessage = finalMessage.replace("{{silenceMinutes}}", context.silenceMinutes.toString());
    }

    // 2. Switch Action Type
    switch (action.type) {
        case "CREATE_ALERT":
            return await createAlert({
                restaurant_id: context.restaurant_id,
                rule_id: context.rule_id,
                alert_type: action.alert_type || "GENERIC",
                severity: action.severity || "info",
                message: finalMessage,
                metadata: { silenceMinutes: context.silenceMinutes }
            });

        case "SEND_EMAIL":
            // Placeholder for Resend/SendGrid
            console.log(`[Dispatcher] TODO: Send Email: ${finalMessage}`);
            return;

        default:
            console.warn(`[Dispatcher] Unknown action type: ${action.type}`);
    }
}

async function createAlert(payload: any) {
    const { error } = await supabase.from("alerts").insert(payload);
    if (error) console.error("[Dispatcher] Alert creation failed:", error);
    else console.log("[Dispatcher] Alert created successfully.");
}
