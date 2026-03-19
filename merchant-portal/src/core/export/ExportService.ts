/**
 * ExportService — Unified export orchestrator for PDF, Excel and CSV.
 *
 * Provides high-level methods that map report data into the correct
 * format for each export type. All exports trigger browser download.
 */

import { buildCsvFromRows, downloadCsvFile } from "../reports/csvExport";
import type { ExcelColumn, ExcelSheet } from "./ExcelGenerator";
import { generateExcel } from "./ExcelGenerator";
import type {
  PDFBranding,
  PDFReportOptions,
  PDFSection,
  PDFTableColumn,
} from "./PDFGenerator";
import { generatePDF } from "./PDFGenerator";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ExportFormat = "pdf" | "excel" | "csv";

export interface ExportColumn {
  header: string;
  align?: "left" | "right" | "center";
  format?: "text" | "currency" | "number" | "percentage" | "date";
}

export interface ExportDataset {
  /** Sheet/section name */
  name: string;
  columns: ExportColumn[];
  rows: Array<Array<string | number | null | undefined>>;
  /** Optional totals row */
  footerRow?: Array<string | number | null | undefined>;
  /** Optional summary cards (PDF only) */
  summaryCards?: Array<{ label: string; value: string; highlight?: boolean }>;
  subtitle?: string;
}

export interface ExportReportOptions {
  title: string;
  subtitle?: string;
  dateRange?: string;
  filename: string;
  branding: PDFBranding;
  datasets: ExportDataset[];
  orientation?: "portrait" | "landscape";
}

/* ------------------------------------------------------------------ */
/*  CSV Export                                                         */
/* ------------------------------------------------------------------ */

function exportCSV(options: ExportReportOptions): void {
  // For CSV, we concatenate all datasets
  for (const dataset of options.datasets) {
    const headers = dataset.columns.map((c) => c.header);
    const rows = dataset.rows.map((row) =>
      row.map((cell) => (cell != null ? String(cell) : "")),
    );

    if (dataset.footerRow) {
      rows.push(
        dataset.footerRow.map((cell) => (cell != null ? String(cell) : "")),
      );
    }

    const csv = buildCsvFromRows(headers, rows);
    const suffix =
      options.datasets.length > 1
        ? `-${dataset.name.toLowerCase().replace(/\s+/g, "-")}`
        : "";
    downloadCsvFile(csv, `${options.filename}${suffix}.csv`);
  }
}

/* ------------------------------------------------------------------ */
/*  Excel Export                                                       */
/* ------------------------------------------------------------------ */

function exportExcel(options: ExportReportOptions): void {
  const sheets: ExcelSheet[] = options.datasets.map((dataset) => ({
    name: dataset.name,
    columns: dataset.columns.map(
      (col): ExcelColumn => ({
        header: col.header,
        format: col.format,
      }),
    ),
    rows: dataset.rows,
    footerRow: dataset.footerRow,
  }));

  generateExcel({
    sheets,
    filename: `${options.filename}.xls`,
  });
}

/* ------------------------------------------------------------------ */
/*  PDF Export                                                         */
/* ------------------------------------------------------------------ */

async function exportPDF(options: ExportReportOptions): Promise<void> {
  const sections: PDFSection[] = options.datasets.map((dataset) => ({
    title: dataset.name,
    subtitle: dataset.subtitle,
    summaryCards: dataset.summaryCards,
    table: {
      columns: dataset.columns.map(
        (col): PDFTableColumn => ({
          header: col.header,
          align: col.align,
        }),
      ),
      rows: dataset.rows.map((row) =>
        row.map((cell) => (cell != null ? String(cell) : "")),
      ),
      footerRow: dataset.footerRow?.map((cell) =>
        cell != null ? String(cell) : "",
      ),
    },
  }));

  const pdfOptions: PDFReportOptions = {
    title: options.title,
    subtitle: options.subtitle,
    dateRange: options.dateRange,
    branding: options.branding,
    sections,
    orientation: options.orientation,
  };

  await generatePDF(pdfOptions);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Export report data in the specified format.
 * All formats trigger browser download (PDF via print dialog).
 */
export async function exportReport(
  format: ExportFormat,
  options: ExportReportOptions,
): Promise<void> {
  switch (format) {
    case "pdf":
      await exportPDF(options);
      break;
    case "excel":
      exportExcel(options);
      break;
    case "csv":
      exportCSV(options);
      break;
  }
}

/**
 * Convenience: export to PDF.
 */
export async function exportToPDF(
  options: ExportReportOptions,
): Promise<void> {
  await exportPDF(options);
}

/**
 * Convenience: export to Excel.
 */
export function exportToExcel(options: ExportReportOptions): void {
  exportExcel(options);
}

/**
 * Convenience: export to CSV.
 */
export function exportToCSV(options: ExportReportOptions): void {
  exportCSV(options);
}

/**
 * Format cents as a decimal string (e.g., 1234 -> "12.34").
 */
export function centsToDecimalStr(cents: number): string {
  return ((cents || 0) / 100).toFixed(2);
}
