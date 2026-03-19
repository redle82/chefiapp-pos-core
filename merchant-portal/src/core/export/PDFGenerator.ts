/**
 * PDFGenerator — Browser-based PDF generation via hidden iframe + window.print().
 *
 * No external libraries. Uses CSS @media print for professional layout.
 * The browser's native print dialog allows saving as PDF.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PDFBranding {
  restaurantName: string;
  address?: string;
  phone?: string;
  taxId?: string;
  logoUrl?: string;
}

export interface PDFTableColumn {
  header: string;
  /** Alignment: "left" (default), "right", "center" */
  align?: "left" | "right" | "center";
}

export interface PDFSection {
  title?: string;
  subtitle?: string;
  /** Key-value summary cards */
  summaryCards?: Array<{ label: string; value: string; highlight?: boolean }>;
  /** Table data */
  table?: {
    columns: PDFTableColumn[];
    rows: string[][];
    /** Optional footer row (e.g. totals) */
    footerRow?: string[];
  };
  /** Free-form HTML content */
  html?: string;
}

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  dateRange?: string;
  branding: PDFBranding;
  sections: PDFSection[];
  /** Orientation: "portrait" (default) or "landscape" */
  orientation?: "portrait" | "landscape";
}

/* ------------------------------------------------------------------ */
/*  Style sheet for print                                              */
/* ------------------------------------------------------------------ */

function buildPrintStyles(orientation: string): string {
  return `
    @page {
      size: A4 ${orientation};
      margin: 15mm 12mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      line-height: 1.5;
      background: #fff;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 16px;
    }

    .report-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .report-logo {
      max-height: 48px;
      max-width: 120px;
      object-fit: contain;
    }

    .report-brand-name {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .report-brand-detail {
      font-size: 9px;
      color: #666;
      margin-top: 2px;
    }

    .report-header-right {
      text-align: right;
    }

    .report-title {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .report-subtitle {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }

    .report-date-range {
      font-size: 10px;
      color: #888;
      margin-top: 4px;
    }

    /* Sections */
    .report-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
    }

    .section-subtitle {
      font-size: 9px;
      color: #888;
      margin-bottom: 8px;
    }

    /* Summary cards */
    .summary-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .summary-card {
      flex: 1;
      min-width: 120px;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px 14px;
      text-align: center;
    }

    .summary-card.highlight {
      border-color: #1a1a1a;
      background: #f5f5f5;
    }

    .summary-label {
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-top: 2px;
    }

    /* Tables */
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    .report-table thead th {
      background: #f5f5f5;
      border-bottom: 2px solid #ccc;
      padding: 6px 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.3px;
      color: #555;
    }

    .report-table tbody td {
      padding: 5px 8px;
      border-bottom: 1px solid #eee;
    }

    .report-table tbody tr:nth-child(even) {
      background: #fafafa;
    }

    .report-table tfoot td {
      padding: 6px 8px;
      border-top: 2px solid #ccc;
      font-weight: 700;
      background: #f5f5f5;
    }

    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Footer */
    .report-footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      font-size: 8px;
      color: #aaa;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      .no-print { display: none !important; }
    }
  `;
}

/* ------------------------------------------------------------------ */
/*  HTML builder                                                       */
/* ------------------------------------------------------------------ */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBrandingHtml(branding: PDFBranding): string {
  const details: string[] = [];
  if (branding.address) details.push(escapeHtml(branding.address));
  if (branding.phone) details.push(escapeHtml(branding.phone));
  if (branding.taxId) details.push(`NIF: ${escapeHtml(branding.taxId)}`);

  return `
    <div class="report-header-left">
      ${branding.logoUrl ? `<img class="report-logo" src="${escapeHtml(branding.logoUrl)}" alt="" />` : ""}
      <div>
        <div class="report-brand-name">${escapeHtml(branding.restaurantName)}</div>
        ${details.length > 0 ? `<div class="report-brand-detail">${details.join(" | ")}</div>` : ""}
      </div>
    </div>
  `;
}

