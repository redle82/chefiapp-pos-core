/**
 * POST /api/reports/receipt-pdf
 *
 * Generates a PDF receipt from order data.
 * Uses a simple HTML-to-PDF approach via Vercel's Chromium layer
 * or falls back to a lightweight HTML response with print media styles.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, AuthError } from "../_lib/auth";

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptData {
  orderId: string;
  orderNumber?: string;
  restaurant: {
    name: string;
    address?: string;
    phone?: string;
    taxId?: string;
    logoUrl?: string;
  };
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashier?: string;
  createdAt: string;
  notes?: string;
}

function validateReceiptData(body: unknown): ReceiptData {
  if (!body || typeof body !== "object") {
    throw new Error("Request body is required");
  }

  const data = body as Record<string, unknown>;

  if (!data.orderId || typeof data.orderId !== "string") {
    throw new Error("'orderId' is required");
  }
  if (!data.restaurant || typeof data.restaurant !== "object") {
    throw new Error("'restaurant' object is required");
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("'items' array is required and must not be empty");
  }

  return data as unknown as ReceiptData;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(amount / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function buildReceiptHtml(data: ReceiptData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td>${item.quantity}x ${escapeHtml(item.name)}</td>
        <td class="right">${formatCurrency(item.total)}</td>
      </tr>`,
    )
    .join("");

  const logoBlock = data.restaurant.logoUrl
    ? `<img src="${escapeHtml(data.restaurant.logoUrl)}" alt="Logo" class="logo" />`
    : "";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>Recibo #${escapeHtml(data.orderNumber ?? data.orderId.slice(0, 8))}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0 auto; }
    .logo { max-width: 50mm; max-height: 20mm; display: block; margin: 0 auto 4mm; }
    .center { text-align: center; }
    .right { text-align: right; }
    .divider { border-top: 1px dashed #000; margin: 4mm 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 1mm 0; vertical-align: top; }
    .total-row { font-weight: bold; font-size: 14px; }
    .footer { margin-top: 4mm; font-size: 10px; text-align: center; color: #666; }
  </style>
</head>
<body>
  ${logoBlock}
  <div class="center">
    <strong>${escapeHtml(data.restaurant.name)}</strong><br/>
    ${data.restaurant.address ? escapeHtml(data.restaurant.address) + "<br/>" : ""}
    ${data.restaurant.phone ? escapeHtml(data.restaurant.phone) + "<br/>" : ""}
    ${data.restaurant.taxId ? "NIF: " + escapeHtml(data.restaurant.taxId) + "<br/>" : ""}
  </div>

  <div class="divider"></div>

  <div>
    <strong>Pedido:</strong> #${escapeHtml(data.orderNumber ?? data.orderId.slice(0, 8))}<br/>
    <strong>Data:</strong> ${formatDate(data.createdAt)}<br/>
    ${data.cashier ? "<strong>Operador:</strong> " + escapeHtml(data.cashier) + "<br/>" : ""}
  </div>

  <div class="divider"></div>

  <table>${itemRows}</table>

  <div class="divider"></div>

  <table>
    <tr><td>Subtotal</td><td class="right">${formatCurrency(data.subtotal)}</td></tr>
    ${data.discount > 0 ? `<tr><td>Desconto</td><td class="right">-${formatCurrency(data.discount)}</td></tr>` : ""}
    <tr><td>IVA</td><td class="right">${formatCurrency(data.tax)}</td></tr>
    <tr class="total-row"><td>TOTAL</td><td class="right">${formatCurrency(data.total)}</td></tr>
  </table>

  <div class="divider"></div>

  <div class="center">
    <strong>Pagamento:</strong> ${escapeHtml(data.paymentMethod)}<br/>
    ${data.notes ? "<em>" + escapeHtml(data.notes) + "</em><br/>" : ""}
  </div>

  <div class="footer">
    Obrigado pela sua visita!<br/>
    Processado por ChefiApp
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await verifyAuth(req);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Authentication failed" });
    return;
  }

  let data: ReceiptData;
  try {
    data = validateReceiptData(req.body);
  } catch (err) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Invalid request" });
    return;
  }

  const html = buildReceiptHtml(data);
  const orderRef = data.orderNumber ?? data.orderId.slice(0, 8);

  // Return HTML with print-ready styles. The client can use
  // window.print() or a headless renderer to produce the PDF.
  res
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .setHeader(
      "Content-Disposition",
      `inline; filename="recibo-${orderRef}.html"`,
    )
    .status(200)
    .send(html);
}
