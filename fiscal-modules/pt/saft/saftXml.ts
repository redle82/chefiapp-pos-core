import type { TaxDocument } from "../../types";

const escapeXml = (value: string): string => {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export const generateSaftXml = (doc: TaxDocument): string => {
  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = nowIso.split("T")[0];
  const issuedAt = doc.raw_payload?.issued_at || nowIso;

  const invoiceNumber =
    doc.raw_payload?.invoice_number || doc.ref_event_id || `INV-${Date.now()}`;
  const atcud = doc.raw_payload?.atcud;
  const hashChain =
    doc.raw_payload?.hash_chain ||
    doc.raw_payload?.seal_hash ||
    doc.ref_seal_id;

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
                <InvoiceNo>${escapeXml(invoiceNumber)}</InvoiceNo>
                <DocumentStatus>
                    <InvoiceStatus>N</InvoiceStatus>
                </DocumentStatus>
                <Hash>${escapeXml(hashChain || "HASH")}</Hash>
                <HashControl>1</HashControl>
                <Period>${String(now.getMonth() + 1).padStart(2, "0")}</Period>
                <InvoiceDate>${dateStr}</InvoiceDate>
                <InvoiceType>FT</InvoiceType>
                <SourceID>TPV</SourceID>
                <SystemEntryDate>${issuedAt}</SystemEntryDate>
                <CustomerID>CLIENTE</CustomerID>
                ${atcud ? `<ATCUD>${escapeXml(atcud)}</ATCUD>` : ""}
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