function buildSectionHtml(section: PDFSection): string {
  let html = `<div class="report-section">`;

  if (section.title) {
    html += `<div class="section-title">${escapeHtml(section.title)}</div>`;
  }
  if (section.subtitle) {
    html += `<div class="section-subtitle">${escapeHtml(section.subtitle)}</div>`;
  }

  // Summary cards
  if (section.summaryCards && section.summaryCards.length > 0) {
    html += `<div class="summary-grid">`;
    for (const card of section.summaryCards) {
      const cls = card.highlight ? "summary-card highlight" : "summary-card";
      html += `
        <div class="${cls}">
          <div class="summary-label">${escapeHtml(card.label)}</div>
          <div class="summary-value">${escapeHtml(card.value)}</div>
        </div>
      `;
    }
    html += `</div>`;
  }

  // Table
  if (section.table) {
    const { columns, rows, footerRow } = section.table;
    html += `<table class="report-table"><thead><tr>`;
    for (const col of columns) {
      const alignCls = `text-${col.align ?? "left"}`;
      html += `<th class="${alignCls}">${escapeHtml(col.header)}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (const row of rows) {
      html += `<tr>`;
      for (let i = 0; i < row.length; i++) {
        const alignCls = `text-${columns[i]?.align ?? "left"}`;
        html += `<td class="${alignCls}">${escapeHtml(row[i] ?? "")}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody>`;

    if (footerRow) {
      html += `<tfoot><tr>`;
      for (let i = 0; i < footerRow.length; i++) {
        const alignCls = `text-${columns[i]?.align ?? "left"}`;
        html += `<td class="${alignCls}">${escapeHtml(footerRow[i] ?? "")}</td>`;
      }
      html += `</tr></tfoot>`;
    }

    html += `</table>`;
  }

  // Free-form HTML
  if (section.html) {
    html += section.html;
  }

  html += `</div>`;
  return html;
}

function buildFullHtml(opts: PDFReportOptions): string {
  const orientation = opts.orientation ?? "portrait";
  const printDate = new Date().toLocaleString();

  let sectionsHtml = "";
  for (const section of opts.sections) {
    sectionsHtml += buildSectionHtml(section);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(opts.title)}</title>
  <style>${buildPrintStyles(orientation)}</style>
</head>
<body>
  <div class="report-header">
    ${buildBrandingHtml(opts.branding)}
    <div class="report-header-right">
      <div class="report-title">${escapeHtml(opts.title)}</div>
      ${opts.subtitle ? `<div class="report-subtitle">${escapeHtml(opts.subtitle)}</div>` : ""}
      ${opts.dateRange ? `<div class="report-date-range">${escapeHtml(opts.dateRange)}</div>` : ""}
    </div>
  </div>
  ${sectionsHtml}
  <div class="report-footer">
    <span>${escapeHtml(opts.branding.restaurantName)} - ChefIApp POS</span>
    <span>Generated: ${escapeHtml(printDate)}</span>
  </div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Opens a print dialog for a PDF report. Uses a hidden iframe to render
 * the report HTML, then triggers window.print() inside the iframe.
 *
 * The user can choose "Save as PDF" in the browser print dialog.
 */
export function generatePDF(opts: PDFReportOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const html = buildFullHtml(opts);

    // Try to open a new window for printing
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content (especially images) to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          resolve();
        }, 300);
      };

      // Fallback if onload doesn't fire
      setTimeout(() => {
        try {
          printWindow.print();
        } catch {
          // Already printed or window closed
        }
        resolve();
      }, 2000);

      return;
    }

    // Fallback: use hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const iframeDoc =
      iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      reject(new Error("Could not access iframe document for PDF generation."));
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        reject(
          err instanceof Error
            ? err
            : new Error("Print failed from iframe."),
        );
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
      resolve();
    }, 500);
  });
}
