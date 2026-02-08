/**
 * CONTROL PLANE VERIFICATION SCRIPT
 *
 * Simulates a "Ghost Terminal" connecting to the Core.
 * Verifies:
 * 1. Registration
 * 2. Discovery
 * 3. Heartbeat
 * 4. Health Status
 */

import { ControlPlane } from "../core-engine/control-plane/ControlPlane";

async function runTest() {
  console.log("🚀 [TEST] Initiating Control Plane Verification...\n");

  const TENANT_ID = "test-tenant-verify-v1";
  const KDS_ID = "kds-ghost-01";

  // 1. REGISTER
  console.log("1️⃣  Registering Ghost KDS...");
  ControlPlane.registerTerminal({
    terminalId: KDS_ID,
    tenantId: TENANT_ID,
    type: "KDS",
    label: "Ghost Kitchen Display",
    version: "1.0.0-beta",
    capabilities: ["orders:read", "orders:bump"],
    registeredAt: new Date().toISOString(), // overwrites internal but required by type
  });

  const fleet = ControlPlane.getFleet(TENANT_ID);
  console.log(`   ✅ Fleet Size: ${fleet.length}`);
  if (fleet.length !== 1) throw new Error("Registry Failed");
  console.log(`   ✅ Terminal Found: ${fleet[0].label}\n`);

  // 2. CHECK INITIAL HEALTH (Should be OFFLINE as no pulse yet)
  console.log("2️⃣  Checking Initial Health...");
  const initialHealth = ControlPlane.getTerminalHealth(KDS_ID);
  console.log(`   Health: ${initialHealth.status}`);
  if (initialHealth.status !== "OFFLINE")
    console.warn("   ⚠️ Should be OFFLINE initially");
  console.log("");

  // 3. SEND HEARTBEAT
  console.log("3️⃣  Sending Pulse...");
  ControlPlane.sendPulse({
    terminalId: KDS_ID,
    timestamp: Date.now(),
    status: "IDLE",
    load: 0.1,
  });
  console.log("   ✅ Pulse Sent.\n");

  // 4. VERIFY ONLINE
  console.log("4️⃣  Verifying Vitality...");
  const liveHealth = ControlPlane.getTerminalHealth(KDS_ID);
  console.log(
    `   Health: ${liveHealth.status} (Last seen: ${liveHealth.lastSeenSecondsAgo}s ago)`,
  );

  if (liveHealth.status !== "ONLINE") throw new Error("Heartbeat Failed");
  console.log("   ✅ Terminal is ALIVE.\n");

  // 5. FLEET REPORT
  console.log("5️⃣  Full Fleet Report:");
  const report = ControlPlane.getFleetStatus(TENANT_ID);
  console.log(JSON.stringify(report, null, 2));

  console.log("\n✨ CONTROL PLANE VERIFICATION PASSED. ✨");
}

runTest().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
