/**
 * AppStaffBootScreen — Ritual de entrada (~300 ms). Overlay fullscreen com logo/texto;
 * sem spinner. Usado no StaffAppShellLayout para "reset psicológico" ao entrar no app.
 * Contrato: docs/plans/app_encapsulamento_psicológico.
 * Identidade: RESTAURANT_LOGO_IDENTITY_CONTRACT.md — logo do restaurante quando disponível.
 */

import React, { useEffect, useState } from "react";
import { colors } from "../../ui/design-system/tokens/colors";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { RestaurantLogo } from "../../ui/RestaurantLogo";

const BOOT_VISIBLE_MS = 300;
const FADEOUT_MS = 150;

export interface AppStaffBootScreenProps {
  onDone: () => void;
}

export function AppStaffBootScreen({ onDone }: AppStaffBootScreenProps) {
  const [exiting, setExiting] = useState(false);
  const { identity } = useRestaurantIdentity();

  useEffect(() => {
    const showTimer = window.setTimeout(() => setExiting(true), BOOT_VISIBLE_MS);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const doneTimer = window.setTimeout(onDone, FADEOUT_MS);
    return () => clearTimeout(doneTimer);
  }, [exiting, onDone]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface.base,
        color: colors.text.primary,
        opacity: exiting ? 0 : 1,
        transition: `opacity ${FADEOUT_MS}ms ease-out`,
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <RestaurantLogo
        logoUrl={identity.logoUrl}
        name={identity.name}
        size={80}
        style={{ marginBottom: 16 }}
      />
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: colors.text.secondary,
          textAlign: "center",
          maxWidth: 260,
        }}
      >
        {identity.name || "Sistema Operacional do Restaurante"}
      </span>
    </div>
  );
}
