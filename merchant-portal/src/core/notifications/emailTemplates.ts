/**
 * Email Templates — Inline-styled HTML emails for transactional messaging.
 *
 * All templates use inline CSS for maximum compatibility across
 * Gmail, Outlook, Apple Mail, Yahoo, and mobile clients.
 *
 * Restaurant branding: logo, name, colors sourced from identity data.
 */

import type { ReceiptData } from "../../pages/TPVMinimal/types/ReceiptData";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface EmailRestaurantBranding {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  primaryColor?: string;
}

export interface OrderConfirmationData {
  orderId: string;
  orderIdShort: string;
  timestamp: string;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
  totalCents: number;
  orderMode?: string | null;
  table?: string | null;
  restaurant: EmailRestaurantBranding;
  currencySymbol?: string;
}

export interface ReservationConfirmationData {
  reservationId: string;
  customerName: string;
  date: string;
  time: string;
  partySize: number;
  notes?: string;
  restaurant: EmailRestaurantBranding;
}

export interface StaffAlertData {
  alertType: "low_stock" | "new_order" | "shift_change" | "system" | "custom";
  title: string;
  message: string;
  timestamp: string;
  restaurant: EmailRestaurantBranding;
  actionUrl?: string;
  actionLabel?: string;
}

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                     */
/* ------------------------------------------------------------------ */

function formatCents(cents: number, symbol = "\u20AC"): string {
  const val = (cents / 100).toFixed(2);
  return `${symbol}${val}`;
}

