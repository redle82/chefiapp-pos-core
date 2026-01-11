import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type ProvisioningFlags = {
  site_provisioned?: boolean;
  tables_seeded?: boolean;
  qr_generated?: boolean;
  delivery_configured?: boolean;
  hardware_registered?: boolean;
  notes?: Record<string, unknown>;
};

export type RestaurantProvisioningState = {
  id: string;
  site_enabled: boolean;
  site_template: string | null;
  site_domain: string | null;
  site_status: "off" | "queued" | "provisioning" | "live" | "error";
  site_last_error: string | null;
  tables_enabled: boolean;
  tables_count: number | null;
  qr_enabled: boolean;
  qr_style: string | null;
  delivery_enabled: boolean;
  delivery_channels: unknown;
  hardware_profile: Record<string, unknown> | null;
  provisioning_flags: ProvisioningFlags | null;
};

type ProvisioningDecision = {
  updates: Record<string, unknown>;
  flags: ProvisioningFlags;
  logs: string[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const restaurantId: string | undefined = payload?.restaurant_id ?? payload?.record?.id;
    const force: boolean = !!payload?.force;

    if (!restaurantId) {
      return respond(400, { error: "restaurant_id is required" });
    }

    const { data, error } = await supabase
      .from("gm_restaurants")
      .select(
        "id, site_enabled, site_template, site_domain, site_status, site_last_error, tables_enabled, tables_count, qr_enabled, qr_style, delivery_enabled, delivery_channels, hardware_profile, provisioning_flags"
      )
      .eq("id", restaurantId)
      .single();

    if (error || !data) {
      console.error("[Provisioner] Fetch failed", error);
      return respond(404, { error: "restaurant not found" });
    }

    const decision = evaluateProvisioning(data as RestaurantProvisioningState, force);

    if (Object.keys(decision.updates).length === 0) {
      return respond(200, { message: "no-op", flags: decision.flags, logs: decision.logs });
    }

    const { error: updateError } = await supabase
      .from("gm_restaurants")
      .update({
        ...decision.updates,
        provisioning_flags: decision.flags,
        provisioning_updated_at: new Date().toISOString(),
      })
      .eq("id", restaurantId);

    if (updateError) {
      console.error("[Provisioner] Update failed", updateError);
      return respond(500, { error: updateError.message, logs: decision.logs });
    }

    return respond(200, { message: "ok", flags: decision.flags, logs: decision.logs });
  } catch (err: unknown) {
    console.error("[Provisioner] Unexpected", err);
    const message = err instanceof Error ? err.message : "unknown";
    return respond(500, { error: message });
  }
});

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function evaluateProvisioning(
  state: RestaurantProvisioningState,
  force = false
): ProvisioningDecision {
  const flags: ProvisioningFlags = {
    site_provisioned: false,
    tables_seeded: false,
    qr_generated: false,
    delivery_configured: false,
    hardware_registered: false,
    ...(state.provisioning_flags || {}),
  };

  const updates: Record<string, unknown> = {};
  const logs: string[] = [];

  // A) Site provisioning
  if (state.site_enabled) {
    updates.site_status = "live";
    if (force || !flags.site_provisioned) {
      flags.site_provisioned = true;
      flags.notes = { ...flags.notes, site: `template:${state.site_template || "default"}` };
      logs.push("site_provisioned");
    }
  } else {
    updates.site_status = "off";
    flags.site_provisioned = false;
  }

  // B) Tables seeding (idempotent)
  const tablesCount = state.tables_count ?? 0;
  if (state.tables_enabled && tablesCount > 0) {
    if (force || !flags.tables_seeded) {
      flags.tables_seeded = true;
      flags.notes = { ...flags.notes, tables: tablesCount };
      logs.push(`tables_seeded:${tablesCount}`);
    }
  } else {
    flags.tables_seeded = false;
  }

  // C) QR generation
  if (state.qr_enabled) {
    if (force || !flags.qr_generated) {
      flags.qr_generated = true;
      flags.notes = { ...flags.notes, qr_style: state.qr_style || "default" };
      logs.push("qr_generated");
    }
  } else {
    flags.qr_generated = false;
  }

  // D) Delivery configuration
  if (state.delivery_enabled) {
    if (force || !flags.delivery_configured) {
      flags.delivery_configured = true;
      flags.notes = { ...flags.notes, delivery_channels: state.delivery_channels };
      logs.push("delivery_configured");
    }
  } else {
    flags.delivery_configured = false;
  }

  // E) Hardware registration
  const hasHardware = state.hardware_profile && Object.keys(state.hardware_profile).length > 0;
  if (hasHardware) {
    if (force || !flags.hardware_registered) {
      flags.hardware_registered = true;
      flags.notes = { ...flags.notes, hardware: state.hardware_profile };
      logs.push("hardware_registered");
    }
  } else {
    flags.hardware_registered = false;
  }

  return { updates, flags, logs };
}
