/**
 * StaffProfilePage — Perfil do operador com abas: Dados, Papel, Histórico, Sessão.
 */

import React, { useState } from "react";
import { useStaff } from "../context/StaffContext";
import { getOperatorProfile } from "../data/operatorProfiles";
import { Button } from "../../../ui/design-system/primitives/Button";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";

const TABS = [
  { id: "dados" as const, label: "Dados", icon: "👤" },
  { id: "papel" as const, label: "Papel", icon: "🎭" },
  { id: "historico" as const, label: "Histórico", icon: "📋" },
  { id: "sessao" as const, label: "Sessão", icon: "🔐" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function StaffProfilePage() {
  const { activeRole, activeLocation, shiftState, activeWorkerId, checkOut } = useStaff();
  const [activeTab, setActiveTab] = useState<TabId>("dados");
  const [pressedTab, setPressedTab] = useState<TabId | null>(null);
  const [logoutPressed, setLogoutPressed] = useState(false);
  const profile = getOperatorProfile(activeRole ?? undefined);

  const tabButtonStyle = (isActive: boolean, pressed: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: isActive ? colors.action.base : "transparent",
    color: isActive ? colors.action.text : colors.text.secondary,
    transition: "transform 0.08s ease",
    transform: pressed ? "scale(0.97)" : "scale(1)",
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.surface.layer1,
    borderRadius: 12,
    padding: 24,
    border: `1px solid ${colors.border.subtle}`,
  };

  const fieldStyle = { marginBottom: 16 };
  const labelStyle = { fontSize: 12, color: colors.text.tertiary };
  const valueStyle = { fontSize: 16, fontWeight: 600, color: colors.text.primary };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 80 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: colors.text.primary }}>
        Perfil
      </h1>

      {/* Tabs — feedback tátil (FASE 6) */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            style={tabButtonStyle(activeTab === tab.id, pressedTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
            onPointerDown={() => setPressedTab(tab.id)}
            onPointerUp={() => setPressedTab(null)}
            onPointerLeave={() => setPressedTab(null)}
          >
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo por aba */}
      <div style={cardStyle}>
        {activeTab === "dados" && (
          <>
            <div style={fieldStyle}>
              <div style={labelStyle}>Nome</div>
              <div style={valueStyle}>
                {profile?.name ?? (activeWorkerId ? `Operador ${activeWorkerId.slice(0, 8)}` : "—")}
              </div>
            </div>
            {profile && (
              <div style={fieldStyle}>
                <div style={labelStyle}>Função</div>
                <div style={valueStyle}>{profile.roleLabel}</div>
                <div style={{ fontSize: 13, color: colors.text.tertiary, marginTop: 4 }}>
                  {profile.shortDescription}
                </div>
              </div>
            )}
            <div style={fieldStyle}>
              <div style={labelStyle}>Contacto</div>
              <div style={{ ...valueStyle, fontSize: 14, fontWeight: 400, color: colors.text.tertiary }}>
                Definir na configuração do restaurante
              </div>
            </div>
          </>
        )}

        {activeTab === "papel" && (
          <>
            <div style={fieldStyle}>
              <div style={labelStyle}>Papel</div>
              <div style={valueStyle}>{profile?.roleLabel ?? activeRole}</div>
              {profile && (
                <div style={{ fontSize: 13, color: colors.text.tertiary, marginTop: 4 }}>
                  {profile.shortDescription}
                </div>
              )}
            </div>
            {activeLocation && (
              <div style={fieldStyle}>
                <div style={labelStyle}>Localização</div>
                <div style={valueStyle}>{activeLocation.name}</div>
              </div>
            )}
            <div style={fieldStyle}>
              <div style={labelStyle}>Estado do turno</div>
              <div style={valueStyle}>
                {shiftState === "active" ? "Turno ativo" : "Sem turno"}
              </div>
            </div>
            {activeWorkerId && (
              <div style={fieldStyle}>
                <div style={labelStyle}>ID operador</div>
                <div style={{ fontSize: 12, color: colors.text.tertiary, fontFamily: "monospace" }}>
                  {activeWorkerId}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "historico" && (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <Text size="sm" color="tertiary">
              Nenhum histórico registado neste dispositivo.
            </Text>
          </div>
        )}

        {activeTab === "sessao" && (
          <>
            <div style={fieldStyle}>
              <div style={labelStyle}>Sessão atual</div>
              <div style={{ ...valueStyle, fontSize: 14, fontWeight: 400 }}>
                {activeWorkerId ? "Sessão ativa" : "Sem sessão"}
              </div>
            </div>
            <div style={{ ...fieldStyle, marginBottom: 8 }}>
              <div style={labelStyle}>Dispositivo</div>
              <div style={{ fontSize: 14, color: colors.text.tertiary }}>
                Navegador — {typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 40) + "…" : "—"}
              </div>
            </div>
            <div
              style={{
                marginTop: 24,
                transition: "transform 0.08s ease",
                transform: logoutPressed ? "scale(0.97)" : "scale(1)",
              }}
              onPointerDown={() => setLogoutPressed(true)}
              onPointerUp={() => setLogoutPressed(false)}
              onPointerLeave={() => setLogoutPressed(false)}
            >
              <Button tone="destructive" variant="outline" onClick={checkOut}>
                Terminar sessão
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
