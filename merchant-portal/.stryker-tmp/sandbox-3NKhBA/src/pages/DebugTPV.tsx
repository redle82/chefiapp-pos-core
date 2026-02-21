// @ts-nocheck
import { useState } from "react";
import { dockerCoreClient } from "../infra/docker-core/connection";
import {
  getInstalledDevice,
  setInstalledDevice,
} from "../core/storage/installedDeviceStorage";
import { VoiceCommandService } from "../core/voice/VoiceCommandService";
import { TPVHeader } from "../ui/design-system/domain/TPVHeader";

const SEED_CATEGORIES = [
  "Cocktails 🍸",
  "Entradas 🥗",
  "Principais 🍖",
  "Sobremesas 🍰",
  "Bebidas 🥤",
];
const SEED_ITEMS = [
  { name: "Mojito Classico", price: 850, cat: 0 },
  { name: "Negroni Sbagliato", price: 900, cat: 0 },
  { name: "Caipirinha Limão", price: 700, cat: 0 },
  { name: "Batata Frita Trufada", price: 650, cat: 1 },
  { name: "Carpaccio de Novilho", price: 1200, cat: 1 },
  { name: "Bifana à Sofia", price: 850, cat: 2 },
  { name: "Bacalhau Tuga", price: 1800, cat: 2 },
  { name: "Hamburguer Artesanal", price: 1400, cat: 2 },
  { name: "Cheesecake Frutos", price: 600, cat: 3 },
  { name: "Coca-Cola Zero", price: 250, cat: 4 },
];

import { useShiftLock } from "../core/shift/useShiftLock";
import styles from "./DebugTPV.module.css";

if (typeof window !== "undefined" && !getInstalledDevice()) {
  setInstalledDevice({
    device_id: "debug-tpv",
    restaurant_id: "00000000-0000-0000-0000-000000000100",
    module_id: "tpv",
    device_name: "Debug TPV",
  });
}

