import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { evaluateProvisioning, RestaurantProvisioningState } from "./index.ts";

const baseState: RestaurantProvisioningState = {
  id: "test-1",
  site_enabled: true,
  site_template: "hero",
  site_domain: null,
  site_status: "off",
  site_last_error: null,
  tables_enabled: true,
  tables_count: 5,
  qr_enabled: true,
  qr_style: "classic",
  delivery_enabled: true,
  delivery_channels: ["ifood"],
  hardware_profile: { printer: "epson" },
  provisioning_flags: null,
};

Deno.test("provisions all targets on first run", () => {
  const result = evaluateProvisioning(baseState);
  assertEquals(result.flags.site_provisioned, true);
  assertEquals(result.flags.tables_seeded, true);
  assertEquals(result.flags.qr_generated, true);
  assertEquals(result.flags.delivery_configured, true);
  assertEquals(result.flags.hardware_registered, true);
  assert(result.logs.length >= 4);
});

Deno.test("idempotent when already provisioned", () => {
  const seededState: RestaurantProvisioningState = {
    ...baseState,
    provisioning_flags: {
      site_provisioned: true,
      tables_seeded: true,
      qr_generated: true,
      delivery_configured: true,
      hardware_registered: true,
    },
    site_status: "live",
  };

  const result = evaluateProvisioning(seededState);
  assertEquals(result.logs.length, 0);
  assertEquals(result.flags.site_provisioned, true);
  assertEquals(Object.keys(result.updates).length, 1); // site_status normalization
  assertEquals(result.updates.site_status, "live");
});

Deno.test("disabling site resets status and flags", () => {
  const disabledState: RestaurantProvisioningState = {
    ...baseState,
    site_enabled: false,
    provisioning_flags: { site_provisioned: true },
  };

  const result = evaluateProvisioning(disabledState);
  assertEquals(result.flags.site_provisioned, false);
  assertEquals(result.updates.site_status, "off");
});
