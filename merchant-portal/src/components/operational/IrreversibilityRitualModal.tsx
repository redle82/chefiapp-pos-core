/**
 * IrreversibilityRitualModal — FASE 5 Fase 2/3: ritual explícito antes de passar a "live"
 *
 * Mostra o contrato "Daqui não se volta. Isto conta." antes de setProductMode("live").
 * Ref.: docs/implementation/FASE_5_ESTADO_REAL.md
 */

import { useTranslation } from "react-i18next";

export interface IrreversibilityRitualModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Texto do botão principal (default uses i18n key operational:goLive.confirm) */
  confirmLabel?: string;
}

export function IrreversibilityRitualModal({
  open,
  onClose,
  onConfirm,
  confirmLabel,
}: IrreversibilityRitualModalProps) {
  const { t } = useTranslation();
  const resolvedConfirmLabel = confirmLabel || t("operational:goLive.confirm");
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="irreversibility-ritual-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          padding: 24,
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="irreversibility-ritual-title"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#1a1a1a",
            margin: 0,
            marginBottom: 12,
          }}
        >
          {t("operational:goLive.title")}
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "#444",
            lineHeight: 1.5,
            margin: 0,
            marginBottom: 24,
          }}
        >
          {t("operational:goLive.body")}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              color: "#444",
              backgroundColor: "#f0f0f0",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {t("common:cancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              backgroundColor: "#16a34a",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
