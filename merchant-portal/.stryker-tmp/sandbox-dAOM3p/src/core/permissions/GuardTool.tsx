// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import { RitualScreen } from "../../pages/Onboarding/RitualScreen";
import { isDebugMode } from "../debugMode";
import { type ToolId } from "./DeviceMatrix";
import { useDevicePermissions } from "./useDevicePermissions";

interface GuardToolProps {
  tool: ToolId;
  children: React.ReactNode;
}

export const GuardTool: React.FC<GuardToolProps> = ({ tool, children }) => {
  const { canAccess, role } = useDevicePermissions();
  const navigate = useNavigate();

  // Bypass: TPV/KDS só com ?debug=1 (testes)
  if (isDebugMode() && (tool === "tpv" || tool === "kds")) {
    return <>{children}</>;
  }

  // Perform check
  const decision = canAccess(tool);

  if (!decision.allow) {
    return (
      <RitualScreen
        id="access_denied_device"
        title="Dispositivo Incompatível"
        subtitle={`Este dispositivo está configurado como '${role}' e não pode acessar '${tool}'.`}
        primaryAction={{
          label: "Voltar ao Dashboard",
          onClick: () => navigate("/app/dashboard"),
        }}
      >
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🚫</div>
          <div style={{ opacity: 0.6 }}>
            Para usar o {tool.toUpperCase()}, use um terminal apropriado
            <br />
            (ex: Caixa/Gerente).
          </div>
        </div>
      </RitualScreen>
    );
  }

  return <>{children}</>;
};
