import { useState } from "react";
import { dockerCoreClient } from "../core-boundary/docker-core/connection";
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

export const DebugTPV = () => {
  const { isShiftOpen } = useShiftLock();
  const [isListening, setIsListening] = useState(false);
  const [wakeWord, setWakeWord] = useState("");
  const [svcInstance, setSvcInstance] = useState<VoiceCommandService | null>(
    null
  );
  const [seedStatus, setSeedStatus] = useState<string>("");

  const handleSeed = async () => {
    if (
      !confirm(
        "This will inject ~50 test products into YOUR ACTIVE RESTAURANT. Continue?"
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
        setSvcInstance(svc);

        console.log(
          "[DebugTPV] Service instantiated with Wake Word:",
          wakeWord || "(none)"
        );
      } catch (e) {
        console.error("[DebugTPV] Service error", e);
      }
    } else {
      console.log("[DebugTPV] Mock listening stopped");
      setSvcInstance(null);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: "#1a1a1a",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <h1 id="debug-title">Debug TPV Page Loaded</h1>
      <p>If you see this, routing is working.</p>
      <div
        style={{
          padding: 10,
          backgroundColor: isShiftOpen ? "#7f1d1d" : "#064e3b",
          color: "white",
          fontWeight: "bold",
          borderRadius: 4,
          marginBottom: 20,
        }}
      >
        SHIFT STATUS: {isShiftOpen ? "OPEN (LOCKED)" : "CLOSED (FREE)"}
      </div>

      <div
        style={{
          border: "1px solid #333",
          padding: 20,
          marginTop: 20,
          borderRadius: 8,
        }}
      >
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

      <div
        style={{
          border: "1px solid #333",
          padding: 20,
          marginTop: 20,
          borderRadius: 8,
        }}
      >
        <h3>Configuration:</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label>Wake Word:</label>
          <input
            type="text"
            value={wakeWord}
            onChange={(e) => setWakeWord(e.target.value)}
            placeholder="e.g. Ok Computer"
            style={{
              padding: 8,
              background: "#333",
              border: "none",
              color: "white",
              borderRadius: 4,
            }}
          />
          <span style={{ fontSize: 12, color: "#888" }}>
            (Empty = No Wake Word)
          </span>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3>Flight Readiness (Pilot Protocol):</h3>
        <div
          style={{
            border: "1px solid #333",
            padding: 20,
            marginTop: 20,
            borderRadius: 8,
            background: "#111",
          }}
        >
          <h4>Sofia Gastrobar Pilot</h4>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
            Protocol: 1. Deploy iPad | 2. Seed 50 Items | 3. Disconnect | 4.
            Service Simulation | 5. Reconnect
          </p>
          <button
            onClick={handleSeed}
            style={{
              padding: "8px 16px",
              background: "#d97706",
              border: "none",
              color: "#fff",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🚀 Seed 50 Config Items
          </button>
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <div
              style={{
                background: "#064e3b",
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              Status: {navigator.onLine ? "ONLINE" : "OFFLINE (Sovereign)"}
            </div>
            <div
              style={{
                background: "#333",
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              {seedStatus || "Ready"}
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              borderTop: "1px dashed #333",
              paddingTop: 10,
            }}
          >
            <p style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>
              Drill Controls:
            </p>
            <button
              onClick={() => {
                const isOffline = confirm(
                  "Sovereign Mode Simulation:\nOK = Force Offline (Cut Wire)\nCancel = Restore Online"
                );
                // @ts-ignore - accessing private singleton or we need to cast import
                // Importing SyncEngine directly to call public method
                import("../core/sync/SyncEngine").then(({ SyncEngine }) => {
                  SyncEngine.simulateOffline(isOffline);
                  alert(
                    `Simulation: ${
                      isOffline ? "OFFLINE (Signal Cut)" : "ONLINE (Restored)"
                    }`
                  );
                });
              }}
              style={{
                padding: "4px 12px",
                background: "#dc2626",
                border: "none",
                color: "#fff",
                borderRadius: 4,
                fontSize: 12,
                cursor: "pointer",
              }}
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
        <div
          style={{
            border: "1px solid #333",
            padding: 20,
            marginTop: 20,
            borderRadius: 8,
            background: "#111",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
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
              style={{
                padding: "8px 16px",
                background: "#10b981",
                border: "none",
                color: "#fff",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Open Shift
            </button>
            <button
              onClick={async () => {
                const { CashRegisterEngine } = await import(
                  "../core/tpv/CashRegister"
                );
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
              style={{
                padding: "8px 16px",
                background: "#ef4444",
                border: "none",
                color: "#fff",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Close Shift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
