/**
 * AdminDevicesPage — Device provisioning + active devices list.
 *
 * 3 blocks:
 *   1. Install QR — generate a one-time token, show platform-specific QR codes (iOS/Android)
 *   2. Active Devices — live table of gm_terminals
 *   3. Downloads — links to TPV/KDS desktop apps (future)
 *
 * Rota: /admin/devices
 * Contrato: CORE_INSTALLATION_AND_PROVISIONING_CONTRACT
 */

import { useCallback, useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { AdminPageHeader } from "../dashboard/components/AdminPageHeader";
import styles from "./AdminDevicesPage.module.css";
import { DesktopComingSoonBanner } from "./DesktopComingSoonBanner";
import { InstallQRPanel } from "./InstallQRPanel";
import {
  createInstallToken,
  fetchTerminals,
  revokeTerminal,
  type InstallToken,
  type Terminal,
  type TerminalType,
} from "./api/devicesApi";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeSince(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "agora";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

function statusDotClass(terminal: Terminal): string {
  const ms = terminal.last_heartbeat_at
    ? Date.now() - new Date(terminal.last_heartbeat_at).getTime()
    : Infinity;
  if (ms < 120_000) return styles.statusGreen;
  if (ms < 600_000) return styles.statusYellow;
  return styles.statusRed;
}

function buildInstallUrl(token: string): string {
  // For mobile devices (iPhone/Android), use the local IP address injected by Vite
  // so the QR code points to an address accessible from the device network
  const localIp = (globalThis as any).__LOCAL_IP__ as string | undefined;

  if (localIp && localIp !== "localhost" && localIp !== "127.0.0.1") {
    // Use local IP detected by Vite instead of localhost
    const protocol = window.location.protocol; // http: or https:
    const port = window.location.port;
    const portStr = port && port !== "80" && port !== "443" ? `:${port}` : "";
    return `${protocol}//${localIp}${portStr}/install?token=${token}`;
  }

  // Fallback to current origin if IP not available
  return `${window.location.origin}/install?token=${token}`;
}

function getBaseUrl(): string {
  // Returns base URL without path, for building URLs in child components
  const localIp = (globalThis as any).__LOCAL_IP__ as string | undefined;

  if (localIp && localIp !== "localhost" && localIp !== "127.0.0.1") {
    const protocol = window.location.protocol; // http: or https:
    const port = window.location.port;
    const portStr = port && port !== "80" && port !== "443" ? `:${port}` : "";
    return `${protocol}//${localIp}${portStr}`;
  }

  return window.location.origin;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminDevicesPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;

  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeToken, setActiveToken] = useState<InstallToken | null>(null);
  const [tokenType, setTokenType] = useState<TerminalType>("APPSTAFF");
  const [tokenName, setTokenName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Fetch terminals
  const loadTerminals = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const list = await fetchTerminals(restaurantId);
      setTerminals(list);
    } catch (err) {
      console.error("Failed to fetch terminals:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadTerminals();
  }, [loadTerminals]);

  // Auto-refresh terminals while a QR token is active.
  // When the device scans the QR, a new terminal appears — this ensures the
  // admin sees it without manually refreshing.
  useEffect(() => {
    if (!activeToken || secondsLeft <= 0) return;
    const id = setInterval(() => {
      loadTerminals();
    }, 5_000);
    return () => clearInterval(id);
  }, [activeToken, secondsLeft, loadTerminals]);

  // Token countdown
  useEffect(() => {
    if (!activeToken) return;
    const expires = new Date(activeToken.expires_at).getTime();
    const tick = () => {
      const left = Math.max(0, Math.ceil((expires - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) setActiveToken(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeToken]);

  // Generate token
  const handleGenerate = useCallback(async () => {
    if (!restaurantId) return;
    setGenerating(true);
    setTokenError(null);
    try {
      const tok = await createInstallToken(
        restaurantId,
        tokenType,
        tokenName.trim() || undefined,
      );
      setActiveToken(tok);
    } catch (err: unknown) {
      setTokenError(err instanceof Error ? err.message : "Erro ao gerar token");
    } finally {
      setGenerating(false);
    }
  }, [restaurantId, tokenType, tokenName]);

  // Revoke terminal
  const handleRevoke = useCallback(async (id: string) => {
    if (!confirm("Revogar este dispositivo?")) return;
    try {
      await revokeTerminal(id);
      setTerminals((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "revoked" as const } : t,
        ),
      );
    } catch (err) {
      console.error("Failed to revoke:", err);
    }
  }, []);

  return (
    <div className={styles.wrapper}>
      <AdminPageHeader
        title="Dispositivos"
        subtitle="Provisionar terminais, monitorar estado e descarregar software."
      />

      {/* ── Block 1: Install QR ── */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Instalar dispositivo</h2>
        <p className={styles.sectionDesc}>
          Gere um código QR e digitalize-o no dispositivo para o vincular
          automaticamente a este restaurante. O código expira em 5 minutos.
        </p>

        <div className={styles.formRow}>
          <label className={styles.fieldLabel}>
            Tipo
            <select
              value={tokenType}
              onChange={(e) => setTokenType(e.target.value as TerminalType)}
              className={styles.selectInput}
            >
              <option value="APPSTAFF">AppStaff (Mobile)</option>
              <option value="TPV">TPV</option>
              <option value="KDS">KDS</option>
            </select>
          </label>

          <label className={styles.fieldLabelFlex}>
            Nome (opcional)
            <input
              type="text"
              placeholder="ex: TPV_BALCAO_01"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className={styles.textInput}
            />
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!restaurantId || generating}
            className={styles.btnGenerate}
          >
            {generating ? "A gerar…" : "Gerar QR"}
          </button>
        </div>

        {tokenError && <div className={styles.tokenError}>{tokenError}</div>}
        {activeToken && secondsLeft > 0 && (
          <InstallQRPanel
            token={activeToken.token}
            deviceType={activeToken.device_type}
            secondsLeft={secondsLeft}
            baseUrl={getBaseUrl()}
          />
        )}
      </section>

      {/* ── Block 2: Active Devices ── */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Dispositivos activos</h2>
        <p className={styles.sectionDesc}>
          Terminais registados neste restaurante. O ponto colorido indica a
          última actividade.
        </p>

        {loading ? (
          <div className={styles.loadingState}>A carregar…</div>
        ) : terminals.length === 0 ? (
          <div className={styles.emptyState}>
            Nenhum dispositivo registado. Use o QR acima para vincular o
            primeiro.
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  {[
                    "Estado",
                    "Nome",
                    "Tipo",
                    "Registado",
                    "Último sinal",
                    "",
                  ].map((h) => (
                    <th key={h} className={styles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {terminals.map((t) => (
                  <tr
                    key={t.id}
                    className={
                      t.status === "revoked" ? styles.trRevoked : styles.tr
                    }
                  >
                    <td className={styles.td}>
                      <span
                        className={`${styles.statusDot} ${statusDotClass(t)}`}
                      />
                      {t.status === "revoked"
                        ? "Revogado"
                        : timeSince(t.last_heartbeat_at) === "agora"
                        ? "Online"
                        : "Offline"}
                    </td>
                    <td className={styles.tdName}>{t.name}</td>
                    <td className={styles.tdSecondary}>{t.type}</td>
                    <td className={styles.tdSecondary}>
                      {new Date(t.registered_at).toLocaleDateString("pt-PT")}
                    </td>
                    <td className={styles.tdSecondary}>
                      {timeSince(t.last_heartbeat_at)}
                    </td>
                    <td className={styles.tdRight}>
                      {t.status !== "revoked" && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(t.id)}
                          className={styles.btnRevoke}
                        >
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Block 3: Downloads ── */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Descargar software</h2>
        <p className={styles.sectionDesc}>
          Los módulos operacionales (TPV, KDS, AppStaff) solo funcionan como
          aplicación instalada — no son accesibles desde el navegador.
        </p>

        <DesktopComingSoonBanner />

        <div className={styles.distributionNote}>
          <span className={styles.distributionIcon}>🛡️</span>
          <div>
            <strong>Política de distribuição</strong>
            <p className={styles.distributionText}>
              O painel de administração (este ecrã) é a única parte do ChefIApp
              acessível pelo navegador. Os módulos operacionais — TPV, KDS e
              AppStaff — requerem a aplicação dedicada (desktop ou móvel).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
