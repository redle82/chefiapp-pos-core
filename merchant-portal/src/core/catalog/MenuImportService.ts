/**
 * Menu Import Service -- parses CSV/text menu data into structured products.
 *
 * Supports CSV format: name,price,category,description (optional)
 * Handles quoted values, European decimal separators (12,50), and
 * common currency symbols.
 *
 * Max 500 data rows per import to keep the UI responsive.
 */

export interface ParsedMenuItem {
  name: string;
  price: number;
  category: string;
  description?: string;
  /** 1-based row index in the original file (header = row 1) */
  rowIndex: number;
}

export interface ImportError {
  row: number;
  column: string;
  message: string;
  rawValue: string;
}

export interface MenuImportResult {
  items: ParsedMenuItem[];
  errors: ImportError[];
  totalRows: number;
  validRows: number;
  categories: string[];
}

const MAX_ROWS = 500;
const REQUIRED_COLUMNS = ["name", "price", "category"] as const;
const OPTIONAL_COLUMNS = ["description"] as const;
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

/**
 * Parse CSV text into menu items.
 * Expected format: name,price,category,description
 * First row must be a header.
 */
export function parseMenuCSV(csvText: string): MenuImportResult {
  const lines = csvText.trim().split(/\r?\n/);
  const items: ParsedMenuItem[] = [];
  const errors: ImportError[] = [];

  if (lines.length < 2) {
    return {
      items: [],
      errors: [
        {
          row: 0,
          column: "file",
          message:
            "File must have a header row and at least one data row",
          rawValue: "",
        },
      ],
      totalRows: 0,
      validRows: 0,
      categories: [],
    };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) =>
    h.trim().toLowerCase(),
  );

  // Validate required columns
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      errors.push({
        row: 0,
        column: col,
        message: `Missing required column: "${col}". Expected columns: ${ALL_COLUMNS.join(", ")}`,
        rawValue: headerLine,
      });
    }
  }

  if (errors.length > 0) {
    return { items: [], errors, totalRows: 0, validRows: 0, categories: [] };
  }

  const colIndex = {
    name: headers.indexOf("name"),
    price: headers.indexOf("price"),
    category: headers.indexOf("category"),
    description: headers.indexOf("description"),
  };

  // Parse data rows (cap at MAX_ROWS)
  const dataLines = lines.slice(1, MAX_ROWS + 1);
  const categories = new Set<string>();

  for (let i = 0; i < dataLines.length; i++) {
    const rowIndex = i + 2; // 1-based, skip header
    const line = dataLines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    // Validate name
    const name = values[colIndex.name]?.trim() ?? "";
    if (!name) {
      errors.push({
        row: rowIndex,
        column: "name",
        message: "Name is required",
        rawValue: line,
      });
      continue;
    }

    // Validate price
    const priceStr = values[colIndex.price]?.trim() ?? "";
    const price = parsePrice(priceStr);
    if (price === null) {
      errors.push({
        row: rowIndex,
        column: "price",
        message: `Invalid price: "${priceStr}". Use numbers like 9.50 or 12,00`,
        rawValue: priceStr,
      });
      continue;
    }

    // Validate category
    const category = values[colIndex.category]?.trim() ?? "";
    if (!category) {
      errors.push({
        row: rowIndex,
        column: "category",
        message: "Category is required",
        rawValue: line,
      });
      continue;
    }

    const description =
      colIndex.description >= 0
        ? values[colIndex.description]?.trim()
        : undefined;

    categories.add(category);
    items.push({
      name,
      price,
      category,
      description: description || undefined,
      rowIndex,
    });
  }

  return {
    items,
    errors,
    totalRows: dataLines.filter((l) => l.trim()).length,
    validRows: items.length,
    categories: Array.from(categories).sort(),
  };
}

/**
 * Parse a single CSV line, handling quoted values with commas inside.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Parse a price string, handling both . and , as decimal separators.
 * Strips common currency symbols before parsing.
 */
function parsePrice(str: string): number | null {
  if (!str) return null;

  // Remove currency symbols and whitespace
  const cleaned = str.replace(/[\u20ac$\u00a3\u00a5\s]/g, "").replace(/R\$/g, "").trim();

  // Handle comma as decimal separator (European format: 12,50)
  const normalized =
    cleaned.includes(",") && !cleaned.includes(".")
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, ""); // Remove thousand separators

  const value = parseFloat(normalized);
  if (isNaN(value) || value < 0) return null;

  return Math.round(value * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate a sample CSV template for download.
 * Uses Portuguese product names as ChefiApp targets PT/BR markets.
 */
export function generateCSVTemplate(): string {
  return [
    "name,price,category,description",
    "Cafe Espresso,1.50,Bebidas Quentes,Espresso tradicional",
    "Cappuccino,2.50,Bebidas Quentes,Com espuma de leite",
    "Tosta Mista,3.00,Tostas,Fiambre e queijo",
    "Pastel de Nata,1.20,Pastelaria,Pastel de nata tradicional",
    "Sumo de Laranja Natural,3.50,Bebidas Frias,Espremido na hora",
  ].join("\n");
}
