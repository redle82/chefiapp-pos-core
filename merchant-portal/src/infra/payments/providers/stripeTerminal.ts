/**
 * Stripe Terminal Provider
 *
 * Provider para pagamentos presenciais via Stripe Terminal SDK.
 * Suporta leitores físicos (internet) e simulados (dev).
 *
 * Requer:
 * - @stripe/terminal-js (npm install @stripe/terminal-js)
 * - Backend RPC `create_terminal_connection_token` no Core
 *
 * Nunca expõe a secret key no frontend — o connection token
 * é obtido via Core RPC a cada sessão do terminal.
 */

import type { Currency, PaymentMethod, PaymentRegion } from "@domain/payment";
import { Logger } from "../../../core/logger";
import { PaymentBroker } from "../../../core/payment/PaymentBroker";
import { dockerCoreClient } from "../../docker-core/connection";
import type {
  CancelPaymentResult,
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
  RefundPaymentResult,
} from "../interface";

// ─── Stripe Terminal SDK Types ──────────────────────────────────────
// These mirror @stripe/terminal-js types. We define them locally to
// avoid build failures when the package is not yet installed.

interface StripeTerminal {
  discoverReaders(
    config: DiscoverReadersConfig,
  ): Promise<DiscoverReadersResult>;
  connectReader(
    reader: StripeReader,
    config?: ConnectReaderConfig,
  ): Promise<ConnectReaderResult>;
  disconnectReader(): Promise<DisconnectResult>;
  collectPaymentMethod(
    clientSecret: string,
  ): Promise<CollectPaymentMethodResult>;
  processPayment(
    paymentIntent: StripePaymentIntent,
  ): Promise<ProcessPaymentResult>;
  cancelCollectPaymentMethod(): Promise<CancelCollectResult>;
  clearCachedCredentials(): Promise<void>;
  getConnectionStatus(): TerminalConnectionStatus;
  getPaymentStatus(): TerminalPaymentStatus;
}

type TerminalConnectionStatus = "connecting" | "connected" | "not_connected";
type TerminalPaymentStatus =
  | "not_ready"
  | "ready"
  | "waiting_for_input"
  | "processing";

interface DiscoverReadersConfig {
  simulated?: boolean;
  location?: string;
}

interface DiscoverReadersResult {
  discoveredReaders?: StripeReader[];
  error?: StripeTerminalError;
}

interface ConnectReaderConfig {
  failIfInUse?: boolean;
}

interface ConnectReaderResult {
  reader?: StripeReader;
  error?: StripeTerminalError;
}

interface DisconnectResult {
  error?: StripeTerminalError;
}

interface CollectPaymentMethodResult {
  paymentIntent?: StripePaymentIntent;
  error?: StripeTerminalError;
}

interface ProcessPaymentResult {
  paymentIntent?: StripePaymentIntent;
  error?: StripeTerminalError;
}

interface CancelCollectResult {
  error?: StripeTerminalError;
}

interface StripeTerminalError {
  code?: string;
  message: string;
  decline_code?: string;
}

interface StripeReader {
  id: string;
  object: string;
  device_type: string;
  label: string;
  serial_number: string;
  status: "online" | "offline";
  location?: string;
  ip_address?: string;
  livemode: boolean;
}

interface StripePaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  client_secret?: string;
}

// ─── Public Reader Info ─────────────────────────────────────────────

export interface ReaderInfo {
  id: string;
  label: string;
  serialNumber: string;
  deviceType: string;
  status: "online" | "offline";
  ipAddress: string | null;
}

// ─── Connection Token Fetcher ───────────────────────────────────────

/**
 * Fetches a connection token from the Core backend.
 * The Stripe Terminal SDK requires a fresh token for each session.
 * This MUST come from the backend — never expose the Stripe secret key.
 */
async function fetchConnectionToken(): Promise<string> {
  const result = await dockerCoreClient.rpc(
    "create_terminal_connection_token",
    {},
  );

  if (result.error) {
    Logger.error(
      "[StripeTerminal] Failed to fetch connection token:",
      result.error,
    );
    throw new Error(
      `Falha ao obter token de conexão: ${result.error.message}`,
    );
  }

  const data = result.data as { secret?: string } | null;
  if (!data?.secret) {
    throw new Error("Core não retornou connection token");
  }

  return data.secret;
}

// ─── Helper: Map Stripe Reader to ReaderInfo ────────────────────────

