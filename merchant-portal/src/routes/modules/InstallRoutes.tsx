/**
 * InstallRoutes — Route registration for /install/* (TPV installation flow).
 *
 * Flow:
 * /install/tpv   → Download the desktop app
 * /install/pair  → Generate pairing token + pair device
 * /install/check → Verify device connection and readiness
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 3)
 */

import { Fragment } from "react";
import { Route } from "react-router-dom";
import { InstallTPVPage } from "../../pages/Install/InstallTPVPage";
import { DevicePairPage } from "../../pages/Install/DevicePairPage";
import { DeviceCheckPage } from "../../pages/Install/DeviceCheckPage";

export const InstallRoutesFragment = (
  <Fragment>
    <Route path="/install/tpv" element={<InstallTPVPage />} />
    <Route path="/install/pair" element={<DevicePairPage />} />
    <Route path="/install/check" element={<DeviceCheckPage />} />
  </Fragment>
);
