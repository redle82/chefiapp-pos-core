/**
 * AdminDevicesPage — Tela de AppStaff (provisão e lista).
 *
 * Única responsabilidade: provisão de dispositivos AppStaff (QR) e lista dos já registados.
 * TPV/KDS não são geridos aqui; encaminhamento para /admin/devices/tpv.
 *
 * Rota: /admin/devices
 * Redirect: ?module=tpv | ?type=TPV | ?module=kds | ?type=KDS → /admin/devices/tpv
 */

import { useFormatLocale } from "@/core/i18n/useFormatLocale";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { Logger } from "../../../core/logger";
import { AdminPageHeader } from "../dashboard/components/AdminPageHeader";
import styles from "./AdminDevicesPage.module.css";
import { InstallQRPanel } from "./InstallQRPanel";
import {
  createInstallToken,
  fetchTerminals,
  revokeTerminal,
  type InstallToken,
  type Terminal,
} from "./api/devicesApi";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeSinceRaw(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "__now__";
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
  const { t } = useTranslation("config");
  const locale = useFormatLocale();
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;
  const [searchParams] = useSearchParams();

  const isDevRuntime =
    typeof import.meta.env !== "undefined" &&
    (import.meta.env.DEV === true ||
      /^(development|dev|local)$/i.test(String(import.meta.env.MODE ?? "")));

  const allowBrowserRuntimeDev =
    isDevRuntime &&
    (String(import.meta.env.VITE_ALLOW_BROWSER_RUNTIME_DEV ?? "").toLowerCase() ===
      "true" ||
      String(
        import.meta.env.VITE_ALLOW_BROWSER_APPSTAFF_DEV ?? "",
      ).toLowerCase() === "true");

  const moduleParam = (searchParams.get("module") || "").toLowerCase();
  const typeParam = (searchParams.get("type") || "").toUpperCase();

  // TPV e KDS: única tela operacional é /admin/devices/tpv (KDS nasce do TPV).
  if (
    moduleParam === "tpv" ||
    typeParam === "TPV" ||
    moduleParam === "kds" ||
    typeParam === "KDS"
  ) {
    return <Navigate to="/admin/devices/tpv" replace />;
  }

  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeToken, setActiveToken] = useState<InstallToken | null>(null);
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
      Logger.error("Failed to fetch terminals:", err);
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
        "APPSTAFF",
        tokenName.trim() || undefined,
      );
      setActiveToken(tok);
    } catch (err: unknown) {
      setTokenError(
        err instanceof Error ? err.message : t("devices.errorGenerateToken"),
      );
    } finally {
      setGenerating(false);
    }
  }, [restaurantId, tokenName, t]);

  // Revoke terminal
  const handleRevoke = useCallback(
    async (id: string) => {
      if (!confirm(t("devices.confirmRevoke"))) return;
      try {
        await revokeTerminal(id);
        setTerminals((prev) =>
          prev.map((term) =>
            term.id === id ? { ...term, status: "revoked" as const } : term,
          ),
        );
      } catch (err) {
        Logger.error("Failed to revoke:", err);
      }
    },
    [t],
  );

  const appstaffTerminals = terminals.filter((t) => t.type === "APPSTAFF");

  const tableHeaders = [
    t("devices.tableStatus"),
    t("devices.tableName"),
    t("devices.tableRegistered"),
    t("devices.tableLastSignal"),
    "",
  ];

  return (
    <div
      className={`${styles.wrapper} page-enter admin-content-page`}
      data-runtime-page="AdminDevicesPage"
      data-appstaff-only="true"
    >
      <AdminPageHeader
        title={t("devices.appstaffTitle")}
        subtitle={t("devices.appstaffSubtitle")}
      />
      {allowBrowserRuntimeDev && (
        <div
          className={styles.card}
          style={{
            marginBottom: 16,
            borderStyle: "dashed",
            borderColor: "#4b5563",
          }}
          data-runtime-dev-helper="appstaff-browser-shortcut"
        >
          <p className={styles.sectionDesc} style={{ marginBottom: 8 }}>
            SOMENTE PARA TESTE · SOMENTE EM MODO DEV. Isto não substitui o fluxo
            oficial (desktop / app instalada). Abre em nova aba.
          </p>
          <a
            href="/app/staff/home"
            target="_blank"
            rel="noreferrer noopener"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #3b82f6",
              color: "#3b82f6",
              fontSize: 14,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Abrir AppStaff no navegador (teste DEV)
          </a>
        </div>
      )}
      <p className={styles.flowContext} style={{ marginBottom: 16 }}>
        {t("devices.flowContext")}{" "}
        <Link to="/admin/devices/tpv" className={styles.tpvLinkDiscrete}>
          {t("devices.tpvLinkLabel")}
        </Link>{" "}
        {t("devices.flowContextSuffix")}
      </p>

      {/* ── Provisão AppStaff ── */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>{t("devices.addAppstaffTitle")}</h2>
        <p className={styles.sectionDesc}>
          {t("devices.addAppstaffDesc")}
        </p>

        <div className={styles.formRow}>
          <label className={styles.fieldLabelFlex}>
            {t("devices.nameOptional")}
            <input
              type="text"
              placeholder={t("devices.namePlaceholderAppstaff")}
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
            {generating ? t("devices.generating") : t("devices.generateQr")}
          </button>
        </div>

        {tokenError && <div className={styles.tokenError}>{tokenError}</div>}
        {activeToken && secondsLeft > 0 && (
          <InstallQRPanel
            token={activeToken.token}
            deviceType="APPSTAFF"
            secondsLeft={secondsLeft}
            baseUrl={getBaseUrl()}
          />
        )}
      </section>

      {/* ── Lista AppStaff (só o que esta tela provisiona) ── */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>{t("devices.registeredTitle")}</h2>
        <p className={styles.sectionDesc}>
          {t("devices.registeredDesc")}
        </p>

        {loading ? (
          <div className={styles.loadingState}>{t("devices.loading")}</div>
        ) : appstaffTerminals.length === 0 ? (
          <div className={styles.emptyState}>
            {t("devices.emptyAppstaff")}
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  {tableHeaders.map((h) => (
                    <th key={h || "empty"} className={styles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appstaffTerminals.map((term) => {
                  const ts = timeSinceRaw(term.last_heartbeat_at);
                  const statusText =
                    term.status === "revoked"
                      ? t("devices.revoked")
                      : ts === "__now__"
                        ? t("devices.online")
                        : t("devices.offline");
                  return (
                    <tr
                      key={term.id}
                      className={
                        term.status === "revoked" ? styles.trRevoked : styles.tr
                      }
                    >
                      <td className={styles.td}>
                        <span
                          className={`${styles.statusDot} ${statusDotClass(term)}`}
                        />
                        {statusText}
                      </td>
                      <td className={styles.tdName}>{term.name}</td>
                      <td className={styles.tdSecondary}>
                        {new Date(term.registered_at).toLocaleDateString(locale)}
                      </td>
                      <td className={styles.tdSecondary}>
                        {ts === "__now__" ? t("devices.now") : ts}
                      </td>
                      <td className={styles.tdRight}>
                        {term.status !== "revoked" && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(term.id)}
                            className={styles.btnRevoke}
                          >
                            {t("devices.revoke")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