export const DebugTPV = () => {
  const { isShiftOpen } = useShiftLock();
  const [isListening, setIsListening] = useState(false);
  const [wakeWord, setWakeWord] = useState("");
  const [seedStatus, setSeedStatus] = useState<string>("");

  const handleSeed = async () => {
    if (
      !confirm(
        "This will inject ~50 test products into YOUR ACTIVE RESTAURANT. Continue?",
      )
    )
      return;
    setSeedStatus("Starting...");

    try {
      // DOCKER CORE: Usar restaurant ID fixo para desenvolvimento
      // Em produção, isso viria de autenticação ou seleção
      const restId = "00000000-0000-0000-0000-000000000100"; // Restaurant ID do Docker Core
      setSeedStatus(`Target: ${restId} ...`);

      // 2. Create Categories
      const catMap: Record<number, string> = {};
      for (let i = 0; i < SEED_CATEGORIES.length; i++) {
        const { data: cat, error: cErr } = await dockerCoreClient
          .from("gm_menu_categories")
          .insert({
            restaurant_id: restId,
            name: SEED_CATEGORIES[i],
            position: i,
          })
          .select("id")
          .single();

        if (cErr) console.error("Cat error", cErr);
        if (cat) catMap[i] = cat.id;
      }

      // 3. Create 50 Items (Looping through the seed list 5 times)
      let count = 0;
      const payload = [];
      for (let copy = 0; copy < 5; copy++) {
        for (const item of SEED_ITEMS) {
          if (!catMap[item.cat]) continue;
          payload.push({
            restaurant_id: restId,
            category_id: catMap[item.cat],
            name: `${item.name} ${copy ? "#" + (copy + 1) : ""}`,
            price_cents: item.price,
            available: true,
            status: "active",
          });
          count++;
        }
      }

      const { error: iErr } = await dockerCoreClient
        .from("gm_products")
        .insert(payload);
      if (iErr) throw iErr;

      setSeedStatus(`✅ Success! Created 5 categories and ${count} items.`);
      alert("Seed Complete. Please reload TPV or Menu.");
    } catch (err: any) {
      console.error(err);
      setSeedStatus(`❌ Error: ${err.message}`);
    }
  };

  // Simple mock of the hook logic
  const handleToggleVoice = () => {
    console.log("[DebugTPV] Toggling voice...");
    setIsListening(!isListening);

    if (!isListening) {
      console.log("[DebugTPV] Starting mock listening");
      // Try to use real service if available in browser
      try {
        // Use existing singleton or create new for debug
        const svc = new VoiceCommandService();
        svc.setWakeWord(wakeWord || undefined);

        console.log(
          "[DebugTPV] Service instantiated with Wake Word:",
          wakeWord || "(none)",
        );
      } catch (e) {
        console.error("[DebugTPV] Service error", e);
      }
    } else {
      console.log("[DebugTPV] Mock listening stopped");
    }
  };

  return (
    <div className={styles.page}>
      <h1 id="debug-title">Debug TPV Page Loaded</h1>
      <p>If you see this, routing is working.</p>
      <div className={styles.shiftBanner} data-open={isShiftOpen}>
        SHIFT STATUS: {isShiftOpen ? "OPEN (LOCKED)" : "CLOSED (FREE)"}
      </div>

      <div className={styles.section}>
        <h3>Component Preview:</h3>
        <TPVHeader
          operatorName="Dev User"
          terminalId="TERM-001"
          isOnline={true}
          restaurantName="Debug Kitchen"
          voiceControl={{
            isAvailable: true,
            isListening: isListening,
            onToggle: handleToggleVoice,
          }}
        />
      </div>

      <div className={styles.section}>
        <h3>Configuration:</h3>
        <div className={styles.configRow}>
          <label>Wake Word:</label>
          <input
            type="text"
            value={wakeWord}
            onChange={(e) => setWakeWord(e.target.value)}
            placeholder="e.g. Ok Computer"
            className={styles.configInput}
          />
          <span className={styles.configHint}>(Empty = No Wake Word)</span>
        </div>
      </div>

      <div className={styles.flightSection}>
        <h3>Flight Readiness (Pilot Protocol):</h3>
        <div className={styles.pilotSection}>
          <h4>Sofia Gastrobar Pilot</h4>
          <p className={styles.pilotDesc}>
            Protocol: 1. Deploy iPad | 2. Seed 50 Items | 3. Disconnect | 4.
            Service Simulation | 5. Reconnect
          </p>
          <button onClick={handleSeed} className={styles.seedButton}>
            🚀 Seed 50 Config Items
          </button>
          <div className={styles.statusRow}>
            <div className={styles.statusBadgeOnline}>
              Status: {navigator.onLine ? "ONLINE" : "OFFLINE (Sovereign)"}
            </div>
            <div className={styles.statusBadgeReady}>
              {seedStatus || "Ready"}
            </div>
          </div>

          <div className={styles.drillSection}>
            <p className={styles.drillDesc}>Drill Controls:</p>
            <button
              onClick={() => {
                const isOffline = confirm(
                  "Sovereign Mode Simulation:\nOK = Force Offline (Cut Wire)\nCancel = Restore Online",
                );
                //  - accessing private singleton or we need to cast import
                // Importing SyncEngine directly to call public method
                import("../core/sync/SyncEngine").then(({ SyncEngine }) => {
                  SyncEngine.simulateOffline(isOffline);
                  alert(
                    `Simulation: ${
                      isOffline ? "OFFLINE (Signal Cut)" : "ONLINE (Restored)"
                    }`,
                  );
                });
              }}
              className={styles.drillButton}
            >
              ✂️ Toggle Connection (Simulate)
            </button>
          </div>
        </div>

        <h3>Diagnostics:</h3>
        <ul>
          <li>
            Speech Recognition Support:{" "}
            {typeof window !== "undefined" &&
            (window.SpeechRecognition || window.webkitSpeechRecognition)
              ? "✅ Yes"
              : "❌ No"}
          </li>
          <li>
            Speech Synthesis Support:{" "}
            {typeof window !== "undefined" && window.speechSynthesis
              ? "✅ Yes"
              : "❌ No"}
          </li>
        </ul>

        <h3>Shift Management (Immutable Shift Verification):</h3>
        <div className={styles.shiftSection}>
          <div className={styles.shiftButtons}>
            <button
              onClick={async () => {
                try {
                  const { error } = await dockerCoreClient
                    .from("gm_cash_registers")
                    .insert({
                      restaurant_id: "00000000-0000-0000-0000-000000000100",
                      name: "Debug Register",
                      opening_balance_cents: 1000,
                      opened_by: "DEBUG_USER",
                      status: "open",
                      opened_at: new Date().toISOString(),
                    });
                  if (error) throw error;
                  alert("Shift Opened (Debug)!");
                  window.location.reload();
                } catch (e: any) {
                  alert("Error: " + e.message);
                }
              }}
              className={styles.openShiftBtn}
            >
              Open Shift
            </button>
            <button
              onClick={async () => {
                try {
                  // Find open shift
                  const { data: shifts } = await dockerCoreClient
                    .from("gm_cash_registers")
                    .select("id")
                    .eq("status", "open");
                  if (shifts && shifts.length > 0) {
                    const { error } = await dockerCoreClient
                      .from("gm_cash_registers")
                      .update({
                        status: "closed",
                        closed_at: new Date().toISOString(),
                        closing_balance_cents: 20000,
                        closed_by: "DEBUG_USER",
                      })
                      .eq("id", shifts[0].id);
                    if (error) throw error;
                  }
                  alert("Caixa fechado (Debug)!");
                  window.location.reload();
                } catch (e: any) {
                  console.error(e);
                  alert("Erro ao fechar caixa: " + e.message);
                }
              }}
              className={styles.closeShiftBtn}
            >
              Close Shift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
