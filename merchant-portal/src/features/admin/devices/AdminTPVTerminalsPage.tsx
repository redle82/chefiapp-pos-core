/**
 * AdminTPVTerminalsPage — Única tela oficial e operacional do TPV.
 *
 * Fluxo: 1) Baixar TPV · 2) Primeiro arranque · 3) Vincular terminal · 4) TPVs criados.
 * KDS incluído no mesmo pacote (ecossistema TPV).
 *
 * Rota: /admin/devices/tpv
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormatLocale } from "@/core/i18n/useFormatLocale";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { Logger } from "../../../core/logger";
import { AdminPageHeader } from "../dashboard/components/AdminPageHeader";
import {
  createDevicePairingCode,
  fetchTerminals,
  type InstallToken,
  type Terminal,
} from "./api/devicesApi";
import { getDesktopReleaseConfig } from "../../../core/desktop/desktopReleaseConfig";
import { DesktopDownloadSection } from "./DesktopDownloadSection";
import styles from "./AdminDevicesPage.module.css";

const DESKTOP_APP_SCHEME = "chefiapp-pos://setup";
const DEV_DESKTOP_CMD = "pnpm run dev:desktop";

const isDevRuntime =
  typeof import.meta.env !== "undefined" &&
  (import.meta.env.DEV === true ||
    /^(development|dev|local)$/i.test(String(import.meta.env.MODE ?? "")));

const allowBrowserRuntimeDev =
  isDevRuntime &&
  (String(import.meta.env.VITE_ALLOW_BROWSER_RUNTIME_DEV ?? "").toLowerCase() ===
    "true" ||
    String(import.meta.env.VITE_ALLOW_BROWSER_TPV_DEV ?? "").toLowerCase() ===
      "true" ||
    String(
      import.meta.env.VITE_ALLOW_BROWSER_APPSTAFF_DEV ?? "",
    ).toLowerCase() === "true");

const isDev =
  typeof import.meta.env !== "undefined" &&
  (import.meta.env.DEV === true ||
    /^(development|dev|local)$/i.test(String(import.meta.env.MODE ?? "")));

type TPVTerminal = Terminal & { type: "TPV" };

function timeSinceRaw(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "__now__";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

function statusDotClass(terminal: TPVTerminal): string {
  const ms = terminal.last_heartbeat_at
    ? Date.now() - new Date(terminal.last_heartbeat_at).getTime()
    : Infinity;
  if (ms < 120_000) return styles.statusGreen;
  if (ms < 600_000) return styles.statusYellow;
  return styles.statusRed;
}

export function AdminTPVTerminalsPage() {
  const { t } = useTranslation("config");
  const locale = useFormatLocale();
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;

  const [terminals, setTerminals] = useState<TPVTerminal[]>([]);
  const [loading, setLoading] = useState(true);

  const [pairingToken, setPairingToken] = useState<InstallToken | null>(null);
  const [pairingName, setPairingName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [devCmdCopied, setDevCmdCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    if (!pairingToken?.token) return;
    try {
      await navigator.clipboard.writeText(pairingToken.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      Logger.error("[AdminTPVTerminalsPage] Copy failed", e);
    }
  }, [pairingToken?.token]);

  const handleOpenDesktopApp = useCallback(async () => {
    if (isDev) {
      try {
        await navigator.clipboard.writeText(DEV_DESKTOP_CMD);
        setDevCmdCopied(true);
        setTimeout(() => setDevCmdCopied(false), 4000);
      } catch {
        // ignore
      }
    }
    window.location.href = DESKTOP_APP_SCHEME;
  }, []);

  const loadTerminals = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const all = await fetchTerminals(restaurantId);
      setTerminals(all.filter((t) => t.type === "TPV") as TPVTerminal[]);
    } catch (err) {
      Logger.error("[AdminTPVTerminalsPage] Failed to fetch terminals:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadTerminals();
  }, [loadTerminals]);

  const handleGenerate = useCallback(async () => {
    if (!restaurantId) return;
    setGenerating(true);
    setError(null);
    try {
      const tok = await createDevicePairingCode(
        restaurantId,
        "TPV",
        pairingName.trim() || undefined,
      );
      setPairingToken(tok);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t("devices.errorPairing"),
      );
    } finally {
      setGenerating(false);
    }
  }, [restaurantId, pairingName, t]);

  const releaseConfig = getDesktopReleaseConfig();

  const getStatusLabel = (term: TPVTerminal) => {
    const ms = term.last_heartbeat_at
      ? Date.now() - new Date(term.last_heartbeat_at).getTime()
      : Infinity;
    if (ms < 120_000) return t("devices.online");
    if (ms < 600_000) return t("devices.tpvStatusInactive");
    return t("devices.offline");
  };

  const tpvTableHeaders = [
    t("devices.tableStatus"),
    t("devices.tableName"),
    t("devices.tableRegistered"),
    t("devices.tableLastActivity"),
    t("devices.tablePlatform"),
    t("devices.tableActions"),
  ];

  return (
    <div
      className={styles.wrapper}
      data-chefiapp-tpv-mother="true"
      data-runtime-page="AdminTPVTerminalsPage"
    >
      <AdminPageHeader
        title={t("devices.tpvPageTitle")}
        subtitle={t("devices.tpvPageSubtitle")}
      />
      {allowBrowserRuntimeDev && (
        <div
          className={styles.card}
          style={{
            marginBottom: 16,
            borderStyle: "dashed",
            borderColor: "#4b5563",
          }}
          data-runtime-dev-helper="tpv-browser-shortcuts"
        >
          <p className={styles.sectionDesc} style={{ marginBottom: 8 }}>
            SOMENTE PARA TESTE · SOMENTE EM MODO DEV. Isto não substitui o fluxo
            oficial (desktop / app instalada). Abre em nova aba.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="/op/tpv"
              target="_blank"
              rel="noreferrer noopener"
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #22c55e",
                color: "#22c55e",
                fontSize: 14,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Abrir TPV/KDS no navegador (teste DEV)
            </a>
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
        </div>
      )}
      {/* ── 1. Baixar TPV ── */}
      <section className={styles.card} data-block="baixar-tpv">
        <h2 className={styles.sectionTitle}>{t("devices.tpvSection1Title")}</h2>
        <p className={styles.sectionDesc} style={{ marginBottom: releaseConfig.releaseVersion ? 4 : 12 }}>
          {t("devices.tpvSection1Lead")}
        </p>
        {releaseConfig.releaseVersion && (
          <p className={styles.sectionDesc} style={{ fontSize: 12, opacity: 0.9, marginBottom: 12 }}>
            {t("devices.tpvSection1Version", { version: releaseConfig.releaseVersion })}
          </p>
        )}
        <DesktopDownloadSection />
      </section>

      {/* ── 2. Instalar e primeiro arranque ── */}
      <section className={styles.card} data-block="primeiro-arranque">
        <h2 className={styles.sectionTitle}>{t("devices.tpvSection2Title")}</h2>
        <ul className={styles.sectionDesc} style={{ margin: 0, paddingLeft: 20 }}>
          <li>{t("devices.tpvSection2Line1")}</li>
          <li>{t("devices.tpvSection2Line2")}</li>
          <li>{t("devices.tpvSection2Line3")}</li>
        </ul>
      </section>

      {/* ── 3. Vincular terminal ── */}
      <section className={styles.card} data-block="vincular-terminal">
        <h2 className={styles.sectionTitle}>{t("devices.tpvSection3Title")}</h2>
        <p className={styles.sectionDesc} style={{ marginBottom: 8 }}>
          {t("devices.tpvSection3Intro")}
        </p>
        <p className={styles.sectionDesc} style={{ marginBottom: 16 }}>
          {t("devices.tpvSection3Instruction")}
        </p>

        <div className={styles.formRow}>
          <label className={styles.fieldLabelFlex}>
            {t("devices.terminalNameLabel")}
            <input
              type="text"
              placeholder={t("devices.terminalNamePlaceholder")}
              value={pairingName}
              onChange={(e) => setPairingName(e.target.value)}
              className={styles.textInput}
            />
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!restaurantId || generating}
            className={styles.btnGenerate}
          >
            {generating ? t("devices.generating") : t("devices.generateCode")}
          </button>
        </div>

        {error && <div className={styles.tokenError}>{error}</div>}
        {pairingToken && (
          <div className={styles.desktopPairingPreview}>
            <div className={styles.desktopPairingCode}>{pairingToken.token}</div>
            <div className={styles.desktopPairingActions}>
              <button
                type="button"
                onClick={handleCopyCode}
                className={styles.btnCopyCode}
              >
                {copied ? t("devices.copied") : t("devices.copyCode")}
              </button>
              <button
                type="button"
                onClick={handleOpenDesktopApp}
                className={styles.btnOpenDesktopApp}
                title={t("devices.openAppTpvTitle")}
              >
                {isDev && devCmdCopied ? t("devices.commandCopied") : t("devices.openAppTpv")}
              </button>
            </div>
            {isDev && (
              <p className={styles.sectionDesc} style={{ marginTop: 8, fontSize: 11, opacity: 0.75, marginBottom: 0 }}>
                {t("devices.devHint")} <strong>{DEV_DESKTOP_CMD}</strong>
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── 4. TPVs criados ── */}
      <section className={styles.card} data-block="tpvs-criados">
        <h2 className={styles.sectionTitle}>{t("devices.tpvSection4Title")}</h2>
        <p className={styles.sectionDesc}>
          {t("devices.tpvSection4Desc")}
        </p>

        {loading ? (
          <div className={styles.loadingState}>{t("devices.loading")}</div>
        ) : terminals.length === 0 ? (
          <div className={styles.emptyState}>
            {t("devices.emptyTpv")}
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  {tpvTableHeaders.map((h) => (
                    <th key={h} className={styles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {terminals.map((term) => {
                  const ts = timeSinceRaw(term.last_heartbeat_at);
                  return (
                    <tr key={term.id} className={styles.tr}>
                      <td className={styles.td}>
                        <span className={`${styles.statusDot} ${statusDotClass(term)}`} />
                        {getStatusLabel(term)}
                      </td>
                      <td className={styles.tdName}>{term.name}</td>
                      <td className={styles.tdSecondary}>
                        {new Date(term.registered_at).toLocaleDateString(locale)}
                      </td>
                      <td className={styles.tdSecondary}>
                        {ts === "__now__" ? t("devices.now") : ts}
                      </td>
                      <td className={styles.tdSecondary}>
                        {(term.metadata?.platform as string) || (term.metadata?.version as string) || "—"}
                      </td>
                      <td className={styles.tdSecondary}>
                        —
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
