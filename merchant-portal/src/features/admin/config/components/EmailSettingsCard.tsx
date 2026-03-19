/**
 * EmailSettingsCard — Email configuration card for admin settings.
 *
 * Toggles: enable email receipts, auto-send after payment,
 * send order confirmation, customer email collection mode.
 * Preview and test email buttons.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  getEmailSettings,
  saveEmailSettings,
  syncEmailSettingsToCore,
  loadEmailSettingsFromCore,
  sendEmail,
  type EmailSettings,
} from "../../../../core/notifications/EmailService";
import { receiptTemplate } from "../../../../core/notifications/emailTemplates";
import type { ReceiptData } from "../../../../pages/TPVMinimal/types/ReceiptData";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";

export function EmailSettingsCard() {
  const { t } = useTranslation("config");
  const { runtime } = useRestaurantRuntime();
  const { identity } = useRestaurantIdentity();
  const [settings, setSettings] = useState<EmailSettings>(getEmailSettings());
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const restaurantId = runtime.restaurant_id ?? null;

  // Load settings from Core on mount
  useEffect(() => {
    if (!restaurantId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    loadEmailSettingsFromCore(restaurantId).then((s) => {
      if (!cancelled) {
        setSettings(s);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const handleToggle = (key: keyof EmailSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePromptChange = (value: EmailSettings["customerEmailPrompt"]) => {
    setSettings((prev) => ({ ...prev, customerEmailPrompt: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      saveEmailSettings(settings);
      if (restaurantId) {
        await syncEmailSettingsToCore(restaurantId, settings);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    const restaurantEmail = identity.loading ? null : (runtime as Record<string, unknown>).email as string | undefined;
    const toEmail = restaurantEmail || "test@example.com";

    if (!restaurantId) {
      setTestResult(t("email.errorNoRestaurant", "No restaurant selected."));
      return;
    }

    setTestSending(true);
    setTestResult(null);

    // Build a sample receipt for the test email
    const sampleReceipt: ReceiptData = {
      orderId: "TEST-00000001",
      orderIdShort: "TEST0001",
      timestamp: new Date().toISOString(),
      table: "5",
      orderMode: "dine_in",
      restaurant: {
        name: identity.name || "Restaurant",
        address: identity.address,
        phone: identity.phone,
        taxId: identity.taxId,
        logoUrl: identity.logoUrl,
        receiptExtraText: identity.receiptExtraText,
      },
      items: [
        { name: "Grilled Salmon", quantity: 2, unit_price: 1850, line_total: 3700 },
        { name: "Caesar Salad", quantity: 1, unit_price: 950, line_total: 950 },
        { name: "Sparkling Water", quantity: 2, unit_price: 350, line_total: 700 },
      ],
      subtotalCents: 5350,
      discountCents: 0,
      taxCents: 535,
      taxBreakdown: [{ rateLabel: "10%", rate: 0.1, baseAmount: 5350, taxAmount: 535 }],
      tipCents: 0,
      grandTotalCents: 5885,
      paymentMethod: "card",
    };

    const htmlBody = receiptTemplate(sampleReceipt);
    const subject = `[TEST] Receipt — ${identity.name || "Restaurant"}`;

    try {
      const result = await sendEmail(
        restaurantId,
        toEmail,
        subject,
        htmlBody,
        { tags: ["test"] },
      );
      setTestResult(
        result.success
          ? t("email.testSent", "Test email sent!")
          : t("email.testFailed", "Failed: {{error}}", { error: result.error }),
      );
    } catch (err) {
      setTestResult(
        err instanceof Error ? err.message : t("email.testFailed", "Test failed."),
      );
    } finally {
      setTestSending(false);
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const cardStyle = {
    backgroundColor: "var(--card-bg-on-dark)",
    borderRadius: 10,
    border: "1px solid var(--surface-border)",
    padding: 14,
  };
  const labelStyle = {
    display: "block" as const,
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: "var(--text-secondary)",
  };
  const buttonStyle = {
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: "var(--color-primary)",
    color: "var(--text-inverse)",
  };
  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "transparent",
    border: "1px solid var(--surface-border)",
    color: "var(--text-primary)",
  };
  const toggleRowStyle = {
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: "8px 0",
    borderBottom: "1px solid var(--surface-border)",
  };

  return (
    <section style={cardStyle} aria-labelledby="card-email-title">
      <h2
        id="card-email-title"
        style={{
          fontSize: 14,
          fontWeight: 600,
          margin: "0 0 4px 0",
          color: "var(--text-primary)",
        }}
      >
        {t("email.title", "Email Notifications")}
      </h2>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        {t("email.description", "Send digital receipts and notifications to customers via email.")}
      </p>

      {!loaded ? (
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {t("email.loading", "Loading...")}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Toggle: Enable email receipts */}
          <div style={toggleRowStyle}>
            <div>
              <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                {t("email.enableReceipts", "Enable email receipts")}
              </span>
            </div>
            <ToggleSwitch
              checked={settings.emailReceiptsEnabled}
              onChange={(v) => handleToggle("emailReceiptsEnabled", v)}
            />
          </div>

          {/* Toggle: Auto-send after payment */}
          <div style={toggleRowStyle}>
            <div>
              <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                {t("email.autoSend", "Auto-send receipt after payment")}
              </span>
            </div>
            <ToggleSwitch
              checked={settings.autoSendAfterPayment}
              onChange={(v) => handleToggle("autoSendAfterPayment", v)}
              disabled={!settings.emailReceiptsEnabled}
            />
          </div>

          {/* Toggle: Send order confirmation */}
          <div style={toggleRowStyle}>
            <div>
              <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                {t("email.sendOrderConfirmation", "Send order confirmation to customer")}
              </span>
            </div>
            <ToggleSwitch
              checked={settings.sendOrderConfirmation}
              onChange={(v) => handleToggle("sendOrderConfirmation", v)}
              disabled={!settings.emailReceiptsEnabled}
            />
          </div>

          {/* Select: Customer email prompt mode */}
          <div style={{ padding: "8px 0", borderBottom: "1px solid var(--surface-border)" }}>
            <label style={labelStyle}>
              {t("email.promptMode", "Customer email collection")}
            </label>
            <select
              value={settings.customerEmailPrompt}
              onChange={(e) =>
                handlePromptChange(e.target.value as EmailSettings["customerEmailPrompt"])
              }
              disabled={!settings.emailReceiptsEnabled}
              style={{
                width: "100%",
                padding: "6px 10px",
                border: "1px solid var(--surface-border)",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              <option value="at_checkout">
                {t("email.promptAtCheckout", "Prompt at checkout")}
              </option>
              <option value="optional">
                {t("email.promptOptional", "Optional (button on receipt)")}
              </option>
              <option value="never">
                {t("email.promptNever", "Never ask")}
              </option>
            </select>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={buttonStyle}
            >
              {saving
                ? t("common:saving", "Saving...")
                : t("common:save", "Save")}
            </button>
            <button
              type="button"
              onClick={handlePreview}
              disabled={!settings.emailReceiptsEnabled}
              style={secondaryButtonStyle}
            >
              {t("email.preview", "Preview Template")}
            </button>
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testSending || !settings.emailReceiptsEnabled}
              style={secondaryButtonStyle}
            >
              {testSending
                ? t("email.sending", "Sending...")
                : t("email.sendTest", "Send Test Email")}
            </button>
          </div>

          {/* Test result feedback */}
          {testResult && (
            <p
              style={{
                fontSize: 12,
                marginTop: 6,
                color: testResult.includes("sent")
                  ? "var(--color-success, #10b981)"
                  : "var(--color-error, #ef4444)",
              }}
            >
              {testResult}
            </p>
          )}
        </div>
      )}

      {/* Email preview modal */}
      {previewOpen && (
        <EmailPreviewModal
          identity={identity}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        padding: 2,
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: checked ? "var(--color-primary, #6366f1)" : "#3f3f46",
        opacity: disabled ? 0.5 : 1,
        transition: "background-color 0.2s",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "#fff",
          transition: "transform 0.2s",
          transform: checked ? "translateX(18px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Email Preview Modal                                                */
/* ------------------------------------------------------------------ */

function EmailPreviewModal({
  identity,
  onClose,
}: {
  identity: {
    name: string;
    address?: string;
    phone?: string;
    taxId?: string;
    logoUrl?: string;
    receiptExtraText?: string;
  };
  onClose: () => void;
}) {
  const sampleReceipt: ReceiptData = {
    orderId: "PREVIEW-00000001",
    orderIdShort: "PREV0001",
    timestamp: new Date().toISOString(),
    table: "3",
    orderMode: "dine_in",
    restaurant: {
      name: identity.name || "Restaurant",
      address: identity.address,
      phone: identity.phone,
      taxId: identity.taxId,
      logoUrl: identity.logoUrl,
      receiptExtraText: identity.receiptExtraText,
    },
    items: [
      { name: "Grilled Salmon", quantity: 2, unit_price: 1850, line_total: 3700 },
      { name: "Caesar Salad", quantity: 1, unit_price: 950, line_total: 950 },
    ],
    subtotalCents: 4650,
    discountCents: 0,
    taxCents: 465,
    taxBreakdown: [{ rateLabel: "10%", rate: 0.1, baseAmount: 4650, taxAmount: 465 }],
    tipCents: 200,
    grandTotalCents: 5315,
    paymentMethod: "card",
  };

  const html = receiptTemplate(sampleReceipt);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a0a0a",
          border: "1px solid #27272a",
          borderRadius: 16,
          width: "min(640px, 95vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #27272a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#e4e4e7", fontWeight: 600, fontSize: 14 }}>
            Email Preview
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#a1a1aa",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <iframe
            srcDoc={html}
            title="Email Preview"
            sandbox=""
            style={{
              width: "100%",
              height: 600,
              border: "none",
              background: "#fff",
            }}
          />
        </div>
      </div>
    </div>
  );
}
