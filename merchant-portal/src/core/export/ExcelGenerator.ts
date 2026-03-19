/**
 * ExcelGenerator — Generates XLSX files using XML Spreadsheet format.
 *
 * No external libraries. Uses the XML Spreadsheet 2003 format which is
 * natively supported by Excel, Google Sheets, and LibreOffice.
 * Supports multiple sheets, column formatting, and auto-width.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CellFormat = "text" | "currency" | "number" | "percentage" | "date";

export interface ExcelColumn {
  header: string;
  format?: CellFormat;
  /** Column width in characters (approximate). Auto-calculated if omitted. */
  width?: number;
}

export interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  rows: Array<Array<string | number | null | undefined>>;
  /** Optional footer row (e.g. totals). Rendered with bold style. */
  footerRow?: Array<string | number | null | undefined>;
}

export interface ExcelWorkbookOptions {
  sheets: ExcelSheet[];
  filename: string;
}

/* ------------------------------------------------------------------ */
/*  XML helpers                                                        */
/* ------------------------------------------------------------------ */

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cellType(
  value: string | number | null | undefined,
  format?: CellFormat,
): { type: string; value: string } {
  if (value == null || value === "") {
    return { type: "String", value: "" };
  }

  if (typeof value === "number") {
    return { type: "Number", value: String(value) };
  }

  // Try to detect numbers in string form
  if (format === "currency" || format === "number" || format === "percentage") {
    const num = Number(value);
    if (!isNaN(num)) {
      return { type: "Number", value: String(num) };
    }
  }

  return { type: "String", value: escapeXml(String(value)) };
}

function styleIdForFormat(format?: CellFormat): string {
  switch (format) {
    case "currency":
      return "sCurrency";
    case "percentage":
      return "sPercent";
    case "date":
      return "sDate";
    case "number":
      return "sNumber";
    default:
      return "sDefault";
  }
}

/**
 * Calculate auto-width for a column based on header and data.
 * Returns width in characters (min 8, max 40).
 */
function autoWidth(
  header: string,
  rows: Array<Array<string | number | null | undefined>>,
  colIndex: number,
): number {
  let maxLen = header.length;
  for (const row of rows) {
    const cell = row[colIndex];
    if (cell != null) {
      const len = String(cell).length;
      if (len > maxLen) maxLen = len;
    }
  }
  return Math.max(8, Math.min(40, maxLen + 2));
}

/* ------------------------------------------------------------------ */
/*  Workbook builder                                                   */
/* ------------------------------------------------------------------ */

function buildXmlWorkbook(sheets: ExcelSheet[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
    </Style>
    <Style ss:ID="sDefault">
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="sHeader">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#2D2D2D" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
      </Borders>
    </Style>
    <Style ss:ID="sFooter">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
      <Interior ss:Color="#F0F0F0" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#000000"/>
      </Borders>
    </Style>
    <Style ss:ID="sCurrency">
      <NumberFormat ss:Format="#,##0.00"/>
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="sCurrencyFooter">
      <NumberFormat ss:Format="#,##0.00"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
      <Interior ss:Color="#F0F0F0" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#000000"/>
      </Borders>
    </Style>
    <Style ss:ID="sPercent">
      <NumberFormat ss:Format="0.0%"/>
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="sNumber">
      <NumberFormat ss:Format="#,##0"/>
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="sDate">
      <NumberFormat ss:Format="yyyy-mm-dd"/>
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
  </Styles>
`;

  for (const sheet of sheets) {
    const safeName = escapeXml(sheet.name.replace(/[\\/:*?[\]]/g, "_"));
    xml += `  <Worksheet ss:Name="${safeName}">
    <Table>
`;

    // Column widths
    for (let i = 0; i < sheet.columns.length; i++) {
      const col = sheet.columns[i];
      const w = col.width ?? autoWidth(col.header, sheet.rows, i);
      // Convert char-width to approximate pixel width (1 char ~ 7px)
      const pixelWidth = w * 7;
      xml += `      <Column ss:AutoFitWidth="1" ss:Width="${pixelWidth}"/>
`;
    }

    // Header row
    xml += `      <Row ss:AutoFitHeight="1">
`;
    for (const col of sheet.columns) {
      xml += `        <Cell ss:StyleID="sHeader"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>
`;
    }
    xml += `      </Row>
`;

    // Data rows
    for (const row of sheet.rows) {
      xml += `      <Row>
`;
      for (let i = 0; i < row.length; i++) {
        const format = sheet.columns[i]?.format;
        const styleId = styleIdForFormat(format);
        const { type, value } = cellType(row[i], format);
        xml += `        <Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${value}</Data></Cell>
`;
      }
      xml += `      </Row>
`;
    }

    // Footer row
    if (sheet.footerRow) {
      xml += `      <Row>
`;
      for (let i = 0; i < sheet.footerRow.length; i++) {
        const format = sheet.columns[i]?.format;
        const footerStyleId =
          format === "currency" ? "sCurrencyFooter" : "sFooter";
        const { type, value } = cellType(sheet.footerRow[i], format);
        xml += `        <Cell ss:StyleID="${footerStyleId}"><Data ss:Type="${type}">${value}</Data></Cell>
`;
      }
      xml += `      </Row>
`;
    }

    xml += `    </Table>
  </Worksheet>
`;
  }

  xml += `</Workbook>`;
  return xml;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generate and download an Excel file (.xls XML Spreadsheet format).
 *
 * Uses XML Spreadsheet 2003 format which opens natively in Excel,
 * Google Sheets, and LibreOffice Calc with full formatting support.
 */
export function generateExcel(options: ExcelWorkbookOptions): void {
  const xml = buildXmlWorkbook(options.sheets);
  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = options.filename.endsWith(".xls")
    ? options.filename
    : `${options.filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
