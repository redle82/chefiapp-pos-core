import { create } from "zustand";

/**
 * OperationalState — estado transversal de operação para TPV / KDS / painéis.
 *
 * Fase 1: muitos campos podem ser alimentados por mocks ou derivação local
 * dentro do TPV. A interface é pensada para ser estável quando integrarmos
 * Core / Supabase / Task System.
 */

export type KitchenStatus = "GREEN" | "YELLOW" | "RED";

export interface OperationalKpisState {
  /** Receita bruta do dia em cêntimos. */
  dailyRevenueCents: number;
  /** Quantidade de pedidos atualmente ativos (não entregues / cancelados). */
  activeOrdersCount: number;
  /** Ticket médio em cêntimos (receita / nº de pedidos concluídos). */
  averageTicketCents: number;
  /** Semáforo da cozinha, derivado de tempos médios de preparação. */
  kitchenStatus: KitchenStatus;
}

export type OperationalOrderStatus =
  | "IDLE"
  | "DRAFT"
  | "NOT_SENT"
  | "SENT"
  | "PREPARING"
  | "READY"
  | "PAID"
  | "CANCELLED";

export interface OperationalCurrentOrderState {
  orderId?: string | null;
  status: OperationalOrderStatus;
  /** Quando o pedido foi iniciado no TPV. */
  startedAt?: string | null;
  /** Quando foi enviado para cozinha/KDS. */
  sentToKitchenAt?: string | null;
  /** Quando foi marcado como pronto (READY). */
  readyAt?: string | null;
  /** Quando foi pago. */
  paidAt?: string | null;
  /** Modo do pedido (dine_in, take_away, delivery, etc.). */
  mode?: string | null;
  /** Número / nome da mesa, quando aplicável. */
  tableNumber?: string | null;
  /** UUID da mesa (gm_tables.id), para ocupação automática. */
  tableId?: string | null;
}

export interface OperationalKitchenState {
  /** Tempo médio de preparação em segundos (média móvel). */
  avgPrepTimeSeconds?: number | null;
  /** Quantidade de pedidos atrasados acima de um certo limiar. */
  delayedOrdersCount: number;
}

export interface OperationalStockSignals {
  currentQty: number | null;
  criticalThreshold: number | null;
  isUnavailable: boolean;
  /** Margem percentual aproximada (0–100). */
  marginPct?: number | null;
  /** Stock total (before reservations). */
  stockTotal?: number;
  /** Quantity reserved by open orders (not yet finalized). */
  stockReserved?: number;
}

export type OperationalStockState = Record<string, OperationalStockSignals>;

export type HardwareStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

export interface PrinterStatus {
  status: HardwareStatus;
  lastPrintAt?: string | null;
}

export interface OperationalHardwareState {
  /** Estado por estação (cozinha, bar, pass, etc.). */
  printerStatusByStation: Record<string, PrinterStatus>;
}

export interface OperationalTasksSummary {
  /** Texto curto para missão ativa atual (ex.: \"50 pedidos no turno\"). */
  activeMissionTitle?: string;
  /** Progresso da missão de 0–1 (0%–100%). */
  activeMissionProgress?: number;
  /** Receita/meta do turno, para barra de progresso. */
  shiftGoalTargetCents?: number;
  shiftGoalCurrentCents?: number;
}

export interface OperationalTasksState {
  missionsSummary: OperationalTasksSummary | null;
}

export interface OperationalState {
  kpis: OperationalKpisState;
  currentOrder: OperationalCurrentOrderState;
  kitchen: OperationalKitchenState;
  stock: OperationalStockState;
  hardware: OperationalHardwareState;
  tasks: OperationalTasksState;

  // Setters básicos (Fase 1: alimentados pelo TPV / mocks).
  setKpis: (partial: Partial<OperationalKpisState>) => void;
  setCurrentOrder: (partial: Partial<OperationalCurrentOrderState>) => void;
  resetCurrentOrder: () => void;
  setKitchenMetrics: (partial: Partial<OperationalKitchenState>) => void;
  updateStock: (
    productId: string,
    partial: Partial<OperationalStockSignals>,
  ) => void;
  setPrinterStatus: (stationId: string, status: PrinterStatus) => void;
  setTasksSummary: (partial: Partial<OperationalTasksSummary>) => void;
}

const initialCurrentOrder: OperationalCurrentOrderState = {
  orderId: null,
  status: "IDLE",
  startedAt: null,
  sentToKitchenAt: null,
  readyAt: null,
  paidAt: null,
  mode: null,
  tableNumber: null,
  tableId: null,
};

export const useOperationalStore = create<OperationalState>((set, get) => ({
  kpis: {
    dailyRevenueCents: 0,
    activeOrdersCount: 0,
    averageTicketCents: 0,
    kitchenStatus: "GREEN",
  },
  currentOrder: initialCurrentOrder,
  kitchen: {
    avgPrepTimeSeconds: null,
    delayedOrdersCount: 0,
  },
  stock: {},
  hardware: {
    printerStatusByStation: {},
  },
  tasks: {
    missionsSummary: null,
  },

  setKpis(partial) {
    set((state) => ({
      kpis: { ...state.kpis, ...partial },
    }));
  },

  setCurrentOrder(partial) {
    set((state) => ({
      currentOrder: { ...state.currentOrder, ...partial },
    }));
  },

  resetCurrentOrder() {
    set({ currentOrder: initialCurrentOrder });
  },

  setKitchenMetrics(partial) {
    set((state) => ({
      kitchen: { ...state.kitchen, ...partial },
    }));
  },

  updateStock(productId, partial) {
    set((state) => {
      const existing = state.stock[productId] ?? {
        currentQty: null,
        criticalThreshold: null,
        isUnavailable: false,
        marginPct: null,
        stockTotal: 999,
        stockReserved: 0,
      };
      return {
        stock: {
          ...state.stock,
          [productId]: { ...existing, ...partial },
        },
      };
    });
  },

  setPrinterStatus(stationId, status) {
    set((state) => ({
      hardware: {
        ...state.hardware,
        printerStatusByStation: {
          ...state.hardware.printerStatusByStation,
          [stationId]: status,
        },
      },
    }));
  },

  setTasksSummary(partial) {
    set((state) => ({
      tasks: {
        missionsSummary: {
          ...(state.tasks.missionsSummary ?? {}),
          ...partial,
        },
      },
    }));
  },
}));