function mapReaderInfo(reader: StripeReader): ReaderInfo {
  return {
    id: reader.id,
    label: reader.label || reader.serial_number,
    serialNumber: reader.serial_number,
    deviceType: reader.device_type,
    status: reader.status,
    ipAddress: reader.ip_address ?? null,
  };
}

// ─── Provider ───────────────────────────────────────────────────────

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || null;

export class StripeTerminalProvider implements PaymentProvider {
  readonly id: PaymentMethod = "card_present" as PaymentMethod;
  readonly name = "Cartão (Terminal)";
  readonly supportedRegions: PaymentRegion[] = ["PT", "ES", "EU", "US", "GB"];
  readonly supportedCurrencies: Currency[] = ["EUR", "USD", "GBP"];

  private terminal: StripeTerminal | null = null;
  private connectedReader: StripeReader | null = null;
  private initialized = false;

  /**
   * Initialize the Stripe Terminal SDK.
   * Loads the SDK lazily and creates a terminal instance
   * with the connection token fetcher.
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.terminal) {
      return;
    }

    try {
      // Dynamic import — @stripe/terminal-js must be installed
      // If not installed, this will throw at runtime
      const { loadStripeTerminal } = await import("@stripe/terminal-js");
      const StripeTerminalFactory = await loadStripeTerminal();

      if (!StripeTerminalFactory) {
        throw new Error("Stripe Terminal SDK não carregou");
      }

      this.terminal = StripeTerminalFactory.create({
        onFetchConnectionToken: fetchConnectionToken,
        onUnexpectedReaderDisconnect: () => {
          Logger.warn("[StripeTerminal] Reader disconnected unexpectedly");
          this.connectedReader = null;
        },
      }) as unknown as StripeTerminal;

      this.initialized = true;
      Logger.info("[StripeTerminal] SDK initialized");
    } catch (error) {
      Logger.error("[StripeTerminal] Failed to initialize:", error);
      throw new Error(
        `Falha ao inicializar terminal: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  }

  /**
   * Discover nearby card readers.
   *
   * @param method - 'simulated' for dev testing, 'internet' for real readers
   * @returns Array of discovered readers
   */
  async discoverReaders(
    method: "simulated" | "internet" = "internet",
  ): Promise<ReaderInfo[]> {
    await this.ensureInitialized();

    const result = await this.terminal!.discoverReaders({
      simulated: method === "simulated",
    });

    if (result.error) {
      Logger.error("[StripeTerminal] Discovery error:", result.error);
      throw new Error(
        `Erro ao procurar leitores: ${result.error.message}`,
      );
    }

    const readers = result.discoveredReaders ?? [];
    Logger.info(`[StripeTerminal] Discovered ${readers.length} reader(s)`);

    return readers.map(mapReaderInfo);
  }

  /**
   * Connect to a specific card reader by ID.
   * Requires prior discovery to have the reader object.
   */
  async connectReader(readerInfo: ReaderInfo): Promise<void> {
    await this.ensureInitialized();

    // Discover to get the raw Stripe reader object
    const discovery = await this.terminal!.discoverReaders({
      simulated: false,
    });
    const rawReader = discovery.discoveredReaders?.find(
      (r) => r.id === readerInfo.id,
    );

    if (!rawReader) {
      throw new Error(`Leitor ${readerInfo.id} não encontrado`);
    }

    const result = await this.terminal!.connectReader(rawReader, {
      failIfInUse: true,
    });

    if (result.error) {
      Logger.error("[StripeTerminal] Connection error:", result.error);
      throw new Error(
        `Erro ao conectar ao leitor: ${result.error.message}`,
      );
    }

    this.connectedReader = result.reader ?? null;
    Logger.info(
      `[StripeTerminal] Connected to reader: ${this.connectedReader?.label}`,
    );
  }

  /**
   * Disconnect from the currently connected reader.
   */
  async disconnectReader(): Promise<void> {
    if (!this.terminal || !this.connectedReader) {
      return;
    }

    const result = await this.terminal.disconnectReader();
    if (result.error) {
      Logger.error("[StripeTerminal] Disconnect error:", result.error);
      throw new Error(
        `Erro ao desconectar leitor: ${result.error.message}`,
      );
    }

    this.connectedReader = null;
    Logger.info("[StripeTerminal] Reader disconnected");
  }

