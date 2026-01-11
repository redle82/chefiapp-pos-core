import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 🛰️ SATELLITE CONNECTOR (Hardened)
// Transforms internal stability signals into external actions.

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let connectorId = null;
    let restaurantId = null;

    try {
        const { connector_id, payload } = await req.json();

        if (!connector_id || !payload) {
            throw new Error("Missing connector_id or payload");
        }

        // 1. Fetch Connector Details
        const { data: connector, error: connError } = await supabase
            .from("external_connectors")
            .select("*")
            .eq("id", connector_id)
            .single();

        if (connError || !connector) {
            throw new Error(`Connector not found: ${connError?.message}`);
        }

        connectorId = connector.id;
        restaurantId = connector.restaurant_id;

        if (!connector.active) {
            return new Response(JSON.stringify({ status: "skipped", reason: "connector_inactive" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            });
        }

        // 2. Prepare Payload
        const timestamp = new Date().toISOString();
        let finalPayload: any = { ...payload, timestamp };
        let eventName = 'generic_trigger';

        if (connector.connector_type === 'whatsapp_webhook' || connector.connector_type === 'marketing_api') {
            eventName = 'stability_momentum';
            finalPayload = {
                event: eventName,
                message: payload.message || "Momentum de Estabilidade Detectado!",
                restaurant_id: connector.restaurant_id,
                confidence: payload.metadata?.confidence || 1.0,
                metrics: payload.metadata || {},
                timestamp
            };
        }

        const bodyToSign = JSON.stringify(finalPayload);

        // 3. HMAC Signature
        let signature = '';
        if (connector.webhook_secret) {
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                "raw",
                encoder.encode(connector.webhook_secret),
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
            );
            const signatureBuffer = await crypto.subtle.sign(
                "HMAC",
                key,
                encoder.encode(bodyToSign)
            );
            signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
        }

        // 4. Execution (The Outgoing Webhook)
        const startTime = performance.now();
        let response;
        let fetchError = null;

        try {
            response = await fetch(connector.webhook_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-ChefIApp-Signature': signature,
                    'X-ChefIApp-Timestamp': timestamp,
                    'User-Agent': 'ChefIApp-Satellite-Connector/1.1'
                },
                body: bodyToSign
            });
        } catch (e) {
            fetchError = e.message;
        }

        const duration = Math.round(performance.now() - startTime);

        // 5. Log Execution Result (Always record, even on failure)
        await supabase.from("empire_pulses").insert({
            restaurant_id: restaurantId,
            type: "EXTERNAL_LOOP_EXECUTED",
            payload: {
                connector_id: connectorId,
                connector_type: connector.connector_type,
                event: eventName,
                success: response ? response.ok : false,
                status: response ? response.status : null,
                error: fetchError || (response && !response.ok ? await response.text() : null),
                duration_ms: duration
            }
        });

        if (fetchError || (response && !response.ok)) {
            throw new Error(fetchError || `External service responded with ${response?.status}`);
        }

        return new Response(JSON.stringify({
            status: "success",
            duration_ms: duration,
            external_status: response?.status
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
        });

    } catch (error) {
        console.error(`[SatelliteConnector] Error:`, error.message);

        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: error.message.includes("not found") ? 404 : 400
        });
    }
});
