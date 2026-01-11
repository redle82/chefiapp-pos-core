import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async () => {
    try {
        // 1. Get Active Rules
        const { data: rules, error: rulesError } = await supabase
            .from("rules")
            .select("*")
            .eq("active", true);

        if (rulesError) throw rulesError;

        // 2. Get All Restaurants
        const { data: restaurants, error: restError } = await supabase
            .from("gm_restaurants")
            .select("id");

        if (restError) throw restError;

        const now = new Date();
        console.log(`[RuleEngine] Checking ${restaurants?.length} restaurants against ${rules?.length} rules.`);

        for (const restaurant of restaurants ?? []) {
            for (const rule of rules ?? []) {

                // 3. Check Cooldown
                const { data: lastAlert } = await supabase
                    .from("alerts")
                    .select("created_at")
                    .eq("restaurant_id", restaurant.id)
                    .eq("rule_id", rule.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const lastAlertAt = lastAlert?.created_at ? new Date(lastAlert.created_at) : null;
                if (lastAlertAt && (now.getTime() - lastAlertAt.getTime()) / 60000 < rule.cooldown_minutes) {
                    continue;
                }

                let triggered = false;
                let metadata: any = {};

                // 4. Evaluate Rule by Trigger Type
                if (rule.trigger.type === "TIME_SINCE_LAST_PULSE") {
                    const { data: lastPulse } = await supabase
                        .from("empire_pulses")
                        .select("created_at")
                        .eq("restaurant_id", restaurant.id)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    const lastPulseAt = lastPulse?.created_at ? new Date(lastPulse.created_at) : null;
                    const silenceMinutes = lastPulseAt
                        ? Math.floor((now.getTime() - lastPulseAt.getTime()) / 60000)
                        : 999999;

                    if (silenceMinutes > rule.trigger.threshold_minutes) {
                        triggered = true;
                        metadata = { silenceMinutes };
                    }
                }
                else if (rule.trigger.type === "PULSE_COUNT_WINDOW") {
                    const windowStart = new Date(now.getTime() - rule.trigger.window_minutes * 60000);

                    const { count, error: countError } = await supabase
                        .from("empire_pulses")
                        .select("*", { count: 'exact', head: true })
                        .eq("restaurant_id", restaurant.id)
                        .eq("type", rule.trigger.pulse_type)
                        .gte("created_at", windowStart.toISOString());

                    if (countError) {
                        console.error(`[RuleEngine] Error counting pulses for rule ${rule.id}:`, countError);
                        continue;
                    }

                    if (count !== null && count >= rule.trigger.threshold_count) {
                        triggered = true;
                        metadata = { count, window_minutes: rule.trigger.window_minutes };
                    }
                }

                // 5. Execute Action if Triggered
                if (triggered) {
                    const confidence = rule.confidence_level || 1.0;
                    const threshold = rule.action_threshold || 0.8;

                    console.log(`[RuleEngine] TRIGGER: Rule ${rule.id} for Restaurant ${restaurant.id} (Confidence: ${confidence})`);

                    // 5a. CREATE ALERT / EXTERNAL_LOOP (Always if triggered)
                    if (rule.action.type === "CREATE_ALERT" || rule.action.type === "AUTO_RECOVERY" || rule.action.type === "EXTERNAL_LOOP") {
                        const alertMessage = (rule.action.message || "")
                            .replace("{{threshold_minutes}}", rule.trigger.threshold_minutes?.toString() || "")
                            .replace("{{threshold_count}}", rule.trigger.threshold_count?.toString() || "")
                            .replace("{{count}}", metadata.count?.toString() || "");

                        await supabase.from("alerts").insert({
                            restaurant_id: restaurant.id,
                            rule_id: rule.id,
                            alert_type: rule.action.alert_type || rule.action.type,
                            severity: rule.action.severity,
                            message: alertMessage,
                            metadata: { ...metadata, confidence, rule_version: rule.version }
                        });

                        // 5b. FIRE EXTERNAL LOOP (If type is EXTERNAL_LOOP)
                        if (rule.action.type === "EXTERNAL_LOOP") {
                            console.log(`[RuleEngine] EXTERNAL_LOOP: Searching for connectors for Restaurant ${restaurant.id}`);

                            const { data: connectors } = await supabase
                                .from("external_connectors")
                                .select("*")
                                .eq("restaurant_id", restaurant.id)
                                .eq("active", true);

                            if (connectors && connectors.length > 0) {
                                for (const connector of connectors) {
                                    console.log(`[RuleEngine] EXTERNAL_LOOP: Triggering connector ${connector.name} (${connector.connector_type})`);

                                    // 🚀 EXECUTION: Trigger the Satellite Connector (Sintonizado)
                                    console.log(`[RuleEngine] EXTERNAL_LOOP: Invoking satellite_connector via SDK`);

                                    const { data: connResponse, error: invokeError } = await supabase.functions.invoke('satellite_connector', {
                                        body: {
                                            connector_id: connector.id,
                                            payload: {
                                                rule_id: rule.id,
                                                message: alertMessage,
                                                metadata: { ...metadata, confidence }
                                            }
                                        }
                                    });

                                    if (invokeError) {
                                        console.error(`[RuleEngine] EXTERNAL_LOOP: Satellite connector failed:`, invokeError.message);
                                    } else {
                                        console.log(`[RuleEngine] EXTERNAL_LOOP: Satellite connector successfully invoked:`, connResponse);
                                    }

                                    // Record the intent pulse (Audit)
                                    await supabase.from("empire_pulses").insert({
                                        restaurant_id: restaurant.id,
                                        type: "EXTERNAL_LOOP_TRIGGERED",
                                        payload: {
                                            rule_id: rule.id,
                                            connector_id: connector.id,
                                            message: alertMessage,
                                            metadata: { ...metadata, confidence }
                                        }
                                    });
                                }
                            } else {
                                console.log(`[RuleEngine] EXTERNAL_LOOP: No active connectors found for Restaurant ${restaurant.id}`);
                            }
                        }
                    }

                    // 5b. AUTO RECOVERY (Only if confidence >= threshold)
                    if (rule.action.type === "AUTO_RECOVERY" && confidence >= threshold) {
                        console.log(`[RuleEngine] ACTION: AUTO_RECOVERY for Restaurant ${restaurant.id}`);

                        await supabase.from("empire_pulses").insert({
                            restaurant_id: restaurant.id,
                            type: "SYSTEM_RECOVERY_MODE",
                            payload: {
                                cause_rule: rule.id,
                                cause_metadata: metadata,
                                confidence
                            }
                        });
                    }
                }
            }
        }

        return new Response(JSON.stringify({ status: "ok" }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });

    } catch (error) {
        console.error("[RuleEngine] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500
        });
    }
});
