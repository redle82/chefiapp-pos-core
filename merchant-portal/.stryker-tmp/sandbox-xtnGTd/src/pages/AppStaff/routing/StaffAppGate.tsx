/**
 * StaffAppGate — Gates antes do Shell (Location → Contract → Worker)
 * Se algum gate falhar, mostra a vista correspondente; senão renderiza <Outlet />.
 * Ordem real: 1. location 2. contract 3. worker (gm_restaurant_people/gm_staff).
 */

import React, { useEffect, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { isDebugMode } from "../../../core/debugMode";
import { AppStaffLanding } from "../AppStaffLanding";
import { WorkerCheckInView } from "../WorkerCheckInView";
import { useStaff } from "../context/StaffContext";
import { LocationSelectView } from "../views/LocationSelectView";
import { NoLocationsView } from "../views/NoLocationsView";
import gateStyles from "./StaffAppGate.module.css";

export function StaffAppGate({ children }: { children?: ReactNode } = {}) {
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
  const gateBlock = !hasLocation
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
  }, [
    restaurantId,
    hasLocation,
    hasContract,
    hasWorker,
    activeRole,
    roleSource,
    gateBlock,
  ]);

  const debugStrip = isDebugMode() ? (
    <div className={gateStyles.debugStrip}>
      {hasLocation && <span>location:✓</span>}
      {hasContract && <span>contract:✓</span>}
      {hasWorker && <span>worker:✓</span>}
    </div>
  ) : null;

  const wrapWithDebug = (content: React.ReactNode) =>
    debugStrip ? (
      <div className={gateStyles.wrapColumn}>
        {debugStrip}
        <div className={gateStyles.wrapContent}>{content}</div>
      </div>
    ) : (
      content
    );

  // Em debug: só bypass quando já há contrato e worker (senão mostrar Landing com entrada rápida).
  const content = children ?? <Outlet />;

  if (isDebugMode() && operationalContract && activeWorkerId) {
    return wrapWithDebug(content);
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

  return <>{content}</>;
}