  /**
   * Create a payment intent and collect payment from the card reader.
   *
   * Flow:
   * 1. Create PaymentIntent via Core (PaymentBroker)
   * 2. Collect payment method from reader
   * 3. Process the payment
   */
  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    try {
      await this.ensureInitialized();
      this.ensureReaderConnected();

      // Step 1: Create PaymentIntent via Core
      const intentResult = await PaymentBroker.createPaymentIntent({
        orderId: params.orderId,
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        restaurantId: params.restaurantId,
        operatorId: params.operatorId,
        cashRegisterId: params.cashRegisterId,
      });

      const clientSecret = intentResult.clientSecret;

      // Step 2: Collect payment method from reader
      const collectResult =
        await this.terminal!.collectPaymentMethod(clientSecret);
      if (collectResult.error) {
        return {
          success: false,
          paymentId: intentResult.id,
          error: `Erro na leitura do cartão: ${collectResult.error.message}`,
        };
      }

      if (!collectResult.paymentIntent) {
        return {
          success: false,
          paymentId: intentResult.id,
          error: "PaymentIntent não retornado após leitura",
        };
      }

      // Step 3: Process the payment
      const processResult = await this.terminal!.processPayment(
        collectResult.paymentIntent,
      );
      if (processResult.error) {
        return {
          success: false,
          paymentId: intentResult.id,
          error: `Erro ao processar pagamento: ${processResult.error.message}`,
        };
      }

      const finalIntent = processResult.paymentIntent;
      const succeeded =
        finalIntent?.status === "succeeded" ||
        finalIntent?.status === "requires_capture";

      return {
        success: succeeded,
        paymentId: intentResult.id,
        clientSecret,
        error: succeeded
          ? undefined
          : `Status inesperado: ${finalIntent?.status}`,
      };
    } catch (error) {
      Logger.error("[StripeTerminal] createPayment error:", error);
      return {
        success: false,
        paymentId: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Collect payment method from the connected card reader.
   * Used when the PaymentIntent is already created externally.
   */
  async collectPayment(clientSecret: string): Promise<StripePaymentIntent> {
    await this.ensureInitialized();
    this.ensureReaderConnected();

    const collectResult =
      await this.terminal!.collectPaymentMethod(clientSecret);
    if (collectResult.error) {
      throw new Error(
        `Erro na leitura do cartão: ${collectResult.error.message}`,
      );
    }

    if (!collectResult.paymentIntent) {
      throw new Error("PaymentIntent não retornado após leitura");
    }

    const processResult = await this.terminal!.processPayment(
      collectResult.paymentIntent,
    );
    if (processResult.error) {
      throw new Error(
        `Erro ao processar pagamento: ${processResult.error.message}`,
      );
    }

    if (!processResult.paymentIntent) {
      throw new Error("PaymentIntent não retornado após processamento");
    }

    return processResult.paymentIntent;
  }

  /**
   * Cancel the current payment collection on the reader.
   */
  async cancelCollect(): Promise<void> {
    if (!this.terminal) {
      return;
    }

    const result = await this.terminal.cancelCollectPaymentMethod();
    if (result.error) {
      Logger.error("[StripeTerminal] Cancel collect error:", result.error);
      throw new Error(
        `Erro ao cancelar leitura: ${result.error.message}`,
      );
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    // Terminal payments are synchronous — status is known at collection time.
    // For post-payment checks, query the Core backend.
    return {
      success: true,
      status: "completed",
      paymentId,
    };
  }

  async cancelPayment(_paymentId: string): Promise<CancelPaymentResult> {
    try {
      await this.cancelCollect();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async refundPayment(
    _paymentId: string,
    _amount?: number,
  ): Promise<RefundPaymentResult> {
    // Refunds for Terminal payments must go through the backend (server-side).
    return {
      success: false,
      error:
        "Reembolsos de Terminal devem ser processados pelo backend. Use o painel administrativo.",
    };
  }

  isAvailable(): boolean {
    return !!STRIPE_KEY;
  }

  /** Whether a reader is currently connected */
  isReaderConnected(): boolean {
    return this.connectedReader !== null;
  }

  /** Get info about the connected reader, or null */
  getReaderInfo(): ReaderInfo | null {
    if (!this.connectedReader) {
      return null;
    }
    return mapReaderInfo(this.connectedReader);
  }

  // ─── Private Helpers ────────────────────────────────────────────

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.terminal) {
      await this.initialize();
    }
  }

  private ensureReaderConnected(): void {
    if (!this.connectedReader) {
      throw new Error(
        "Nenhum leitor conectado. Conecte um leitor antes de processar pagamentos.",
      );
    }
  }
}

export const stripeTerminalProvider = new StripeTerminalProvider();
