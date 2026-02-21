import React from "react";
import { currencyService } from "../../core/currency/CurrencyService";
import { cn } from "./tokens";

// 🚫 STOP: No imports from L6 (nervous-system) allowed here.
// import { usePulse } from '../../intelligence/nervous-system/usePulse';
import "./OrderCard.css";

export type PulseState =
  | "satisfied"
  | "digesting"
  | "orphan"
  | "hungry"
  | "signaling";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface OrderCardProps {
  orderId: string;
  tableNumber?: number | string;
  status: "new" | "preparing" | "ready" | "served" | "paid";
  items: OrderItem[];
  total: number;
  createdAt?: Date | string | number;
  onClick?: () => void;
  onAction?: (action: "send" | "ready" | "close") => void;
  onRetry?: () => void;
  compact?: boolean;
  "data-status"?: "queued" | "syncing" | "failed" | "applied" | string;
  lastError?: string;

  // 🧠 Intelligence Injection (L6 -> L3 via Props)
  pulseState?: PulseState; // Pure visual prop, no logic dependency

  timeline?: {
    label: string;
    detail?: string;
    ts: number;
    tone?: "info" | "warn" | "error" | "success";
  }[];

  // 🔗 Hydra: External Source
  serviceSource?: "ubereats" | "glovo" | "deliveroo" | "other";
  externalReference?: string;
}

const pulseColors: Record<PulseState, string> = {
  satisfied: "border-transparent",
  digesting: "border-yellow-500/50",
  orphan: "border-red-500",
  hungry: "border-orange-500",
  signaling: "border-blue-500", // Future
};

/**
 * OrderCard: Display order for TPV (Point of Sale)
 * Status visual: new (white) → preparing (blue) → ready (green) → served (gray)
 */
export const OrderCard: React.FC<OrderCardProps> = ({
  orderId,
  tableNumber,
  status,
  items,
  total,
  onClick,
  onAction,
  onRetry, // Destructure
  compact = false,
  "data-status": dataStatus,
  pulseState, // Injected Prop
  ...props
}) => {
  const statusLabels = {
    new: "Novo",
    preparing: "Em Preparo",
    ready: "Pronto",
    served: "Servido",
    paid: "Pago",
  };

  const statusColors = {
    new: "#ffffff",
    preparing: "#2196F3",
    ready: "#4CAF50",
    served: "#9E9E9E",
    paid: "#616161",
  };

  // 🎨 Visual Reflex: Apply border color if pulse exists
  const activeBorder = pulseState ? pulseColors[pulseState] : undefined;
  // If pulse is 'satisfied' (transparent) or undefined, use status color as left border default.
  // Actually, the CSS likely handles the main border. We just want to override or augment.
  // Let's keep the existing logic but respect the prop.

  // 🎨 Dark Cockpit Visuals
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-xl transition-all duration-200 group shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        // Base Dark Style (Zinc-900)
        "bg-[#18181b] shadow-black/50",
        // Compact mode overrides
        compact ? "p-3" : "p-5",
        // Pulse Effect (if needed) - augmenting border
        activeBorder ? `ring-1 ${activeBorder}` : "",
      )}
      onClick={onClick}
      style={{
        borderLeft: `6px solid ${statusColors[status]}`,
        minHeight: compact ? 100 : 200,
      }}
      data-status={dataStatus}
      data-testid="order-card"
    >
      {/* Header: ID + Timer + Table */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-black text-white tracking-tighter leading-none group-hover:text-emerald-400 transition-colors">
              {orderId}
            </span>
            {tableNumber && (
              <span className="bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Mesa {tableNumber}
              </span>
            )}
            {/* 🔗 Hydra Badge */}
            {props.serviceSource === "ubereats" && (
              <span className="bg-[#06C167]/20 border border-[#06C167]/50 text-[#06C167] text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                UBER
              </span>
            )}
            {props.serviceSource === "glovo" && (
              <span className="bg-[#FFC244]/20 border border-[#FFC244]/50 text-[#FFC244] text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                GLOVO
              </span>
            )}
          </div>
          {/* Timer Placeholder (Mocked based on createdAt) */}
          <div className="text-xs text-zinc-500 font-bold font-mono mt-1.5 flex items-center gap-1.5 uppercase tracking-wide">
            <span
              className={
                status === "preparing" ? "text-amber-500 animate-pulse" : ""
              }
            >
              ⏱ 12:45
            </span>
            {status === "preparing" && <span>• Em Preparo</span>}
          </div>
        </div>

        {/* Status Text (No Pill) */}
        <div
          className={cn(
            "text-xs font-black uppercase tracking-widest text-right",
            status === "new" && "text-amber-500 animate-pulse", // Action Necessary
            status === "preparing" && "text-blue-400",
            status === "ready" && "text-emerald-400",
            status === "served" && "text-zinc-600",
            status === "paid" && "text-zinc-600",
          )}
        >
          {statusLabels[status]}
        </div>
      </div>

      {/* Items (Middle) */}
      {!compact && (
        <div className="flex-1 space-y-2 mb-4 overflow-y-auto max-h-30 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-start text-sm"
            >
              <span className="text-neutral-300 font-medium leading-tight">
                <span className="text-neutral-500 mr-1">{item.quantity}x</span>
                {item.name}
              </span>
              {/* Price per item optional, usually not needed in cockpit view */}
            </div>
          ))}
        </div>
      )}

      {/* Footer: Details & Actions */}
      <div className="pt-3 border-t border-neutral-800 mt-auto">
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">
              Total
            </span>
            <span className="text-xl font-bold text-amber-500 font-mono">
              {currencyService.formatAmount(Math.round(total * 100))}
            </span>
          </div>

          {/* If Failed */}
          {dataStatus === "failed" && (
            <span className="bg-red-900/50 border border-red-800 text-red-400 text-xs px-2 py-1 rounded flex items-center gap-1">
              ⚠️ Falha Sync
            </span>
          )}
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 gap-2">
          {dataStatus === "failed" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry?.();
              }}
              className="w-full bg-red-600 hover:bg-red-500 text-white text-base font-bold py-3 rounded-lg transition-colors shadow-lg shadow-red-900/20"
            >
              Recuperar
            </button>
          ) : (
            <>
              {status === "new" && onAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction("send");
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white text-sm font-black uppercase tracking-wider py-3 rounded-lg transition-all shadow-lg shadow-amber-900/20 active:translate-y-0.5"
                >
                  Enviar Cozinha ►
                </button>
              )}
              {status === "preparing" && onAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction("ready");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-wider py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:translate-y-0.5"
                >
                  Marcar Pronto ✓
                </button>
              )}
              {(status === "ready" || status === "served") && onAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction("close");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black uppercase tracking-wider py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:translate-y-0.5"
                >
                  Receber / Fechar $
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
