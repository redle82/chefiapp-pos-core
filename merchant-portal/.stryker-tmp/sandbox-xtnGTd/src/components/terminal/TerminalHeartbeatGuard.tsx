import React from "react";
import { useLocation } from "react-router-dom";
import { type TerminalType } from "../../core/terminal/TerminalEngine";
import { useHeartbeat } from "../../hooks/useHeartbeat";

interface Props {
  restaurantId: string;
  children: React.ReactNode;
}

/**
 * Guard que infere o tipo de terminal pela URL e inicia o heartbeat.
 */
export function TerminalHeartbeatGuard({ restaurantId, children }: Props) {
  const location = useLocation();

  // Inferência inteligente do tipo de terminal
  let type: TerminalType = "BACKOFFICE";
  let name = "Portal";

  if (
    location.pathname.startsWith("/op/tpv") ||
    location.pathname.startsWith("/tpv")
  ) {
    type = "TPV";
    name = "Terminal de Venda";
  } else if (location.pathname.startsWith("/op/kds")) {
    type = "KDS";
    name = "Cozinha";
  } else if (
    location.pathname.startsWith("/garcom") ||
    location.pathname.startsWith("/op/staff")
  ) {
    type = "WAITER";
    name = "Garçom";
  } else if (location.pathname.startsWith("/admin")) {
    type = "ADMIN";
    name = "Admin";
  }

  // Ativa o heartbeat para este terminal
  useHeartbeat({
    restaurantId,
    type,
    name,
  });

  return <>{children}</>;
}
