/**
 * DesktopLaunchService — fonte de verdade para o estado de launch de módulos
 * de desktop (TPV/KDS) a partir do admin web (/admin/modules).
 *
 * Importante: esta camada é puramente funcional em termos de estados /
 * transições. Os efeitos colaterais (deep link + blur/timeout) são
 * encapsulados em helpers específicos.
 */

export type DesktopModuleId = "tpv" | "kds";

export type DesktopLaunchState =
  | "UNKNOWN"
  | "DESKTOP_INSTALLER_UNCONFIGURED"
  | "DESKTOP_DETECTED"
  | "DESKTOP_READY"
  | "LAUNCHING"
  | "LAUNCH_FAILED";

export type DesktopLaunchEvent =
  | { type: "BOOTSTRAP" }
  | { type: "CLICK_OPEN" }
  | { type: "HANDSHAKE_SUCCESS" }
  | { type: "HANDSHAKE_TIMEOUT" };

export interface DesktopLaunchContext {
  moduleId: DesktopModuleId;
  restaurantId: string;
  /** Se existe qualquer URL de instalador configurado para este ambiente. */
  hasAnyInstallerUrl: boolean;
  /** Se o healthcheck do Desktop Bridge retornou ok. */
  desktopHealthOk?: boolean;
}

const STORAGE_KEY_PREFIX = "desktopLaunchSuccess:";
const ACK_BACKEND_DOWN_UNTIL_KEY = "desktopLaunchAckBackendDownUntil";
const ACK_BACKEND_COOLDOWN_MS = 15_000;

function getAppOriginKey(): string {
  if (typeof window === "undefined" || !window.location?.origin) {
    return "unknown-origin";
  }
  return window.location.origin;
}

function ttlMsFromEnv(): number {
  const raw = import.meta.env.VITE_DESKTOP_LAUNCH_TTL_DAYS;
  const parsed = raw ? Number.parseInt(String(raw), 10) : NaN;
  const days = Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
  return days * 24 * 60 * 60 * 1000;
}

function buildStorageKey(
  moduleId: DesktopModuleId,
  restaurantId: string,
): string {
  const origin = getAppOriginKey();
  return `${STORAGE_KEY_PREFIX}${origin}:${moduleId}:${restaurantId}`;
}

function getAckBackendDownUntil(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(ACK_BACKEND_DOWN_UNTIL_KEY);
    if (!raw) return 0;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function markAckBackendOffline(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      ACK_BACKEND_DOWN_UNTIL_KEY,
      String(Date.now() + ACK_BACKEND_COOLDOWN_MS),
    );
  } catch {
    // ignore storage errors
  }
}

function clearAckBackendOfflineMark(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ACK_BACKEND_DOWN_UNTIL_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getLastLaunchSuccessAt(
  moduleId: DesktopModuleId,
  restaurantId: string,
): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      buildStorageKey(moduleId, restaurantId),
    );
    if (!raw) return null;
    const value = Number.parseInt(raw, 10);
    if (!Number.isFinite(value)) return null;
    const ttl = ttlMsFromEnv();
    if (Date.now() - value > ttl) return null;
    return value;
  } catch {
    return null;
  }
}

export function setLastLaunchSuccessAt(
  moduleId: DesktopModuleId,
  restaurantId: string,
  ts: number,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      buildStorageKey(moduleId, restaurantId),
      String(ts),
    );
  } catch {
    // ignore storage errors
  }
}

export interface DesktopLaunchMachine {
  state: DesktopLaunchState;
  context: DesktopLaunchContext;
}

/** Deriva o estado inicial a partir do contexto. */
export function deriveInitialState(
  context: DesktopLaunchContext,
): DesktopLaunchState {
  // Healthcheck positivo — o Desktop Bridge respondeu na porta 4310.
  // Tem prioridade sobre tudo: sabemos que a app está instalada e a correr.
  if (context.desktopHealthOk) {
    return "DESKTOP_DETECTED";
  }

  // Sem URLs de instalador configuradas, o Desktop não foi distribuído neste
  // ambiente (DEV local ou PROD sem release).  Nenhum handshake faz sentido
  // — mostramos instrução imediata ao utilizador.
  // localStorage (lastSuccess) é irrelevante: pode existir de sessões
  // anteriores com a app instalada que entretanto foi removida/rebuilt.
  if (!context.hasAnyInstallerUrl) {
    return "DESKTOP_INSTALLER_UNCONFIGURED";
  }
  return "DESKTOP_READY";
}

