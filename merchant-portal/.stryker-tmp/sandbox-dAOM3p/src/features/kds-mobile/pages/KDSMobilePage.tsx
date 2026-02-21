/**
 * KDSMobilePage — Mobile-first Kitchen Display System for AppStaff
 *
 * Route: /app/staff/kds
 *
 * Features:
 * - Vertical ticket stack
 * - Status tabs with counts
 * - SLA color coding
 * - Pull-to-refresh style (manual refresh)
 * - Auto-polling every 5s
 */
// @ts-nocheck


import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStaff } from "../../../pages/AppStaff/context/StaffContext";
import { KDSMobileGrid, KDSMobileHeader, KDSStatusTabs } from "../components";
import { useMobileKDS } from "../hooks/useMobileKDS";
import "../styles/kds-mobile.css";

export default function KDSMobilePage() {
  const navigate = useNavigate();
  const { restaurantId } = useStaff();

  const {
    tickets,
    counts,
    activeTab,
    isLoading,
    setActiveTab,
    startPreparing,
    markReady,
    refresh,
  } = useMobileKDS(restaurantId ?? "");

  // Redirect if no restaurant
  useEffect(() => {
    if (!restaurantId) {
      navigate("/app/staff/home");
    }
  }, [restaurantId, navigate]);

  // Restaurant name (fallback)
  const restaurantName = "ChefApp KDS"; // TODO: get from API

  // Filter tickets by active tab
  const filteredTickets = tickets.filter((t) => t.status === activeTab);

  return (
    <div className="kdsm-page">
      <KDSMobileHeader
        restaurantName={restaurantName}
        onRefresh={refresh}
        isRefreshing={isLoading}
        showBack
      />

      <KDSStatusTabs
        activeTab={activeTab}
        counts={counts}
        onTabChange={setActiveTab}
      />

      <KDSMobileGrid
        tickets={filteredTickets}
        onStartPreparing={startPreparing}
        onMarkReady={markReady}
      />
    </div>
  );
}
