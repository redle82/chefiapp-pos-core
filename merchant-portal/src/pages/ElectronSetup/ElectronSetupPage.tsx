/**
 * ElectronSetupPage — First-launch pairing wizard for the Electron desktop shell.
 *
 * Flow:
 * 1. User opens Electron app for the first time → lands here.
 * 2. Admin generates an install token in /admin/devices.
 * 3. User enters the token here.
 * 4. `consumeInstallToken()` pairs this device → returns a Terminal with id, type.
 * 5. Config saved to electron-store via bridge → navigates to /op/tpv or /op/kds.
 *
 * Guard: Redirects to / if not running inside Electron (isElectron() check).
 * Ref: docs/architecture/DESKTOP_DISTRIBUTION_CONTRACT.md
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isElectron } from "../../core/operational/platformDetection";
import {
  consumeInstallToken,
  type Terminal,
} from "../../features/admin/devices/api/devicesApi";
import { extractInstallToken } from "./extractInstallToken";

/* ── Inline styles (no CSS module needed for this standalone page) ── */

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 32,
    backgroundColor: "#0a0a0a",
    color: "#fafafa",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    textAlign: "center" as const,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 24,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700 as const,
    marginBottom: 8,
    color: "#fafafa",
  },
  subtitle: {
    fontSize: 15,
    color: "#a3a3a3",
    marginBottom: 32,
    maxWidth: 400,
    lineHeight: 1.5,
  },
  card: {
    background: "#171717",
    border: "1px solid #2a2a2a",
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 420,
  },
  label: {
    display: "block" as const,
    fontSize: 13,
    fontWeight: 600 as const,
    color: "#a3a3a3",
    marginBottom: 8,
    textAlign: "left" as const,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: 18,
    letterSpacing: 2,
    textAlign: "center" as const,
    border: "2px solid #333",
    borderRadius: 10,
    background: "#0a0a0a",
    color: "#fafafa",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  },
  inputFocused: {
    borderColor: "#eab308",
  },
  button: {
    width: "100%",
    padding: "14px 24px",
    fontSize: 16,
    fontWeight: 700 as const,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
    marginTop: 20,
    transition: "opacity 0.2s",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed" as const,
  },
  error: {
    fontSize: 14,
    color: "#f87171",
    marginTop: 16,
    padding: "10px 14px",
    background: "rgba(248, 113, 113, 0.1)",
    borderRadius: 8,
    border: "1px solid rgba(248, 113, 113, 0.2)",
  },
  success: {
    fontSize: 14,
    color: "#4ade80",
    marginTop: 16,
  },
  version: {
    fontSize: 12,
    color: "#525252",
    marginTop: 32,
  },
  steps: {
    textAlign: "left" as const,
    fontSize: 13,
    color: "#737373",
    lineHeight: 1.8,
    marginBottom: 24,
  },
};

type SetupStep = "input" | "pairing" | "success";

