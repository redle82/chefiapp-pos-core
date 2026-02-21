/**
 * KDSMobileGrid — Vertical stack of KDS tickets
 */

import { KDSMobileTicket, type KDSTicketData } from "./KDSMobileTicket";

interface KDSMobileGridProps {
  tickets: KDSTicketData[];
  onStartPreparing: (ticketId: string) => void;
  onMarkReady: (ticketId: string) => void;
}

export function KDSMobileGrid({
  tickets,
  onStartPreparing,
  onMarkReady,
}: KDSMobileGridProps) {
  if (tickets.length === 0) {
    return (
      <div className="kdsm-grid kdsm-empty-state">
        <span className="kdsm-empty-state__icon">🍳</span>
        <p className="kdsm-empty-state__text">Nenhum pedido neste estado</p>
      </div>
    );
  }

  return (
    <div className="kdsm-grid">
      {tickets.map((ticket) => (
        <KDSMobileTicket
          key={ticket.id}
          ticket={ticket}
          onStartPreparing={onStartPreparing}
          onMarkReady={onMarkReady}
        />
      ))}
    </div>
  );
}
