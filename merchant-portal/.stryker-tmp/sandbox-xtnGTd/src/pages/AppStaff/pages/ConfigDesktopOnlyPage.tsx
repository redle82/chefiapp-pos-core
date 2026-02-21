/**
 * ConfigDesktopOnlyPage — Resposta única no app a "ir para configuração".
 * Contrato: APPSTAFF_CONFIG_SEPARATION_CONTRACT.md.
 * A web de configuração (/admin/config) não é acessível a partir do app;
 * esta página explica que a configuração está disponível apenas no computador.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";

export function ConfigDesktopOnlyPage() {
  const navigate = useNavigate();
  const configUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/admin/config`
      : "/admin/config";

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "0 auto",
        padding: 24,
        paddingBottom: 96,
      }}
    >
      <div
        style={{
          fontSize: 48,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        💻
      </div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Configuração no computador
      </h1>
      <p
        style={{
          fontSize: 15,
          color: colors.text.secondary,
          lineHeight: 1.5,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        A web de configuração (equipa, horários, pagamentos, impressora, etc.)
        está disponível apenas no browser do seu computador, não neste
        aplicativo.
      </p>
      <p
        style={{
          fontSize: 14,
          color: colors.text.tertiary,
          lineHeight: 1.5,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        No PC, abra o mesmo link do ChefIApp e aceda a <strong>/admin/config</strong>{" "}
        ou ao menu de configuração.
      </p>
      <div
        style={{
          backgroundColor: colors.surface.layer2,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          border: `1px solid ${colors.border.subtle}`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: colors.text.tertiary,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          URL no computador
        </div>
        <div
          style={{
            fontSize: 13,
            fontFamily: "monospace",
            color: colors.text.secondary,
            wordBreak: "break-all",
          }}
        >
          {configUrl}
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate("/app/staff/home")}
        style={{
          display: "block",
          width: "100%",
          padding: "14px 20px",
          fontSize: 16,
          fontWeight: 600,
          color: colors.action.text,
          backgroundColor: colors.action.base,
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
        }}
      >
        Voltar ao início
      </button>
    </div>
  );
}