export function ElectronSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [step, setStep] = useState<SetupStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<{
    version: string;
    platform: string;
  } | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    terminalId: string | null;
    terminalType: "TPV" | "KDS" | null;
    restaurantId: string | null;
    lastDeepLink?: {
      nonce: string | null;
      moduleId: "tpv" | "kds";
      receivedAt: string;
    };
    lastAck?: {
      nonce: string;
      moduleId: "tpv" | "kds";
      sentAt: string;
      success: boolean;
    };
    lastHeartbeatAt?: string;
    appVersion: string | null;
    isPackaged: boolean | null;
  } | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const reason = query.get("reason");
    if (reason !== "module_mismatch") return;

    const paired = query.get("paired")?.toUpperCase() ?? "DESCONHECIDO";
    const requested = query.get("requested")?.toUpperCase() ?? "DESCONHECIDO";
    setError(
      `Dispositivo pareado como ${paired}, mas foi solicitado ${requested}. Gere um novo token para o módulo correto ou limpe o pareamento local.`,
    );
  }, [location.search]);

  // Guard: not in Electron → redirect to home
  useEffect(() => {
    if (!isElectron()) {
      navigate("/", { replace: true });
      return;
    }
    // Fetch app info from Electron bridge
    window.electronBridge
      ?.getAppInfo()
      .then(setAppInfo)
      .catch(() => {});
    // Check if already paired
    window.electronBridge
      ?.getTerminalConfig()
      .then((config) => {
        if (config) {
          const route = config.terminalType === "KDS" ? "/op/kds" : "/op/tpv";
          navigate(route, { replace: true });
        }
      })
      .catch(() => {});

    // Fetch diagnostics (Doctor)
    window.electronBridge
      ?.getDiagnostics?.()
      .then((status) => {
        if (!status) return;
        setDiagnostics({
          terminalId: status.terminal?.terminalId ?? null,
          terminalType: status.terminal?.terminalType ?? null,
          restaurantId: status.terminal?.restaurantId ?? null,
          lastDeepLink: status.diagnostics.lastDeepLink,
          lastAck: status.diagnostics.lastAck,
          lastHeartbeatAt: status.diagnostics.lastHeartbeatAt,
          appVersion: status.appVersion ?? null,
          isPackaged: status.isPackaged ?? null,
        });
      })
      .catch(() => {});
  }, [navigate]);

  async function handlePair() {
    const parsedToken = extractInstallToken(token);
    if (!parsedToken) return;
    setStep("pairing");
    setError(null);

    try {
      const terminal: Terminal = await consumeInstallToken(parsedToken, {
        platform: appInfo?.platform ?? process.platform ?? "unknown",
        appVersion: appInfo?.version ?? "0.0.0",
        electronBridge: true,
      });

      // Save to Electron persistent store
      if (window.electronBridge) {
        await window.electronBridge.setTerminalConfig({
          terminalId: terminal.id,
          restaurantId: terminal.restaurant_id,
          terminalType: terminal.type as "TPV" | "KDS",
          terminalName: terminal.name,
          pairedAt: new Date().toISOString(),
        });
      }

      setStep("success");

      // Navigate to the operational route after a brief success feedback
      setTimeout(() => {
        const route = terminal.type === "KDS" ? "/op/kds" : "/op/tpv";
        navigate(route, { replace: true });
      }, 1500);
    } catch (err: unknown) {
      setStep("input");
      const message =
        err instanceof Error ? err.message : "Error al vincular el dispositivo";
      if (message.includes("expired") || message.includes("expirado")) {
        setError("El código ha expirado. Genera uno nuevo desde el portal.");
      } else if (
        message.includes("not found") ||
        message.includes("no encontrado")
      ) {
        setError("Código inválido. Verifica e intenta de nuevo.");
      } else {
        setError(message);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && token.trim().length >= 8) {
      handlePair();
    }
  }

  if (!isElectron()) return null;

  return (
    <div style={S.page}>
      <div style={S.title}>ChefIApp Desktop</div>
      <p style={S.subtitle}>
        Vincula este dispositivo a tu restaurante para usarlo como terminal TPV
        o pantalla de cocina (KDS).
      </p>

      <div style={S.card}>
        {step === "input" && (
          <>
            <div style={S.steps}>
              <strong style={{ color: "#a3a3a3" }}>Pasos:</strong>
              <br />
              1. Abre el portal web → Dispositivos
              <br />
              2. Haz clic en "Generar código de instalación"
              <br />
              3. Introduce el código aquí abajo
            </div>

            <label style={S.label} htmlFor="pairing-token">
              Código de instalación
            </label>
            <input
              id="pairing-token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Pega el código o URL de instalación"
              style={{
                ...S.input,
                ...(inputFocused ? S.inputFocused : {}),
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={handlePair}
              disabled={token.trim().length < 8}
              style={{
                ...S.button,
                ...(token.trim().length < 8 ? S.buttonDisabled : {}),
              }}
            >
              Vincular dispositivo
            </button>
            {error && <div style={S.error}>{error}</div>}
          </>
        )}

        {step === "pairing" && (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div
              style={{
                fontSize: 32,
                marginBottom: 16,
                animation: "spin 1s linear infinite",
              }}
            >
              ⏳
            </div>
            <div style={{ color: "#a3a3a3" }}>Vinculando dispositivo…</div>
          </div>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={S.success}>¡Dispositivo vinculado correctamente!</div>
            <div style={{ color: "#737373", fontSize: 13, marginTop: 8 }}>
              Redirigiendo al módulo…
            </div>
          </div>
        )}
      </div>

      {(appInfo || diagnostics) && (
        <div style={S.version}>
          {appInfo && (
            <>
              v{appInfo.version} · {appInfo.platform}
            </>
          )}
          {diagnostics && (
            <>
              {" "}
              ·{" "}
              {diagnostics.isPackaged === true
                ? "App empacotado"
                : diagnostics.isPackaged === false
                ? "Runtime de desenvolvimento"
                : "Origem desconhecida"}
              {diagnostics.terminalId && (
                <>
                  {" "}
                  · Terminal {diagnostics.terminalType ?? "?"} #
                  {diagnostics.terminalId.slice(0, 8)}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
