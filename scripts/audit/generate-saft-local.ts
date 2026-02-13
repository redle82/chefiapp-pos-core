import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import {
  buildAtcud,
  buildInvoiceNumber,
  computeHashChain,
} from "../../fiscal-modules/pt/saft/saftUtils";
import { generateSaftXml } from "../../fiscal-modules/pt/saft/saftXml";
import type { TaxDocument } from "../../fiscal-modules/types";
import { LegalComplianceValidator } from "../../fiscal-modules/validators/LegalComplianceValidator";

const args = process.argv.slice(2);

const getArg = (name: string, fallback: string): string => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
};

const restaurantId = getArg(
  "restaurant-id",
  "0f2c8b6a-3b4c-4b68-9b52-2e5e5a6b7c91",
);
const restaurantName = getArg("restaurant-name", "Sofia Gastrobar Ibiza");
const start = getArg("start", "2026-01-20");
const end = getArg("end", "2026-02-13");
const taxRegistrationNumber = getArg("nif", "999999999");
const address = getArg("address", "Rua do Porto 100");
const city = getArg("city", "Lisboa");
const postalCode = getArg("postal-code", "1000-000");

const items = [
  {
    product_id: "BRG001",
    name: "Burger Classico",
    quantity: 2,
    price_snapshot: 2500,
  },
  {
    product_id: "DRK010",
    name: "Sangria",
    quantity: 1,
    price_snapshot: 1200,
  },
];

const totalCents = items.reduce(
  (sum, item) => sum + item.price_snapshot * item.quantity,
  0,
);

const orderId = `ORDER-PT-${end.replace(/-/g, "")}-001`;
const eventId = randomUUID();
const sealId = randomUUID();
const vatRate = 0.23;
const totalAmount = totalCents / 100;
const vatAmount = (totalAmount * vatRate) / (1 + vatRate);
const subtotal = totalAmount - vatAmount;
const invoiceSeries = getArg("series", "FT-2026");
const invoiceSequence = Number(getArg("sequence", "1"));
const invoiceNumber = buildInvoiceNumber(invoiceSeries, invoiceSequence);
const atcud = buildAtcud(invoiceSeries, invoiceSequence);
const issuedAt = new Date().toISOString();
const hashChain = computeHashChain(
  "GENESIS",
  `${invoiceNumber}|${totalAmount.toFixed(2)}|${issuedAt}|${sealId}`,
);

const taxItems = items.map((item) => ({
  code: item.product_id,
  description: item.name,
  quantity: item.quantity,
  unit_price: item.price_snapshot / 100,
  total: (item.price_snapshot * item.quantity) / 100,
}));

const taxDoc: TaxDocument = {
  doc_type: "SAF-T",
  ref_event_id: eventId,
  ref_seal_id: sealId,
  total_amount: totalAmount,
  taxes: {
    vat: vatAmount,
  },
  vatRate,
  vatAmount: Math.round(vatAmount * 100),
  items: taxItems,
  raw_payload: {
    order_id: orderId,
    restaurant_id: restaurantId,
    total_amount: totalAmount,
    vat_amount: vatAmount,
    subtotal,
    items: taxItems,
    generated_at: new Date().toISOString(),
    issued_at: issuedAt,
    invoice_series: invoiceSeries,
    invoice_sequence: invoiceSequence,
    invoice_number: invoiceNumber,
    atcud,
    hash_chain_prev: "GENESIS",
    hash_chain: hashChain,
    seal_hash: sealId,
    restaurant_name: restaurantName,
    tax_registration_number: taxRegistrationNumber,
    address,
    city,
    postal_code: postalCode,
    period_start: start,
    period_end: end,
  },
};
const xml = generateSaftXml(taxDoc);
const validation = LegalComplianceValidator.validate(taxDoc, "PT");

const outputDir = path.resolve(
  __dirname,
  "../../docs/audit/pt/evidence/engineering",
);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const xmlPath = path.join(outputDir, "saft_export_20260213.xml");
const logPath = path.join(outputDir, "saft_export_20260213.log");
const validationPath = path.join(
  outputDir,
  "pt_validation_report_20260213.json",
);

fs.writeFileSync(xmlPath, xml, "utf8");
fs.writeFileSync(validationPath, JSON.stringify(validation, null, 2), "utf8");

const logLines = [
  "SAF-T export (local)",
  `Restaurant: ${restaurantName}`,
  `Restaurant UUID: ${restaurantId}`,
  `Period: ${start} to ${end}`,
  `Order ID: ${orderId}`,
  `Items: ${items.length}`,
  `Total cents: ${totalCents}`,
  `Validation errors: ${validation.errors.length}`,
  `Validation warnings: ${validation.warnings.length}`,
  `XML: ${xmlPath}`,
  `Validation JSON: ${validationPath}`,
];

fs.writeFileSync(logPath, logLines.join("\n"), "utf8");

console.log(logLines.join("\n"));