/** Transições puras da state machine. */
export function transitionDesktopLaunch(
  machine: DesktopLaunchMachine,
  event: DesktopLaunchEvent,
): DesktopLaunchMachine {
  const { state, context } = machine;

  switch (event.type) {
    case "BOOTSTRAP": {
      const next = deriveInitialState(context);
      return { state: next, context };
    }

    case "CLICK_OPEN": {
      if (state === "DESKTOP_INSTALLER_UNCONFIGURED") {
        // Não tentamos abrir deep link sem instalador configurado.
        return machine;
      }
      if (state === "LAUNCHING") {
        // Debounce: já existe um launch em progresso.
        return machine;
      }
      if (
        state === "DESKTOP_DETECTED" ||
        state === "DESKTOP_READY" ||
        state === "LAUNCH_FAILED"
      ) {
        return { state: "LAUNCHING", context };
      }
      return machine;
    }

    case "HANDSHAKE_SUCCESS": {
      // Voltamos sempre para READY (app de desktop respondeu).
      return { state: "DESKTOP_READY", context };
    }

    case "HANDSHAKE_TIMEOUT": {
      if (state === "LAUNCHING") {
        return { state: "LAUNCH_FAILED", context };
      }
      return machine;
    }

    default:
      return machine;
  }
}

export interface DeepLinkHandshakeOptions {
  url: string;
  timeoutMs?: number;
  moduleId: DesktopModuleId;
  restaurantId: string;
  onSuccess: () => void;
  onTimeout: () => void;
}

function getDesktopLaunchAckBase(): string {
  const raw = import.meta.env.VITE_DESKTOP_LAUNCH_ACK_BASE;
  return raw?.trim() ?? "";
}

function generateNonce(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      // @ts-expect-error randomUUID existe em browsers modernos
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `dl_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Executa o deep link com handshake determinístico baseado em ACK.
 * Não conhece React; callbacks são fornecidos pelo chamador.
 *
 * Regra dura: blur/visibility NUNCA são considerados prova de sucesso.
 * Sucesso = ACK explícito dentro do timeout configurado.
 */
export function launchDesktopWithHandshake(
  options: DeepLinkHandshakeOptions,
): void {
  const {
    url,
    timeoutMs = 5000,
    moduleId,
    restaurantId,
    onSuccess,
    onTimeout,
  } = options;

  if (typeof window === "undefined") return;

  const startedAt = Date.now();
  let iframe: HTMLIFrameElement | null = null;
  let resolved = false;

  const nonce = generateNonce();
  const urlObj = new URL(url);
  urlObj.searchParams.set("nonce", nonce);
  const finalUrl = urlObj.toString();

  const cleanup = () => {
    window.clearTimeout(timeoutId);
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    iframe = null;
  };

  const timeoutId = window.setTimeout(() => {
    if (resolved) return;
    cleanup();
    // Timeout: assumimos falha de launch.
    if (import.meta.env.MODE !== "development") {
      // eslint-disable-next-line no-console
      console.info("[DesktopLaunch] timeout", {
        moduleId,
        restaurantId,
        url,
        elapsedMs: Date.now() - startedAt,
        timeoutMs,
        origin: getAppOriginKey(),
      });
    }
    onTimeout();
  }, timeoutMs);

  const ackBaseRaw = getDesktopLaunchAckBase();
  const ackBackendDownUntil = getAckBackendDownUntil();
  const shouldPollAck = ackBaseRaw && Date.now() >= ackBackendDownUntil;

  if (shouldPollAck) {
    const ackBase = ackBaseRaw.replace(/\/+$/, "");
    const ackUrl = `${ackBase}/${encodeURIComponent(nonce)}`;

    // Regra anti-spam: máx. 2 tentativas com intervalos generosos.
    // Damos tempo ao Desktop para processar o deep link e enviar o ACK
    // ao gateway. Isso evita cascatas de 404 no console quando o gateway
    // está a correr mas o Desktop ainda não respondeu.
    const pollDelays = [1500, 2000]; // 1ª a 1.5s, 2ª a 3.5s total

    const pollAck = async () => {
      for (const delay of pollDelays) {
        if (resolved) return;
        await new Promise<void>((r) => window.setTimeout(r, delay));
        if (resolved) return;
        try {
          const res = await fetch(ackUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            const data = (await res.json()) as { found?: boolean };
            if (data?.found) {
              resolved = true;
              cleanup();
              clearAckBackendOfflineMark();
              setLastLaunchSuccessAt(moduleId, restaurantId, Date.now());
              onSuccess();
              return;
            }
          }
        } catch {
          // Gateway offline/refused: avoid repeating noisy attempts for a short cooldown window.
          markAckBackendOffline();
          break;
        }
      }
      // All polls exhausted without ACK — timeout handler fires at timeoutMs.
    };

    void pollAck();
  }

  // Dispara o handler de protocolo registado (Electron) sem navegar a página.
  try {
    iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = finalUrl;
    document.body.appendChild(iframe);
  } catch {
    // Fallback: manter comportamento antigo caso o DOM não esteja disponível.
    window.location.href = url;
  }
}
