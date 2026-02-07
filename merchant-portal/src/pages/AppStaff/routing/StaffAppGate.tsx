/**
 * StaffAppGate — Gates antes do Shell (Location → Contract → Worker)
 * Se algum gate falhar, mostra a vista correspondente; senão renderiza <Outlet />.
 * Ordem real: 1. location 2. contract 3. worker (gm_restaurant_people/gm_staff).
 */

import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { isDebugMode } from "../../../core/debugMode";
import { colors } from "../../../ui/design-system/tokens/colors";
import { AppStaffLanding } from "../AppStaffLanding";
import { WorkerCheckInView } from "../WorkerCheckInView";
import { useStaff } from "../context/StaffContext";
import { LocationSelectView } from "../views/LocationSelectView";
import { NoLocationsView } from "../views/NoLocationsView";

export function StaffAppGate() {
  const {
    activeLocation,
    activeLocations,
    operationalContract,
    activeWorkerId,
    activeRole,
    roleSource,
    restaurantId,
  } = useStaff();

  const hasLocation = !!activeLocation;
  const hasContract = !!operationalContract;
  const hasWorker = !!activeWorkerId;
  const gateBlock =
    !hasLocation
      ? "location"
      : !hasContract
        ? "contract"
        : !hasWorker
          ? "worker"
          : null;

  useEffect(() => {
    if (!isDebugMode()) return;
    const state = {
      hasRestaurant: !!restaurantId,
      hasLocation,
      hasContract,
      hasWorker,
      workerRole: activeRole,
      source: roleSource,
      gateBlock,
    };
    console.log("[StaffAppGate]", state);
    if (gateBlock) console.warn("[StaffAppGate] Bloqueado em:", gateBlock);
  }, [restaurantId, hasLocation, hasContract, hasWorker, activeRole, roleSource, gateBlock]);

  const debugStrip = isDebugMode() ? (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "4px 8px",
        fontSize: 10,
        fontFamily: "monospace",
        backgroundColor: colors.surface.layer2,
        color: colors.text.tertiary,
        borderBottom: `1px solid ${colors.border.subtle}`,
      }}
    >
      <span>restaurant:{restaurantId ? "✓" : "✗"}</span>
      <span>location:{hasLocation ? "✓" : "✗"}</span>
      <span>contract:{hasContract ? "✓" : "✗"}</span>
      <span>worker:{hasWorker ? "✓" : "✗"}</span>
      <span>role:{activeRole}</span>
      <span>source:{roleSource}</span>
      {gateBlock && <span style={{ color: colors.warning?.base ?? "#fb923c" }}>bloqueio:{gateBlock}</span>}
    </div>
  ) : null;

  const wrapWithDebug = (content: React.ReactNode) =>
    debugStrip ? (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {debugStrip}
        <div style={{ flex: 1, minHeight: 0 }}>{content}</div>
      </div>
    ) : (
      content
    );

  // Em debug: só bypass quando já há contrato e worker (senão mostrar Landing com entrada rápida).
  if (isDebugMode() && operationalContract && activeWorkerId) {
    return wrapWithDebug(<Outlet />);
  }

  if (!activeLocation) {
    if (activeLocations.length === 0) return wrapWithDebug(<NoLocationsView />);
    return wrapWithDebug(<LocationSelectView />);
  }

  if (!operationalContract) {
    return wrapWithDebug(<AppStaffLanding />);
  }

  if (!activeWorkerId) {
    return wrapWithDebug(<WorkerCheckInView />);
  }

  return <Outlet />;
}
