import { useCallback, useEffect, useState } from "react";
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
import { DesktopDownloadSection } from "./DesktopDownloadSection";
import styles from "./AdminDevicesPage.module.css";

const DESKTOP_APP_SCHEME = "chefiapp-pos://setup";
const DEV_DESKTOP_CMD = "pnpm run dev:desktop";

const isDev =
  typeof import.meta.env !== "undefined" &&
  (import.meta.env.DEV === true ||
    /^(development|dev|local)$/i.test(String(import.meta.env.MODE ?? "")));

type TPVTerminal = Terminal & { type: "TPV" };

function timeSince(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "agora";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

export function AdminTPVTerminalsPage() {
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
      setTerminals(
        all.filter((t) => t.type === "TPV") as TPVTerminal[],
      );
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
        err instanceof Error ? err.message : "Erro ao gerar código de emparelhamento",
      );
    } finally {
      setGenerating(false);
    }
  }, [restaurantId, pairingName]);

  return (
    <div className={styles.wrapper}>
      <AdminPageHeader
        title="TPVs do restaurante"
        subtitle="Criar, vincular e acompanhar terminais TPV deste restaurante."
      />

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Instalar o TPV no seu computador</h2>
        <p className={styles.sectionDesc}>
          Descarregue o instalador (Mac ou Windows) abaixo e instale como qualquer outra aplicação.
          Depois de instalar: abra o app, gere um código nesta página, cole no app e clique em «Vincular dispositivo».
        </p>
        <p className={styles.sectionDesc}>
          Se ainda não houver link de descarga, o administrador do sistema pode disponibilizar o ficheiro (.dmg no Mac, .exe no Windows) ou publicar uma release.
        </p>
        <DesktopDownloadSection />
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Vincular um TPV a este restaurante</h2>
        <p className={styles.sectionDesc}>
          Gere um código e use-o no app TPV de desktop para vincular este
          equipamento a este restaurante.
        </p>

        <div className={styles.formRow}>
          <label className={styles.fieldLabelFlex}>
            Nome do terminal (opcional)
            <input
              type="text"
              placeholder="ex: TPV_CAIXA_01"
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
            {generating ? "A gerar…" : "Gerar código"}
          </button>
        </div>

        {error && <div className={styles.tokenError}>{error}</div>}
        {pairingToken && (
          <div className={styles.desktopPairingPreview}>
            <div className={styles.desktopPairingCode}>
              {pairingToken.token}
            </div>
            <div className={styles.desktopPairingActions}>
              <button
                type="button"
                onClick={handleCopyCode}
                className={styles.btnCopyCode}
              >
                {copied ? "Copiado" : "Copiar código"}
              </button>
              <button
                type="button"
                onClick={handleOpenDesktopApp}
                className={styles.btnOpenDesktopApp}
                title="Abre o app TPV se já estiver instalado no computador"
              >
                {isDev && devCmdCopied
                  ? "Comando copiado"
                  : "Abrir app TPV"}
              </button>
            </div>
            <p className={styles.sectionDesc}>
              Cole o código no app TPV e clique em «Vincular dispositivo». Se o app já estiver instalado, pode usar «Abrir app TPV» para o abrir.
            </p>
            <p className={styles.sectionDesc} style={{ marginTop: 4, fontSize: 12, opacity: 0.9 }}>
              {isDev ? (
                <>
                  Se nada abrir, o esquema <code className={styles.inlineCode}>chefiapp-pos://</code> não está registado (só fica após instalar o .dmg). Execute no terminal: <strong>{DEV_DESKTOP_CMD}</strong> — ao clicar em «Abrir app TPV» o comando é copiado.
                </>
              ) : (
                <>
                  Se nada abrir, instale o app TPV (secção acima) para registar o link no sistema.
                </>
              )}
            </p>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>TPVs registados</h2>
        <p className={styles.sectionDesc}>
          Terminais TPV registados neste restaurante. O estado é derivado da
          última atividade reportada.
        </p>

        {loading ? (
          <div className={styles.loadingState}>A carregar…</div>
        ) : terminals.length === 0 ? (
          <div className={styles.emptyState}>
            Ainda não existem TPVs registados. Gere um código acima e use-o no
            app TPV para criar o primeiro terminal.
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  {["Nome", "Registado", "Último sinal"].map((h) => (
                    <th key={h} className={styles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {terminals.map((t) => (
                  <tr key={t.id} className={styles.tr}>
                    <td className={styles.tdName}>{t.name}</td>
                    <td className={styles.tdSecondary}>
                      {new Date(t.registered_at).toLocaleDateString(locale)}
                    </td>
                    <td className={styles.tdSecondary}>
                      {timeSince(t.last_heartbeat_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

