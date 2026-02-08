/**
 * ticket-customization-service.ts — Ticket Customization Service
 * 
 * Custom ticket/receipt templates, inspired by Last.app ticket customization.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface TicketTemplate {
  id: string;
  restaurant_id: string;
  template_name: string;
  template_type: 'receipt' | 'kitchen' | 'bar' | 'delivery';
  header_html?: string;
  footer_html?: string;
  logo_url?: string;
  show_qr: boolean;
  show_tax_info: boolean;
  custom_fields: Record<string, any>;
  is_default: boolean;
}

/**
 * Create ticket template
 */
export async function createTicketTemplate(
  restaurantId: string,
  template: {
    template_name: string;
    template_type: 'receipt' | 'kitchen' | 'bar' | 'delivery';
    header_html?: string;
    footer_html?: string;
    logo_url?: string;
    show_qr?: boolean;
    show_tax_info?: boolean;
    custom_fields?: Record<string, any>;
    is_default?: boolean;
  }
): Promise<TicketTemplate> {
  // If setting as default, unset other defaults of same type
  if (template.is_default) {
    await pool.query(
      `UPDATE operational_hub_ticket_templates
       SET is_default = false
       WHERE restaurant_id = $1
         AND template_type = $2`,
      [restaurantId, template.template_type]
    );
  }

  const result = await pool.query(
    `INSERT INTO operational_hub_ticket_templates
     (restaurant_id, template_name, template_type, header_html, footer_html, logo_url, show_qr, show_tax_info, custom_fields, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
     RETURNING id, restaurant_id, template_name, template_type, header_html, footer_html, logo_url, show_qr, show_tax_info, custom_fields, is_default`,
    [
      restaurantId,
      template.template_name,
      template.template_type,
      template.header_html || null,
      template.footer_html || null,
      template.logo_url || null,
      template.show_qr ?? false,
      template.show_tax_info ?? true,
      JSON.stringify(template.custom_fields || {}),
      template.is_default ?? false,
    ]
  );

  return result.rows[0];
}

/**
 * Get default template for type
 */
export async function getDefaultTemplate(
  restaurantId: string,
  templateType: 'receipt' | 'kitchen' | 'bar' | 'delivery'
): Promise<TicketTemplate | null> {
  const result = await pool.query(
    `SELECT id, restaurant_id, template_name, template_type, header_html, footer_html, logo_url, show_qr, show_tax_info, custom_fields, is_default
     FROM operational_hub_ticket_templates
     WHERE restaurant_id = $1
       AND template_type = $2
       AND is_default = true
     LIMIT 1`,
    [restaurantId, templateType]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Render ticket HTML
 */
export function renderTicketHTML(
  template: TicketTemplate,
  orderData: {
    order_id: string;
    table_id?: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    tax?: number;
    total: number;
    payment_method?: string;
    created_at: string;
  }
): string {
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket</title></head><body>';

  // Header
  if (template.header_html) {
    html += template.header_html;
  } else {
    html += `<div style="text-align: center; margin-bottom: 20px;">`;
    if (template.logo_url) {
      html += `<img src="${template.logo_url}" alt="Logo" style="max-width: 200px;">`;
    }
    html += `</div>`;
  }

  // Order info
  html += `<div style="margin-bottom: 20px;">`;
  html += `<p><strong>Pedido:</strong> ${orderData.order_id.substring(0, 8)}</p>`;
  if (orderData.table_id) {
    html += `<p><strong>Mesa:</strong> ${orderData.table_id}</p>`;
  }
  html += `<p><strong>Data:</strong> ${new Date(orderData.created_at).toLocaleString('pt-BR')}</p>`;
  html += `</div>`;

  // Items
  html += `<table style="width: 100%; margin-bottom: 20px;">`;
  html += `<thead><tr><th>Item</th><th>Qtd</th><th>Preço</th></tr></thead>`;
  html += `<tbody>`;
  for (const item of orderData.items) {
    html += `<tr>`;
    html += `<td>${item.name}</td>`;
    html += `<td>${item.quantity}</td>`;
    html += `<td>€${item.price.toFixed(2)}</td>`;
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  // Totals
  html += `<div style="margin-top: 20px; border-top: 2px solid #000; padding-top: 10px;">`;
  html += `<p><strong>Subtotal:</strong> €${orderData.subtotal.toFixed(2)}</p>`;
  if (template.show_tax_info && orderData.tax) {
    html += `<p><strong>IVA:</strong> €${orderData.tax.toFixed(2)}</p>`;
  }
  html += `<p><strong>Total:</strong> €${orderData.total.toFixed(2)}</p>`;
  if (orderData.payment_method) {
    html += `<p><strong>Pagamento:</strong> ${orderData.payment_method}</p>`;
  }
  html += `</div>`;

  // QR Code (if enabled)
  if (template.show_qr) {
    html += `<div style="text-align: center; margin-top: 20px;">`;
    html += `<!-- QR Code would be generated here -->`;
    html += `</div>`;
  }

  // Footer
  if (template.footer_html) {
    html += template.footer_html;
  } else {
    html += `<div style="text-align: center; margin-top: 20px; font-size: 12px;">`;
    html += `<p>Obrigado pela sua visita!</p>`;
    html += `</div>`;
  }

  html += '</body></html>';
  return html;
}

