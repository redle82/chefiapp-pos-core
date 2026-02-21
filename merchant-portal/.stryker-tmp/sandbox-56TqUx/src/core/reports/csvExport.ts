/**
 * CSV Export Utility
 *
 * Shared helper for building and downloading CSV files across report pages.
 * Uses BOM (Byte Order Mark) for Excel UTF-8 compatibility.
 */
// @ts-nocheck


const BOM = "\uFEFF";

/**
 * Escape a CSV cell value (wrap in quotes if contains comma, newline, or quote).
 */
function escapeCell(value: unknown): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string from headers and rows.
 */
export function buildCsvFromRows(
  headers: string[],
  rows: Array<Array<unknown>>,
): string {
  const headerLine = headers.map(escapeCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCell).join(","));
  return BOM + [headerLine, ...dataLines].join("\r\n");
}

/**
 * Download a CSV string as a file via browser <a> click.
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Build + download in one shot.
 */
export function exportCsv(
  headers: string[],
  rows: Array<Array<unknown>>,
  filename: string,
): void {
  const csv = buildCsvFromRows(headers, rows);
  downloadCsvFile(csv, filename);
}

/**
 * Format cents as a decimal string for CSV (no currency symbol).
 */
export function centsToDecimal(cents: number): string {
  return ((cents || 0) / 100).toFixed(2);
}
