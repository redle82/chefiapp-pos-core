/**
 * DataPrivacyPage — Exportar dados e eliminar conta (GDPR).
 * Botões abrem modais com instruções e contacto; processo documentado em docs/legal/GDPR_DATA_EXPORT_DELETION.md.
 */
// @ts-nocheck


import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { colors } from "../../ui/design-system/tokens/colors";

export function DataPrivacyPage() {
  const { t } = useTranslation("legal");
  const { t: tCommon } = useTranslation("common");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        {t("dataPrivacyTitle")}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: colors.text?.secondary ?? "#71717a",
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        {t("dataPrivacyIntro")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          style={{
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 600,
            textAlign: "left",
            border: `1px solid ${colors.border?.subtle ?? "#404040"}`,
            borderRadius: 8,
            backgroundColor: colors.surface?.layer1 ?? "#18181b",
            color: colors.text?.primary ?? "#fff",
            cursor: "pointer",
          }}
        >
          {t("exportMyData")}
        </button>
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          style={{
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 600,
            textAlign: "left",
            border: "1px solid #7f1d1d",
            borderRadius: 8,
            backgroundColor: "rgba(127, 29, 29, 0.2)",
            color: "#fca5a5",
            cursor: "pointer",
          }}
        >
          {t("deleteAccountData")}
        </button>
      </div>

      {exportModalOpen && (
        <Modal
          title={t("exportModalTitle")}
          onClose={() => setExportModalOpen(false)}
          closeLabel={tCommon("close")}
          understoodLabel={tCommon("understood")}
        >
          <p style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.5 }}>
            {t("exportModalBody1")}
          </p>
          <p style={{ fontSize: 13, color: colors.text?.tertiary ?? "#71717a" }}>
            {t("exportModalBody2")}
          </p>
          <p style={{ marginTop: 16, fontSize: 12 }}>
            {t("exportModalDoc")}
          </p>
        </Modal>
      )}

      {deleteModalOpen && (
        <Modal
          title={t("deleteModalTitle")}
          onClose={() => setDeleteModalOpen(false)}
          closeLabel={tCommon("close")}
          understoodLabel={tCommon("understood")}
        >
          <p style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.5 }}>
            {t("deleteModalBody1")}
          </p>
          <p style={{ fontSize: 13, color: colors.text?.tertiary ?? "#71717a" }}>
            {t("deleteModalBody2")}
          </p>
          <p style={{ marginTop: 16, fontSize: 12 }}>
            {t("deleteModalDoc")}
          </p>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
  closeLabel,
  understoodLabel,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  closeLabel: string;
  understoodLabel: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-privacy-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: colors.background ?? "#0b0b0f",
          border: `1px solid ${colors.border?.subtle ?? "#27272a"}`,
          borderRadius: 12,
          padding: 24,
          maxWidth: 440,
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2
            id="data-privacy-modal-title"
            style={{ fontSize: 18, fontWeight: 600, margin: 0 }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            style={{
              background: "none",
              border: "none",
              color: colors.text?.secondary ?? "#a1a1aa",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 20,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            backgroundColor: colors.modes?.dashboard?.action?.base ?? "#eab308",
            color: colors.modes?.dashboard?.action?.text ?? "#000",
            cursor: "pointer",
          }}
        >
          {understoodLabel}
        </button>
      </div>
    </div>
  );
}
