/**
 * TPVMobileBottomNav — Bottom navigation for TPV Mobile
 *
 * Tabs:
 * - POS (lançar pedidos)
 * - KDS (cozinha vê pedidos)
 * - Mesas (mapa)
 * - Pedidos (ativos)
 * - Reservas (apenas dono/gerente)
 */
// @ts-nocheck


export type TPVMobileTab = "pos" | "kds" | "tables" | "orders" | "reservations";

interface TPVMobileBottomNavProps {
  activeTab: TPVMobileTab;
  onTabChange: (tab: TPVMobileTab) => void;
  /** Hide reservations tab for waiters */
  showReservations?: boolean;
  /** Badge counts */
  ordersCount?: number;
  tablesOccupied?: number;
}

export function TPVMobileBottomNav({
  activeTab,
  onTabChange,
  showReservations = true,
  ordersCount = 0,
  tablesOccupied = 0,
}: TPVMobileBottomNavProps) {
  const tabs: {
    id: TPVMobileTab;
    label: string;
    icon: string;
    badge?: number;
  }[] = [
    { id: "pos", label: "POS", icon: "💳" },
    { id: "kds", label: "KDS", icon: "👨‍🍳", badge: ordersCount || undefined },
    {
      id: "tables",
      label: "Mesas",
      icon: "🪑",
      badge: tablesOccupied || undefined,
    },
    {
      id: "orders",
      label: "Pedidos",
      icon: "📋",
      badge: ordersCount || undefined,
    },
    ...(showReservations
      ? [{ id: "reservations" as TPVMobileTab, label: "Reservas", icon: "📅" }]
      : []),
  ];

  return (
    <nav className="tpvm-bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tpvm-bottom-nav__tab ${
            activeTab === tab.id ? "tpvm-bottom-nav__tab--active" : ""
          }`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          <span className="tpvm-bottom-nav__icon">
            {tab.icon}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="tpvm-bottom-nav__badge">
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </span>
          <span className="tpvm-bottom-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