function formatDateReadable(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ------------------------------------------------------------------ */
/*  Base layout wrapper                                                */
/* ------------------------------------------------------------------ */

function emailWrapper(
  branding: EmailRestaurantBranding,
  content: string,
  footerExtra?: string,
): string {
  const primaryColor = branding.primaryColor || "#18181b";
  const logoHtml = branding.logoUrl
    ? `<img src="${escapeHtml(branding.logoUrl)}" alt="${escapeHtml(branding.name)}" style="display:block;margin:0 auto 12px auto;max-width:140px;max-height:70px;object-fit:contain;" />`
    : "";

  const footerParts: string[] = [];
  if (branding.address) footerParts.push(escapeHtml(branding.address));
  if (branding.phone) footerParts.push(`Tel: ${escapeHtml(branding.phone)}`);
  if (branding.email) footerParts.push(escapeHtml(branding.email));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(branding.name)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

<!-- Header -->
<tr><td style="background-color:${primaryColor};padding:24px 24px 20px 24px;text-align:center;">
${logoHtml}
<h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${escapeHtml(branding.name)}</h1>
</td></tr>

<!-- Content -->
<tr><td style="padding:24px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 24px;background-color:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
<p style="margin:0 0 4px 0;font-size:12px;color:#71717a;">${footerParts.join(" &middot; ")}</p>
${footerExtra ? `<p style="margin:4px 0 0 0;font-size:11px;color:#a1a1aa;">${footerExtra}</p>` : ""}
<p style="margin:8px 0 0 0;font-size:10px;color:#d4d4d8;">Powered by ChefIApp</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  1. Receipt email template                                          */
/* ------------------------------------------------------------------ */

export function receiptTemplate(
  receipt: ReceiptData,
  currencySymbol = "\u20AC",
): string {
  const branding: EmailRestaurantBranding = {
    name: receipt.restaurant.name,
    logoUrl: receipt.restaurant.logoUrl,
    address: receipt.restaurant.address,
    phone: receipt.restaurant.phone,
  };

  const payMethodLabel =
    receipt.paymentMethod === "cash"
      ? "Cash"
      : receipt.paymentMethod === "card"
        ? "Card"
        : "MB Way";

  const itemsHtml = receipt.items
    .map((item) => {
      const modHtml = item.modifiers
        ?.map(
          (m) =>
            `<div style="font-size:12px;color:#71717a;padding-left:24px;">+ ${escapeHtml(m.name)}${m.priceDeltaCents > 0 ? ` (+${formatCents(m.priceDeltaCents, currencySymbol)})` : ""}</div>`,
        )
        .join("") ?? "";

      return `<tr>
<td style="padding:6px 0;font-size:14px;color:#27272a;">${item.quantity}x ${escapeHtml(item.name)}${modHtml}</td>
<td style="padding:6px 0;font-size:14px;color:#27272a;text-align:right;white-space:nowrap;">${formatCents(item.line_total, currencySymbol)}</td>
</tr>`;
    })
    .join("");

  const taxHtml = receipt.taxBreakdown
    .map(
      (tax) =>
        `<tr><td style="font-size:13px;color:#71717a;padding:2px 0;">VAT (${escapeHtml(tax.rateLabel)})</td><td style="font-size:13px;color:#71717a;text-align:right;padding:2px 0;">${formatCents(tax.taxAmount, currencySymbol)}</td></tr>`,
    )
    .join("");

  const content = `
<p style="margin:0 0 4px 0;font-size:13px;color:#71717a;">Order #${escapeHtml(receipt.orderIdShort.toUpperCase())}</p>
<p style="margin:0 0 16px 0;font-size:13px;color:#71717a;">${formatDateReadable(receipt.timestamp)}</p>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
<tr><td colspan="2" style="border-bottom:2px solid #e4e4e7;padding-bottom:8px;margin-bottom:8px;">
<strong style="font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Items</strong>
</td></tr>
${itemsHtml}
<tr><td colspan="2" style="border-top:1px solid #e4e4e7;padding-top:8px;"></td></tr>
<tr><td style="font-size:14px;color:#52525b;">Subtotal</td><td style="font-size:14px;color:#52525b;text-align:right;">${formatCents(receipt.subtotalCents, currencySymbol)}</td></tr>
${receipt.discountCents > 0 ? `<tr><td style="font-size:14px;color:#52525b;">Discount${receipt.discountReason ? ` (${escapeHtml(receipt.discountReason)})` : ""}</td><td style="font-size:14px;color:#ef4444;text-align:right;">-${formatCents(receipt.discountCents, currencySymbol)}</td></tr>` : ""}
${taxHtml}
${receipt.tipCents > 0 ? `<tr><td style="font-size:14px;color:#52525b;">Tip</td><td style="font-size:14px;color:#52525b;text-align:right;">${formatCents(receipt.tipCents, currencySymbol)}</td></tr>` : ""}
<tr><td colspan="2" style="border-top:2px solid #18181b;padding-top:8px;"></td></tr>
<tr>
<td style="font-size:18px;font-weight:800;color:#18181b;">TOTAL</td>
<td style="font-size:18px;font-weight:800;color:#18181b;text-align:right;">${formatCents(receipt.grandTotalCents, currencySymbol)}</td>
</tr>
</table>

<div style="margin-top:16px;padding:12px;background-color:#f4f4f5;border-radius:6px;">
<p style="margin:0;font-size:13px;color:#52525b;">Payment: <strong>${escapeHtml(payMethodLabel)}</strong></p>
${receipt.table ? `<p style="margin:4px 0 0 0;font-size:13px;color:#52525b;">Table: <strong>${escapeHtml(receipt.table)}</strong></p>` : ""}
</div>

${receipt.restaurant.receiptExtraText ? `<p style="margin:16px 0 0 0;font-size:12px;color:#a1a1aa;text-align:center;white-space:pre-line;">${escapeHtml(receipt.restaurant.receiptExtraText)}</p>` : ""}
`;

  return emailWrapper(branding, content);
}

/* ------------------------------------------------------------------ */
/*  2. Order confirmation template                                     */
/* ------------------------------------------------------------------ */

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
  const symbol = data.currencySymbol || "\u20AC";

  const modeLabel =
    data.orderMode === "dine_in"
      ? "Dine-In"
      : data.orderMode === "take_away"
        ? "Take-Away"
        : data.orderMode === "delivery"
          ? "Delivery"
          : "";

  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr><td style="padding:4px 0;font-size:14px;color:#27272a;">${item.quantity}x ${escapeHtml(item.name)}</td><td style="padding:4px 0;font-size:14px;color:#27272a;text-align:right;">${formatCents(item.lineTotal, symbol)}</td></tr>`,
    )
    .join("");

  const content = `
<h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#18181b;">Order Confirmed</h2>
<p style="margin:0 0 20px 0;font-size:15px;color:#52525b;">Your order <strong>#${escapeHtml(data.orderIdShort.toUpperCase())}</strong> has been received.</p>

${modeLabel ? `<div style="display:inline-block;padding:4px 12px;background-color:#f0fdf4;color:#166534;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px;">${escapeHtml(modeLabel)}</div>` : ""}
${data.table ? `<p style="margin:0 0 12px 0;font-size:14px;color:#52525b;">Table: <strong>${escapeHtml(data.table)}</strong></p>` : ""}

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
${itemsHtml}
<tr><td colspan="2" style="border-top:2px solid #18181b;padding-top:8px;margin-top:8px;"></td></tr>
<tr>
<td style="font-size:16px;font-weight:700;color:#18181b;">Total</td>
<td style="font-size:16px;font-weight:700;color:#18181b;text-align:right;">${formatCents(data.totalCents, symbol)}</td>
</tr>
</table>

<p style="margin:20px 0 0 0;font-size:13px;color:#71717a;">${formatDateReadable(data.timestamp)}</p>
`;

  return emailWrapper(data.restaurant, content);
}

/* ------------------------------------------------------------------ */
/*  3. Reservation confirmation template                               */
/* ------------------------------------------------------------------ */

export function reservationTemplate(data: ReservationConfirmationData): string {
  const content = `
<h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#18181b;">Reservation Confirmed</h2>
<p style="margin:0 0 20px 0;font-size:15px;color:#52525b;">Hello <strong>${escapeHtml(data.customerName)}</strong>, your reservation is confirmed.</p>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#f4f4f5;border-radius:8px;">
<tr><td style="padding:16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td style="padding:4px 0;font-size:14px;color:#71717a;width:120px;">Date</td>
<td style="padding:4px 0;font-size:14px;font-weight:600;color:#18181b;">${escapeHtml(data.date)}</td>
</tr>
<tr>
<td style="padding:4px 0;font-size:14px;color:#71717a;">Time</td>
<td style="padding:4px 0;font-size:14px;font-weight:600;color:#18181b;">${escapeHtml(data.time)}</td>
</tr>
<tr>
<td style="padding:4px 0;font-size:14px;color:#71717a;">Guests</td>
<td style="padding:4px 0;font-size:14px;font-weight:600;color:#18181b;">${data.partySize}</td>
</tr>
${data.notes ? `<tr><td style="padding:4px 0;font-size:14px;color:#71717a;">Notes</td><td style="padding:4px 0;font-size:14px;color:#18181b;">${escapeHtml(data.notes)}</td></tr>` : ""}
</table>
</td></tr>
</table>

<p style="margin:20px 0 0 0;font-size:13px;color:#71717a;">Reservation ID: ${escapeHtml(data.reservationId)}</p>
<p style="margin:8px 0 0 0;font-size:13px;color:#a1a1aa;">If you need to cancel or modify your reservation, please contact us directly.</p>
`;

  return emailWrapper(data.restaurant, content);
}

/* ------------------------------------------------------------------ */
/*  4. Staff alert template                                            */
/* ------------------------------------------------------------------ */

export function staffAlertTemplate(data: StaffAlertData): string {
  const alertColors: Record<string, { bg: string; border: string; text: string }> = {
    low_stock: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
    new_order: { bg: "#ecfdf5", border: "#10b981", text: "#065f46" },
    shift_change: { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" },
    system: { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" },
    custom: { bg: "#f0f9ff", border: "#3b82f6", text: "#1e40af" },
  };

  const colors = alertColors[data.alertType] || alertColors.custom;

  const actionHtml = data.actionUrl
    ? `<div style="margin-top:16px;text-align:center;">
<a href="${escapeHtml(data.actionUrl)}" style="display:inline-block;padding:10px 24px;background-color:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">${escapeHtml(data.actionLabel || "View Details")}</a>
</div>`
    : "";

  const content = `
<div style="padding:16px;background-color:${colors.bg};border-left:4px solid ${colors.border};border-radius:4px;margin-bottom:16px;">
<h2 style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:${colors.text};">${escapeHtml(data.title)}</h2>
<p style="margin:0;font-size:14px;color:${colors.text};line-height:1.5;">${escapeHtml(data.message)}</p>
</div>

<p style="margin:0;font-size:12px;color:#a1a1aa;">${formatDateReadable(data.timestamp)}</p>
${actionHtml}
`;

  return emailWrapper(data.restaurant, content);
}
