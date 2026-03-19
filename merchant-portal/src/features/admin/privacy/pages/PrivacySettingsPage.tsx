/**
 * PrivacySettingsPage — Admin GDPR compliance dashboard.
 *
 * Sections:
 *   1. Data Retention Policy (orders: 7y, customers: 3y, analytics: 1y)
 *   2. Customer Data Requests queue (export / delete)
 *   3. Deletion requests history
 *   4. Privacy Audit Log
 *   5. Consent-at-checkout toggle
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applyRetentionPolicy,
  deleteCustomerData,
  exportCustomerData,
  generateExportBlob,
  getDataRetentionPolicy,
  getDeletionRequests,
  getPrivacyAuditLog,
  saveDataRetentionPolicy,
} from "../../../../core/privacy/DataExportService";
import type {
  CustomerDataExport,
  DataRetentionPolicy,
  DeletionRequest,
  PrivacyAuditRecord,
} from "../../../../core/privacy/DataExportService";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

// ---------------------------------------------------------------------------
// Styles (inline, consistent with other admin pages)
// ---------------------------------------------------------------------------

const sectionStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "rgba(255,255,255,0.6)",
  display: "block",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 160,
  padding: "8px 12px",
  fontSize: 14,
  color: "#e5e5e5",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
};

const btnPrimary: React.CSSProperties = {
  padding: "8px 20px",
  fontSize: 13,
  fontWeight: 600,
  color: "#000",
  background: "#f59e0b",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  padding: "8px 20px",
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(255,255,255,0.7)",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  ...btnSecondary,
  color: "#ef4444",
  borderColor: "rgba(239,68,68,0.3)",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  color: "rgba(255,255,255,0.7)",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONSENT_CHECKOUT_KEY = "chefiapp_require_email_consent_checkout";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrivacySettingsPage() {
  const { t } = useTranslation("privacy");

  // Retention policy
  const [retention, setRetention] = useState<DataRetentionPolicy>(
    getDataRetentionPolicy,
  );
  const [retentionSaved, setRetentionSaved] = useState(false);

  // Customer data requests
  const [customerId, setCustomerId] = useState("");
  const [lastExport, setLastExport] = useState<CustomerDataExport | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  // Deletion requests
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>(
    [],
  );

  // Audit log
  const [auditLog, setAuditLog] = useState<PrivacyAuditRecord[]>([]);

  // Consent at checkout toggle
  const [consentAtCheckout, setConsentAtCheckout] = useState(() => {
    return localStorage.getItem(CONSENT_CHECKOUT_KEY) === "true";
  });

  // Load data on mount
  useEffect(() => {
    void getDeletionRequests().then(setDeletionRequests);
    void getPrivacyAuditLog().then(setAuditLog);
  }, []);

  const refreshData = useCallback(async () => {
    setDeletionRequests(await getDeletionRequests());
    setAuditLog(await getPrivacyAuditLog());
  }, []);

  // Retention handlers
  const handleSaveRetention = useCallback(() => {
    saveDataRetentionPolicy(retention);
    setRetentionSaved(true);
    setTimeout(() => setRetentionSaved(false), 3000);
  }, [retention]);

  const handleApplyRetention = useCallback(async () => {
    if (!window.confirm(t("settingsPage.applyRetentionConfirm"))) return;
    const result = await applyRetentionPolicy("admin");
    setStatusMsg(
      t("settingsPage.retentionApplied", { count: result.deletedRecords }),
    );
    await refreshData();
  }, [t, refreshData]);

  // Export handler
  const handleExport = useCallback(async () => {
    if (!customerId.trim()) return;
    const data = await exportCustomerData(customerId.trim(), "admin");
    setLastExport(data);
    setStatusMsg(t("settingsPage.exportGenerated", { id: customerId.trim() }));
    await refreshData();
  }, [customerId, t, refreshData]);

  const handleDownloadExport = useCallback(() => {
    if (!lastExport) return;
    const blob = generateExportBlob(lastExport);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdpr-export-${lastExport.customerId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lastExport]);

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!customerId.trim()) return;
    const result = await deleteCustomerData(customerId.trim(), "admin");
    if (result.status === "completed") {
      setStatusMsg(
        t("settingsPage.deletionCompleted", { id: customerId.trim() }),
      );
    } else {
      setStatusMsg(t("settingsPage.deletionFailed"));
    }
    await refreshData();
  }, [customerId, t, refreshData]);

  // Consent at checkout
  const handleToggleConsent = useCallback(
    (checked: boolean) => {
      setConsentAtCheckout(checked);
      localStorage.setItem(CONSENT_CHECKOUT_KEY, String(checked));
    },
    [],
  );

  const formatTs = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <AdminPageHeader
        title={t("settingsPage.title")}
        subtitle={t("settingsPage.subtitle")}
      />

      {/* Status message */}
      {statusMsg && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: "#a3e635",
            background: "rgba(163,230,53,0.08)",
            border: "1px solid rgba(163,230,53,0.15)",
            borderRadius: 8,
          }}
        >
          {statusMsg}
        </div>
      )}

      {/* 1. Data Retention Policy */}
      <section style={sectionStyle}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#e5e5e5",
            margin: "0 0 4px",
          }}
        >
          {t("settingsPage.retentionTitle")}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 16px",
          }}
        >
          {t("settingsPage.retentionDesc")}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label style={labelStyle}>{t("settingsPage.ordersYears")}</label>
            <input
              type="number"
              min={1}
              max={20}
              value={retention.ordersYears}
              onChange={(e) =>
                setRetention((p) => ({
                  ...p,
                  ordersYears: Number(e.target.value) || 7,
                }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              {t("settingsPage.customersYears")}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={retention.customersYears}
              onChange={(e) =>
                setRetention((p) => ({
                  ...p,
                  customersYears: Number(e.target.value) || 3,
                }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              {t("settingsPage.analyticsYears")}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={retention.analyticsYears}
              onChange={(e) =>
                setRetention((p) => ({
                  ...p,
                  analyticsYears: Number(e.target.value) || 1,
                }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              {t("settingsPage.auditLogsYears")}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={retention.auditLogsYears}
              onChange={(e) =>
                setRetention((p) => ({
                  ...p,
                  auditLogsYears: Number(e.target.value) || 10,
                }))
              }
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={handleSaveRetention} style={btnPrimary}>
            {t("settingsPage.saveRetention")}
          </button>
          <button
            type="button"
            onClick={handleApplyRetention}
            style={btnDanger}
          >
            {t("settingsPage.applyRetention")}
          </button>
          {retentionSaved && (
            <span
              style={{ fontSize: 13, color: "#a3e635", alignSelf: "center" }}
            >
              {t("settingsPage.retentionSaved")}
            </span>
          )}
        </div>
      </section>

      {/* 2. Customer Data Requests */}
      <section style={sectionStyle}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#e5e5e5",
            margin: "0 0 4px",
          }}
        >
          {t("settingsPage.requestsTitle")}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 16px",
          }}
        >
          {t("settingsPage.requestsDesc")}
        </p>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div>
            <label style={labelStyle}>
              {t("settingsPage.customerIdLabel")}
            </label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder={t("settingsPage.customerIdPlaceholder")}
              style={{ ...inputStyle, maxWidth: 280 }}
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={!customerId.trim()}
            style={{
              ...btnPrimary,
              opacity: customerId.trim() ? 1 : 0.4,
            }}
          >
            {t("settingsPage.processExport")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!customerId.trim()}
            style={{
              ...btnDanger,
              opacity: customerId.trim() ? 1 : 0.4,
            }}
          >
            {t("settingsPage.processDelete")}
          </button>
        </div>

        {lastExport && (
          <button
            type="button"
            onClick={handleDownloadExport}
            style={btnSecondary}
          >
            {t("settingsPage.downloadExport")}
          </button>
        )}
      </section>

      {/* 3. Deletion Requests */}
      <section style={sectionStyle}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#e5e5e5",
            margin: "0 0 12px",
          }}
        >
          {t("settingsPage.deletionRequestsTitle")}
        </h2>

        {deletionRequests.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {t("settingsPage.noRequests")}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>
                    {t("settingsPage.auditCustomer")}
                  </th>
                  <th style={thStyle}>
                    {t("settingsPage.auditOperator")}
                  </th>
                  <th style={thStyle}>
                    {t("settingsPage.auditTimestamp")}
                  </th>
                  <th style={thStyle}>
                    {t("settingsPage.deletionStatus")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {deletionRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>
                      {req.id.slice(0, 16)}...
                    </td>
                    <td style={tdStyle}>{req.customerId}</td>
                    <td style={tdStyle}>{req.requestedBy}</td>
                    <td style={tdStyle}>{formatTs(req.requestedAt)}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background:
                            req.status === "completed"
                              ? "rgba(163,230,53,0.12)"
                              : req.status === "failed"
                                ? "rgba(239,68,68,0.12)"
                                : "rgba(251,191,36,0.12)",
                          color:
                            req.status === "completed"
                              ? "#a3e635"
                              : req.status === "failed"
                                ? "#ef4444"
                                : "#fbbf24",
                        }}
                      >
                        {req.status === "completed"
                          ? t("settingsPage.deletionCompleted2")
                          : req.status === "failed"
                            ? t("settingsPage.deletionFailed2")
                            : t("settingsPage.deletionPending")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Privacy Audit Log */}
      <section style={sectionStyle}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#e5e5e5",
            margin: "0 0 4px",
          }}
        >
          {t("settingsPage.auditTitle")}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 12px",
          }}
        >
          {t("settingsPage.auditDesc")}
        </p>

        {auditLog.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {t("settingsPage.noAuditRecords")}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t("settingsPage.auditAction")}</th>
                  <th style={thStyle}>{t("settingsPage.auditCustomer")}</th>
                  <th style={thStyle}>{t("settingsPage.auditOperator")}</th>
                  <th style={thStyle}>{t("settingsPage.auditTimestamp")}</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((record) => (
                  <tr key={record.id}>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                    >
                      {record.action}
                    </td>
                    <td style={tdStyle}>{record.customerId}</td>
                    <td style={tdStyle}>{record.operatorId}</td>
                    <td style={tdStyle}>{formatTs(record.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Consent at Checkout Toggle */}
      <section style={sectionStyle}>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={consentAtCheckout}
            onChange={(e) => handleToggleConsent(e.target.checked)}
            style={{ marginTop: 3, accentColor: "#f59e0b" }}
          />
          <div>
            <span
              style={{ fontSize: 14, fontWeight: 600, color: "#e5e5e5" }}
            >
              {t("settingsPage.consentAtCheckout")}
            </span>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                margin: "4px 0 0",
              }}
            >
              {t("settingsPage.consentAtCheckoutDesc")}
            </p>
          </div>
        </label>
      </section>
    </div>
  );
}
