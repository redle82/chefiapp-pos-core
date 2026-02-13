import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
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
    restaurant_name: restaurantName,
    tax_registration_number: taxRegistrationNumber,
    address,
    city,
    postal_code: postalCode,
    period_start: start,
    period_end: end,
  },
};

const escapeXml = (value: string): string => {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const generateSaftXml = (doc: TaxDocument): string => {
  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = nowIso.split("T")[0];
  const linesXml = doc.items
    .map(
      (item, index) => `
                <Line>
                    <LineNumber>${index + 1}</LineNumber>
                    <ProductCode>${escapeXml(item.code || "N/A")}</ProductCode>
                    <ProductDescription>${escapeXml(
                      item.description || "Item",
                    )}</ProductDescription>
                    <Quantity>${item.quantity || 1}</Quantity>
                    <UnitPrice>${item.unit_price.toFixed(2)}</UnitPrice>
                    <CreditAmount>${item.total.toFixed(2)}</CreditAmount>
                    <Tax>
                        <TaxType>IVA</TaxType>
                        <TaxCountryRegion>PT</TaxCountryRegion>
                        <TaxCode>NOR</TaxCode>
                        <TaxPercentage>23.00</TaxPercentage>
                    </Tax>
                </Line>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01">
    <Header>
        <AuditFileVersion>1.04_01</AuditFileVersion>
        <CompanyID>${escapeXml(
          doc.raw_payload?.restaurant_id?.toString().substring(0, 20) ||
            "RESTAURANTE",
        )}</CompanyID>
        <TaxRegistrationNumber>${escapeXml(
          doc.raw_payload?.tax_registration_number || "999999999",
        )}</TaxRegistrationNumber>
        <TaxAccountingBasis>N</TaxAccountingBasis>
        <CompanyName>${escapeXml(
          doc.raw_payload?.restaurant_name || "Restaurante",
        )}</CompanyName>
        <CompanyAddress>
            <AddressDetail>${escapeXml(
              doc.raw_payload?.address || "N/A",
            )}</AddressDetail>
            <City>${escapeXml(doc.raw_payload?.city || "N/A")}</City>
            <PostalCode>${escapeXml(
              doc.raw_payload?.postal_code || "0000-000",
            )}</PostalCode>
            <Country>PT</Country>
        </CompanyAddress>
        <FiscalYear>${now.getFullYear()}</FiscalYear>
        <StartDate>${dateStr}</StartDate>
        <EndDate>${dateStr}</EndDate>
        <CurrencyCode>EUR</CurrencyCode>
        <DateCreated>${nowIso}</DateCreated>
        <TaxEntity>N/A</TaxEntity>
        <ProductCompanyTaxID>N/A</ProductCompanyTaxID>
        <SoftwareCertificateNumber>0</SoftwareCertificateNumber>
        <ProductID>ChefIApp</ProductID>
        <ProductVersion>1.0</ProductVersion>
    </Header>
    <MasterFiles>
        <TaxTable>
            <TaxTableEntry>
                <TaxType>IVA</TaxType>
                <TaxCountryRegion>PT</TaxCountryRegion>
                <TaxCode>NOR</TaxCode>
                <Description>IVA Normal</Description>
                <TaxPercentage>23.00</TaxPercentage>
            </TaxTableEntry>
        </TaxTable>
    </MasterFiles>
    <SourceDocuments>
        <SalesInvoices>
            <Invoice>
                <InvoiceNo>${escapeXml(
                  doc.ref_event_id?.substring(0, 60) || `INV-${Date.now()}`,
                )}</InvoiceNo>
                <DocumentStatus>
                    <InvoiceStatus>N</InvoiceStatus>
                </DocumentStatus>
                <Hash>${escapeXml(
                  doc.ref_seal_id?.substring(0, 172) || "HASH",
                )}</Hash>
                <HashControl>1</HashControl>
                <Period>${String(now.getMonth() + 1).padStart(2, "0")}</Period>
                <InvoiceDate>${dateStr}</InvoiceDate>
                <InvoiceType>FT</InvoiceType>
                <SourceID>TPV</SourceID>
                <SystemEntryDate>${nowIso}</SystemEntryDate>
                <CustomerID>CLIENTE</CustomerID>
                ${linesXml}
                <DocumentTotals>
                    <TaxPayable>${(doc.taxes.vat || 0).toFixed(2)}</TaxPayable>
                    <NetTotal>${(
                      doc.total_amount - (doc.taxes.vat || 0)
                    ).toFixed(2)}</NetTotal>
                    <GrossTotal>${doc.total_amount.toFixed(2)}</GrossTotal>
                </DocumentTotals>
            </Invoice>
        </SalesInvoices>
    </SourceDocuments>
</AuditFile>`;
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
