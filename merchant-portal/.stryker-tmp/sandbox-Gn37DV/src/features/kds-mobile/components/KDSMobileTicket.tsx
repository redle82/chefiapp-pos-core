/**
 * KDSMobileTicket — Mobile-optimized KDS ticket card
 *
 * - SLA timer with color coding
 * - Order items list
 * - Swipe gestures: right to start, left to complete
 */

import { motion, type PanInfo } from "framer-motion";
import { useEffect, useState } from "react";

export interface KDSTicketItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  modifications?: string;
}

export interface KDSTicketData {
  id: string;
  orderNumber: string | number;
  orderType?: "dine_in" | "take_away" | "delivery";
  items: KDSTicketItem[];
  createdAt: Date | string;
  status: "pending" | "preparing" | "ready";
  tableNumber?: string | number;
}

interface KDSMobileTicketProps {
  ticket: KDSTicketData;
  onStartPreparing: (ticketId: string) => void;
  onMarkReady: (ticketId: string) => void;
}

function formatElapsed(createdAt: Date | string): string {
  const timestamp =
    typeof createdAt === "string"
      ? new Date(createdAt).getTime()
      : createdAt.getTime();
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "< 1m";
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }
  return `${mins}m`;
}

function getSLAState(createdAt: Date | string): "green" | "yellow" | "red" {
  const timestamp =
    typeof createdAt === "string"
      ? new Date(createdAt).getTime()
      : createdAt.getTime();
  const diff = Date.now() - timestamp;
  const mins = diff / 60000;
  if (mins < 5) return "green";
  if (mins < 10) return "yellow";
  return "red";
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: "🍽️ Mesa",
  take_away: "🛍️ Take Away",
  delivery: "🚗 Delivery",
  "": "📋 Pedido",
};

export function KDSMobileTicket({
  ticket,
  onStartPreparing,
  onMarkReady,
}: KDSMobileTicketProps) {
  const [elapsed, setElapsed] = useState(formatElapsed(ticket.createdAt));
  const [sla, setSla] = useState<"green" | "yellow" | "red">(
    getSLAState(ticket.createdAt),
  );
  const [isDragging, setIsDragging] = useState(false);

  // Update timer every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(ticket.createdAt));
      setSla(getSLAState(ticket.createdAt));
    }, 10000);
    return () => clearInterval(interval);
  }, [ticket.createdAt]);

  // Handle swipe gestures
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const swipeThreshold = 100;

    // Swipe right → start preparing (if pending)
    if (ticket.status === "pending" && info.offset.x > swipeThreshold) {
      onStartPreparing(ticket.id);
    }
    // Swipe left → mark ready (if preparing)
    else if (ticket.status === "preparing" && info.offset.x < -swipeThreshold) {
      onMarkReady(ticket.id);
    }

    setIsDragging(false);
  };

  // Visual hint based on status
  const swipeHint =
    ticket.status === "pending"
      ? "Arraste → para iniciar"
      : ticket.status === "preparing"
      ? "← Arraste para finalizar"
      : null;

  return (
    <motion.article
      className={`kdsm-ticket kdsm-ticket--${sla}`}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      animate={{ scale: isDragging ? 0.98 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <header className="kdsm-ticket__header">
        <div className="kdsm-ticket__order-info">
          <span className="kdsm-ticket__number">#{ticket.orderNumber}</span>
          <span className="kdsm-ticket__type">
            {ticket.orderType
              ? ORDER_TYPE_LABELS[ticket.orderType] || ticket.orderType
              : ORDER_TYPE_LABELS[""]}
            {ticket.tableNumber && ` ${ticket.tableNumber}`}
          </span>
        </div>
        <span className={`kdsm-ticket__timer kdsm-ticket__timer--${sla}`}>
          {elapsed}
        </span>
      </header>

      <ul className="kdsm-ticket__items">
        {ticket.items.map((item) => (
          <li key={item.id} className="kdsm-ticket__item">
            <span className="kdsm-ticket__item-qty">{item.quantity}×</span>
            <span className="kdsm-ticket__item-name">{item.name}</span>
            {item.notes && (
              <span className="kdsm-ticket__item-notes">📝 {item.notes}</span>
            )}
          </li>
        ))}
      </ul>

      {swipeHint && <div className="kdsm-ticket__hint">{swipeHint}</div>}
    </motion.article>
  );
}
