/**
 * InstallPage — Device provisioning via QR token
 *
 * Flow:
 *   1. Admin generates QR in /admin/devices
 *   2. Device (phone/tablet/desktop app) scans QR → arrives at /install?token=xxx
 *   3. This page calls consume_device_install_token RPC
 *   4. On success: persists terminal_id locally, shows success + install instructions
 *   5. On failure: shows error + retry
 *
 * If no token param: shows generic install instructions.
 *
 * After provisioning, the user must open the installed app (desktop or mobile).
 * Operational modules CANNOT run in the browser — see SYSTEM_RULE_DEVICE_ONLY.md.
 *
 * Rota: /install
 * Contrato: CORE_INSTALLATION_AND_PROVISIONING_CONTRACT
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { setTabIsolated } from "../core/storage/TabIsolatedStorage";
import {
  consumeInstallToken,
  type Terminal,
} from "../features/admin/devices/api/devicesApi";
import styles from "./InstallPage.module.css";

type Status = "idle" | "consuming" | "success" | "error";

export function InstallPage() {
  const [params] = useSearchParams();
  const rawToken = params.get("token");

  const [status, setStatus] = useState<Status>("idle");
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Guard against React 18 StrictMode double-mount consuming the token twice.
  // Without this ref, the first mount consumes the token successfully, then
  // the second mount tries again and gets TOKEN_NOT_FOUND — overwriting the
  // success state with an error.
  const consumeCalledRef = useRef(false);

  // Auto-consume token on mount
  const consumeToken = useCallback(async (token: string) => {
    if (consumeCalledRef.current) {
      console.warn(
        "[InstallPage] consumeToken already called — skipping (StrictMode guard)",
      );
      return;
    }
    consumeCalledRef.current = true;

    console.log("[InstallPage] Starting token consumption:", {
      tokenPrefix: token.substring(0, 12) + "...",
      tokenLength: token.length,
      fullUrl: window.location.href,
      origin: window.location.origin,
    });

    setStatus("consuming");
    setError(null);
    try {
      const meta = {
        userAgent: navigator.userAgent,
        screen: `${screen.width}x${screen.height}`,
        installedAt: new Date().toISOString(),
      };
      const result = await consumeInstallToken(token, meta);
      console.log("[InstallPage] Token consumed successfully:", result);
      setTerminal(result);
      setStatus("success");

      // Persist locally so the PWA knows which terminal it is
      if (typeof window !== "undefined") {
        setTabIsolated("chefiapp_terminal_id", result.id);
        setTabIsolated("chefiapp_restaurant_id", result.restaurant_id);
        window.localStorage.setItem("chefiapp_terminal_id", result.id);
        window.localStorage.setItem(
          "chefiapp_restaurant_id",
          result.restaurant_id,
        );
        window.localStorage.setItem("chefiapp_terminal_type", result.type);
        window.localStorage.setItem("chefiapp_terminal_name", result.name);
      }
    } catch (err: any) {
      const msg = err.message ?? "Erro ao ativar dispositivo";

      console.error("[InstallPage] Token consumption failed:", {
        rawError: err,
        message: msg,
        code: err.code,
        details: err.details,
        tokenPrefix: token.substring(0, 12),
        tokenLength: token.length,
      });

      // Store raw error for debug overlay
      const debugInfo = `Token: ${token.substring(0, 12)}... (${
        token.length
      } chars)\nError: ${msg}\nURL: ${
        window.location.href
      }\nTime: ${new Date().toISOString()}`;

      if (msg.includes("TOKEN_EXPIRED")) {
        setError(
          "Este código QR expirou. Peça ao administrador para gerar um novo.",
        );
      } else if (msg.includes("TOKEN_NOT_FOUND")) {
        setError("Código QR inválido ou já utilizado.");
      } else {
        setError(msg);
      }

      // Append debug info to error for mobile debugging
      setError((prev) => prev + `\n\n[DEBUG]\n${debugInfo}`);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (rawToken && status === "idle") {
      consumeToken(rawToken);
    }
  }, [rawToken, status, consumeToken]);

  // Determine if the terminal type is desktop (TPV/KDS) or mobile (APPSTAFF/WAITER)
  const isDesktopTerminal =
    terminal?.type === "TPV" || terminal?.type === "KDS";
  const isMobileTerminal =
    terminal?.type === "APPSTAFF" || terminal?.type === "WAITER";

  // ── Auto-redirect APPSTAFF/WAITER to staff home after activation ──
  useEffect(() => {
    if (status === "success" && isMobileTerminal) {
      const timer = setTimeout(() => {
        window.location.href = "/app/staff/home";
      }, 3000); // 3s delay so user sees success confirmation
      return () => clearTimeout(timer);
    }
  }, [status, isMobileTerminal]);

  // ── No token: generic instructions ──
  if (!rawToken) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <div className={styles.icon}>📱</div>
          <h1 className={styles.heading}>Instalar ChefIApp</h1>
          <p className={styles.subtitle}>
            Para vincular este dispositivo a um restaurante, o administrador
            deve gerar um código QR na secção <strong>Dispositivos</strong> do
            painel de controlo.
          </p>
          <p className={styles.subtitleSmall}>
            Os módulos operacionais (TPV, KDS, AppStaff) só funcionam como
            aplicação instalada — não são acessíveis pelo navegador.
          </p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardHeading}>Passos</h2>
          <ol className={styles.stepsList}>
            <li>
              O admin abre <strong>Admin → Sistema → Dispositivos</strong>
            </li>
            <li>
              Descarrega e instala a aplicação adequada (desktop ou mobile)
            </li>
            <li>Gera um código QR para o tipo de dispositivo desejado</li>
            <li>Digitaliza o QR na aplicação instalada para vincular</li>
          </ol>
        </div>

        <a href="/admin/devices" className={styles.linkGold}>
          Ir para Dispositivos
        </a>
      </div>
    );
  }

  // ── Consuming token ──
  if (status === "consuming") {
    return (
      <div className={styles.pageCentered}>
        <div className={styles.iconPulse}>⏳</div>
        <p className={styles.loadingText}>A ativar dispositivo…</p>
      </div>
    );
  }

  // ── Error ──
  if (status === "error") {
    // Split error message from debug info
    const [userMessage, debugInfo] = (error || "").split("\n\n[DEBUG]\n");
    const isTokenExpiredOrUsed =
      userMessage?.includes("inválido") ||
      userMessage?.includes("já utilizado");

    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <div className={styles.icon}>❌</div>
          <h1 className={styles.headingSmall}>Falha na ativação</h1>
          <p className={styles.subtitleError}>{userMessage}</p>

          {isTokenExpiredOrUsed && (
            <div className={styles.errorHintBox}>
              <p className={`${styles.smallText} ${styles.errorHintText}`}>
                💡 <strong>Solução:</strong> Volte ao painel de administração e
                gere um novo código QR clicando no botão{" "}
                <strong>"Gerar QR"</strong> na secção Dispositivos.
              </p>
            </div>
          )}

          {/* Debug info overlay — visible on mobile for troubleshooting */}
          {debugInfo && (
            <pre
              style={{
                marginTop: 16,
                padding: 12,
                background: "#1a1a2e",
                color: "#00ff88",
                borderRadius: 8,
                fontSize: 11,
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxWidth: "90vw",
                overflow: "auto",
              }}
            >
              {debugInfo}
            </pre>
          )}

          {/* Only show admin link on desktop browsers — mobile devices must never access admin */}
          {!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
            <a href="/admin/devices" className={styles.linkGold}>
              ← Voltar para Dispositivos
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── Success ──
  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.heading}>Dispositivo ativado</h1>
        <p className={styles.subtitle}>
          Este dispositivo foi vinculado com sucesso.
        </p>
      </div>

      {terminal && (
        <div className={styles.card}>
          <dl className={styles.detailsGrid}>
            <dt className={styles.detailLabel}>Nome</dt>
            <dd className={styles.detailValue}>{terminal.name}</dd>
            <dt className={styles.detailLabel}>Tipo</dt>
            <dd className={styles.detailValuePlain}>{terminal.type}</dd>
            <dt className={styles.detailLabel}>ID</dt>
            <dd className={styles.detailValueMono}>{terminal.id}</dd>
          </dl>
        </div>
      )}

      {/* APPSTAFF/WAITER: auto-redirect to staff home */}
      {isMobileTerminal && (
        <div className={styles.card}>
          <h2 className={styles.cardHeading}>A entrar no AppStaff…</h2>
          <p className={styles.cardText}>
            Será redirecionado automaticamente em instantes.
          </p>
          <a href="/app/staff/home" className={styles.linkGold}>
            Entrar agora →
          </a>
        </div>
      )}

      {/* Desktop terminals: instructions to open the desktop app */}
      {isDesktopTerminal && (
        <div className={styles.card}>
          <h2 className={styles.cardHeading}>Próximo passo</h2>
          <ol className={styles.stepsList}>
            <li>
              Descarregue a aplicação <strong>ChefIApp {terminal?.type}</strong>{" "}
              se ainda não o fez
            </li>
            <li>Abra a aplicação desktop neste computador</li>
            <li>
              O dispositivo será reconhecido automaticamente pelo terminal ID
            </li>
          </ol>
        </div>
      )}

      {/* Non-mobile, non-desktop fallback */}
      {!isMobileTerminal && !isDesktopTerminal && (
        <div className={styles.card}>
          <h2 className={styles.cardHeading}>Próximo passo</h2>
          <p className={styles.cardText}>
            Abra a aplicação ChefIApp no seu dispositivo. O terminal será
            reconhecido automaticamente.
          </p>
        </div>
      )}
    </div>
  );
}
