/**
 * SaftPTGenerator — Gerador de ficheiros SAF-T PT v1.04_01.
 *
 * Gera XML em conformidade com a Portaria 302/2016 (SAF-T PT versão 1.04_01).
 *
 * Responsabilidades:
 *   1. Construir o SaftDocument a partir de dados do POS.
 *   2. Serializar para XML válido contra o esquema AT.
 *   3. Validar o documento antes da exportação.
 *
 * Não faz:
 *   - Assinatura digital (ver HashChain.ts)
 *   - Numeração (ver DocumentNumbering.ts)
 *   - Cálculo de impostos (ver TaxCalculator.ts)
 *   - Comunicação com a AT (ver ATIntegrationService.ts)
 */

import type {
  FiscalAddress,
  FiscalConfig,
  FiscalDocument,
  FiscalDocumentLine,
  ValidationError,
  ValidationResult,
} from '../types';
import type { TaxBreakdown, SaftTaxTableEntry } from '../tax/TaxCalculator';

// ---------------------------------------------------------------------------
// SAF-T PT types (v1.04_01)
// ---------------------------------------------------------------------------

export interface SaftAddress {
  streetName: string;
  buildingNumber?: string;
  city: string;
  postalCode: string;
  region?: string;
  country: string;
}

export interface SaftHeader {
  auditFileVersion: '1.04_01';
  companyID: string; // NIF
  taxRegistrationNumber: string;
  taxAccountingBasis: 'F'; // F = Faturação
  companyName: string;
  companyAddress: SaftAddress;
  fiscalYear: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  currencyCode: 'EUR';
  dateCreated: string;
  taxEntity: string; // 'Global' ou sede
  productCompanyTaxID: string; // NIF do produtor do software (ChefIApp)
  softwareCertificateNumber: string;
  productID: string; // 'ChefIApp POS'
  productVersion: string;
  headerComment?: string;
}

export interface SaftCustomer {
  customerID: string;
  accountID: string;
  customerTaxID: string;
  companyName: string;
  billingAddress: SaftAddress;
  selfBillingIndicator: 0;
}

export interface SaftProduct {
  productType: 'P' | 'S' | 'O' | 'E' | 'I';
  productCode: string;
  productDescription: string;
  productNumberCode: string;
}

export interface SaftTaxEntry {
  taxType: 'IVA';
  taxCountryRegion: string;
  taxCode: string;
  taxPercentage: number;
  description?: string;
}

export interface SaftInvoiceLine {
  lineNumber: number;
  productCode: string;
  productDescription: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  taxPointDate: string;
  description: string;
  creditAmount?: number;
  debitAmount?: number;
  tax: SaftTaxEntry;
  taxExemptionReason?: string;
  taxExemptionCode?: string;
  settlementAmount?: number;
}

export interface SaftDocumentTotals {
  taxPayable: number;
  netTotal: number;
  grossTotal: number;
}

export interface SaftInvoice {
  invoiceNo: string;
  atcud: string;
  documentStatus: {
    invoiceStatus: 'N' | 'A' | 'F' | 'S';
    invoiceStatusDate: string;
    sourceID: string;
    sourceBilling: 'P';
  };
  hash: string;
  hashControl: string;
  period: number; // mês (1-12)
  invoiceDate: string;
  invoiceType: 'FT' | 'FR' | 'NC' | 'FS';
  specialRegimes: {
    selfBillingIndicator: 0;
    cashVATSchemeIndicator: 0;
    thirdPartiesBillingIndicator: 0;
  };
  sourceID: string;
  systemEntryDate: string;
  customerID: string;
  line: SaftInvoiceLine[];
  documentTotals: SaftDocumentTotals;
}

export interface SaftPayment {
  paymentRefNo: string;
  atcud: string;
  period: number;
  transactionDate: string;
  paymentType: 'RC' | 'RG';
  systemID?: string;
  documentStatus: {
    paymentStatus: 'N' | 'A';
    paymentStatusDate: string;
    sourceID: string;
    sourceBilling: 'P';
  };
  paymentMethod: Array<{
    paymentMechanism: string;
    paymentAmount: number;
    paymentDate: string;
  }>;
  sourceID: string;
  systemEntryDate: string;
  customerID: string;
  line: Array<{
    lineNumber: number;
    sourceDocumentID: Array<{
      originatingON: string;
      invoiceDate: string;
    }>;
    creditAmount?: number;
    debitAmount?: number;
  }>;
  documentTotals: SaftDocumentTotals;
}

export interface SaftMasterFiles {
  customer: SaftCustomer[];
  product: SaftProduct[];
  taxTable: SaftTaxTableEntry[];
}

export interface SaftSourceDocuments {
  salesInvoices: {
    numberOfEntries: number;
    totalDebit: number;
    totalCredit: number;
    invoice: SaftInvoice[];
  };
  payments?: {
    numberOfEntries: number;
    totalDebit: number;
    totalCredit: number;
    payment: SaftPayment[];
  };
}

export interface SaftDocument {
  header: SaftHeader;
  masterFiles: SaftMasterFiles;
  sourceDocuments: SaftSourceDocuments;
}

// ---------------------------------------------------------------------------
// Dados de entrada
// ---------------------------------------------------------------------------

export interface SaftExportData {
  config: FiscalConfig;
  documents: FiscalDocument[];
  taxBreakdowns: Map<string, TaxBreakdown[]>; // documentNumber -> breakdowns
  period: { from: string; to: string };
  productVersion?: string;
}

// ---------------------------------------------------------------------------
// Constantes ChefIApp
// ---------------------------------------------------------------------------

const CHEFIAPP_PRODUCT_ID = 'ChefIApp POS/ChefIApp';
const CHEFIAPP_COMPANY_TAX_ID = '999999999'; // Substituir pelo NIF real da empresa
const CHEFIAPP_CERT_NUMBER = '0000'; // Substituir pelo número de certificação AT real
const CHEFIAPP_VERSION = '1.0.0';

const CONSUMER_FINAL_TAX_ID = '999999990';

// ---------------------------------------------------------------------------
// Utilitários XML
// ---------------------------------------------------------------------------

/** Escapa caracteres especiais para XML */
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Formata número com 2 casas decimais para XML SAF-T */
function fmtMoney(value: number): string {
  return value.toFixed(2);
}

/** Extrai mês de uma data YYYY-MM-DD */
function extractMonth(dateStr: string): number {
  const parts = dateStr.split('-');
  return parseInt(parts[1], 10);
}

/** Extrai ano de uma data YYYY-MM-DD */
function extractYear(dateStr: string): number {
  const parts = dateStr.split('-');
  return parseInt(parts[0], 10);
}

/** Data atual em YYYY-MM-DD */
function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// SaftPTGenerator
// ---------------------------------------------------------------------------

export class SaftPTGenerator {
  /**
   * Gera o SaftDocument completo a partir dos dados de exportação.
   */
  generateDocument(data: SaftExportData): SaftDocument {
    const header = this.buildHeader(data);
    const masterFiles = this.buildMasterFiles(data);
    const sourceDocuments = this.buildSourceDocuments(data);

    return { header, masterFiles, sourceDocuments };
  }

  /**
   * Serializa o SaftDocument para XML v1.04_01.
   */
  toXML(doc: SaftDocument): string {
    const lines: string[] = [];

    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(
      '<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    );

    // Header
    lines.push(this.headerToXml(doc.header));

    // MasterFiles
    lines.push(this.masterFilesToXml(doc.masterFiles));

    // SourceDocuments
    lines.push(this.sourceDocumentsToXml(doc.sourceDocuments));

    lines.push('</AuditFile>');

    return lines.join('\n');
  }

  /**
   * Valida um SaftDocument antes da exportação.
   */
  validate(doc: SaftDocument): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Header
    if (!doc.header.taxRegistrationNumber || doc.header.taxRegistrationNumber.length !== 9) {
      errors.push({
        field: 'header.taxRegistrationNumber',
        message: 'NIF deve ter 9 dígitos',
        code: 'INVALID_NIF',
      });
    }

    if (!doc.header.companyName) {
      errors.push({
        field: 'header.companyName',
        message: 'Nome da empresa é obrigatório',
        code: 'MISSING_COMPANY_NAME',
      });
    }

    if (doc.header.auditFileVersion !== '1.04_01') {
      errors.push({
        field: 'header.auditFileVersion',
        message: 'Versão do ficheiro deve ser 1.04_01',
        code: 'INVALID_VERSION',
      });
    }

    // Certificação do software
    if (
      !doc.header.softwareCertificateNumber ||
      doc.header.softwareCertificateNumber === '0000'
    ) {
      warnings.push({
        field: 'header.softwareCertificateNumber',
        message: 'Número de certificação AT não configurado (usando placeholder)',
        code: 'MISSING_CERT_NUMBER',
      });
    }

    // Documentos
    const invoices = doc.sourceDocuments.salesInvoices.invoice;
    if (invoices.length === 0) {
      warnings.push({
        field: 'sourceDocuments.salesInvoices',
        message: 'Nenhum documento fiscal no período',
        code: 'NO_DOCUMENTS',
      });
    }

    // Verificar hashes
    for (const inv of invoices) {
      if (!inv.hash) {
        errors.push({
          field: `invoice.${inv.invoiceNo}.hash`,
          message: `Documento ${inv.invoiceNo} sem assinatura digital`,
          code: 'MISSING_HASH',
        });
      }

      if (inv.documentTotals.grossTotal < 0) {
        errors.push({
          field: `invoice.${inv.invoiceNo}.grossTotal`,
          message: `Documento ${inv.invoiceNo} com total bruto negativo`,
          code: 'NEGATIVE_GROSS_TOTAL',
        });
      }

      // Verificar linhas
      if (!inv.line || inv.line.length === 0) {
        errors.push({
          field: `invoice.${inv.invoiceNo}.line`,
          message: `Documento ${inv.invoiceNo} sem linhas`,
          code: 'NO_LINES',
        });
      }
    }

    // Verificar totais de débito/crédito
    const { totalDebit, totalCredit } = doc.sourceDocuments.salesInvoices;
    let calculatedDebit = 0;
    let calculatedCredit = 0;
    for (const inv of invoices) {
      if (inv.invoiceType === 'NC') {
        calculatedDebit += inv.documentTotals.grossTotal;
      } else {
        calculatedCredit += inv.documentTotals.grossTotal;
      }
    }

    const debitDiff = Math.abs(totalDebit - calculatedDebit);
    const creditDiff = Math.abs(totalCredit - calculatedCredit);

    if (debitDiff > 0.01) {
      errors.push({
        field: 'sourceDocuments.salesInvoices.totalDebit',
        message: `Total de débito inconsistente: declarado ${fmtMoney(totalDebit)}, calculado ${fmtMoney(calculatedDebit)}`,
        code: 'DEBIT_MISMATCH',
      });
    }

    if (creditDiff > 0.01) {
      errors.push({
        field: 'sourceDocuments.salesInvoices.totalCredit',
        message: `Total de crédito inconsistente: declarado ${fmtMoney(totalCredit)}, calculado ${fmtMoney(calculatedCredit)}`,
        code: 'CREDIT_MISMATCH',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // -----------------------------------------------------------------------
  // Construtores internos
  // -----------------------------------------------------------------------

  private buildHeader(data: SaftExportData): SaftHeader {
    const { config, period } = data;
    const fiscalYear = extractYear(period.from);

    return {
      auditFileVersion: '1.04_01',
      companyID: config.taxId,
      taxRegistrationNumber: config.taxId,
      taxAccountingBasis: 'F',
      companyName: config.companyName,
      companyAddress: {
        streetName: config.address.streetName,
        buildingNumber: config.address.buildingNumber,
        city: config.address.city,
        postalCode: config.address.postalCode,
        region: config.address.region,
        country: config.address.country,
      },
      fiscalYear,
      startDate: period.from,
      endDate: period.to,
      currencyCode: 'EUR',
      dateCreated: todayISO(),
      taxEntity: 'Global',
      productCompanyTaxID: CHEFIAPP_COMPANY_TAX_ID,
      softwareCertificateNumber:
        config.softwareCertNumber ?? CHEFIAPP_CERT_NUMBER,
      productID: CHEFIAPP_PRODUCT_ID,
      productVersion: data.productVersion ?? CHEFIAPP_VERSION,
    };
  }

  private buildMasterFiles(data: SaftExportData): SaftMasterFiles {
    // Clientes — recolher NIFs únicos dos documentos
    const customerMap = new Map<string, SaftCustomer>();
    for (const doc of data.documents) {
      const taxId = doc.customerTaxId || CONSUMER_FINAL_TAX_ID;
      if (!customerMap.has(taxId)) {
        customerMap.set(taxId, {
          customerID: taxId,
          accountID: 'Desconhecido',
          customerTaxID: taxId,
          companyName:
            taxId === CONSUMER_FINAL_TAX_ID
              ? 'Consumidor Final'
              : `Cliente ${taxId}`,
          billingAddress: {
            streetName: 'Desconhecido',
            city: 'Desconhecido',
            postalCode: '0000-000',
            country: 'PT',
          },
          selfBillingIndicator: 0,
        });
      }
    }

    // Produtos — recolher códigos únicos
    const productMap = new Map<string, SaftProduct>();
    for (const doc of data.documents) {
      for (const line of doc.lines) {
        if (!productMap.has(line.productCode)) {
          productMap.set(line.productCode, {
            productType: 'P',
            productCode: line.productCode,
            productDescription: line.productDescription,
            productNumberCode: line.productCode,
          });
        }
      }
    }

    // Tabela de impostos — recolher taxas únicas
    const taxSet = new Set<string>();
    const taxEntries: SaftTaxTableEntry[] = [];
    for (const breakdowns of data.taxBreakdowns.values()) {
      for (const b of breakdowns) {
        const key = `${b.rateCode}-${b.rate}`;
        if (!taxSet.has(key)) {
          taxSet.add(key);
          const regionCode =
            data.config.region === 'AZ'
              ? 'PT-AC'
              : data.config.region === 'MA'
                ? 'PT-MA'
                : 'PT';
          taxEntries.push({
            taxType: 'IVA',
            taxCountryRegion: regionCode,
            taxCode: b.rateCode,
            description: this.taxCodeDescription(b.rateCode),
            taxPercentage: parseFloat((b.rate * 100).toFixed(2)),
          });
        }
      }
    }

    return {
      customer: Array.from(customerMap.values()),
      product: Array.from(productMap.values()),
      taxTable: taxEntries,
    };
  }

  private buildSourceDocuments(data: SaftExportData): SaftSourceDocuments {
    let totalDebit = 0;
    let totalCredit = 0;

    const invoices: SaftInvoice[] = data.documents.map((doc) => {
      const month = extractMonth(doc.invoiceDate);

      // Linhas do documento
      const saftLines: SaftInvoiceLine[] = doc.lines.map((line) => {
        const regionCode =
          data.config.region === 'AZ'
            ? 'PT-AC'
            : data.config.region === 'MA'
              ? 'PT-MA'
              : 'PT';

        const saftLine: SaftInvoiceLine = {
          lineNumber: line.lineNumber,
          productCode: line.productCode,
          productDescription: line.productDescription,
          quantity: line.quantity,
          unitOfMeasure: line.unitOfMeasure || 'UN',
          unitPrice: parseFloat(line.unitPrice.toFixed(2)),
          taxPointDate: doc.invoiceDate,
          description: line.productDescription,
          tax: {
            taxType: 'IVA',
            taxCountryRegion: regionCode,
            taxCode: line.taxRateCode,
            taxPercentage: parseFloat((line.taxRate * 100).toFixed(2)),
          },
        };

        // Nota de crédito usa creditAmount, faturas usam debitAmount
        // NOTA: na estrutura SAF-T, faturas (vendas) são creditAmount
        // e notas de crédito são debitAmount (perspetiva do IVA)
        if (doc.documentType === 'NC') {
          saftLine.debitAmount = parseFloat(
            (line.unitPrice * line.quantity).toFixed(2),
          );
        } else {
          saftLine.creditAmount = parseFloat(
            (line.unitPrice * line.quantity).toFixed(2),
          );
        }

        if (line.taxExemptionReason) {
          saftLine.taxExemptionReason = line.taxExemptionReason;
          saftLine.taxExemptionCode = line.taxExemptionCode;
        }

        return saftLine;
      });

      // Totais
      if (doc.documentType === 'NC') {
        totalDebit += doc.grossTotal;
      } else {
        totalCredit += doc.grossTotal;
      }

      const invoice: SaftInvoice = {
        invoiceNo: doc.documentNumber,
        atcud: doc.atcud,
        documentStatus: {
          invoiceStatus: doc.status === 'CANCELLED' ? 'A' : 'N',
          invoiceStatusDate: doc.systemEntryDate,
          sourceID: 'ChefIApp',
          sourceBilling: 'P',
        },
        hash: doc.hash,
        hashControl: doc.hashControl,
        period: month,
        invoiceDate: doc.invoiceDate,
        invoiceType: doc.documentType,
        specialRegimes: {
          selfBillingIndicator: 0,
          cashVATSchemeIndicator: 0,
          thirdPartiesBillingIndicator: 0,
        },
        sourceID: 'ChefIApp',
        systemEntryDate: doc.systemEntryDate,
        customerID: doc.customerTaxId || CONSUMER_FINAL_TAX_ID,
        line: saftLines,
        documentTotals: {
          taxPayable: parseFloat(doc.taxPayable.toFixed(2)),
          netTotal: parseFloat(doc.netTotal.toFixed(2)),
          grossTotal: parseFloat(doc.grossTotal.toFixed(2)),
        },
      };

      return invoice;
    });

    return {
      salesInvoices: {
        numberOfEntries: invoices.length,
        totalDebit: parseFloat(totalDebit.toFixed(2)),
        totalCredit: parseFloat(totalCredit.toFixed(2)),
        invoice: invoices,
      },
    };
  }

  // -----------------------------------------------------------------------
  // XML Serializers
  // -----------------------------------------------------------------------

  private headerToXml(h: SaftHeader): string {
    const addr = h.companyAddress;
    return `  <Header>
    <AuditFileVersion>${h.auditFileVersion}</AuditFileVersion>
    <CompanyID>${xmlEscape(h.companyID)}</CompanyID>
    <TaxRegistrationNumber>${h.taxRegistrationNumber}</TaxRegistrationNumber>
    <TaxAccountingBasis>${h.taxAccountingBasis}</TaxAccountingBasis>
    <CompanyName>${xmlEscape(h.companyName)}</CompanyName>
    <CompanyAddress>
      <StreetName>${xmlEscape(addr.streetName)}</StreetName>${addr.buildingNumber ? `\n      <BuildingNumber>${xmlEscape(addr.buildingNumber)}</BuildingNumber>` : ''}
      <City>${xmlEscape(addr.city)}</City>
      <PostalCode>${addr.postalCode}</PostalCode>${addr.region ? `\n      <Region>${xmlEscape(addr.region)}</Region>` : ''}
      <Country>${addr.country}</Country>
    </CompanyAddress>
    <FiscalYear>${h.fiscalYear}</FiscalYear>
    <StartDate>${h.startDate}</StartDate>
    <EndDate>${h.endDate}</EndDate>
    <CurrencyCode>${h.currencyCode}</CurrencyCode>
    <DateCreated>${h.dateCreated}</DateCreated>
    <TaxEntity>${xmlEscape(h.taxEntity)}</TaxEntity>
    <ProductCompanyTaxID>${h.productCompanyTaxID}</ProductCompanyTaxID>
    <SoftwareCertificateNumber>${h.softwareCertificateNumber}</SoftwareCertificateNumber>
    <ProductID>${xmlEscape(h.productID)}</ProductID>
    <ProductVersion>${h.productVersion}</ProductVersion>${h.headerComment ? `\n    <HeaderComment>${xmlEscape(h.headerComment)}</HeaderComment>` : ''}
  </Header>`;
  }

  private masterFilesToXml(mf: SaftMasterFiles): string {
    const lines: string[] = [];
    lines.push('  <MasterFiles>');

    // Customers
    for (const c of mf.customer) {
      lines.push(`    <Customer>
      <CustomerID>${xmlEscape(c.customerID)}</CustomerID>
      <AccountID>${xmlEscape(c.accountID)}</AccountID>
      <CustomerTaxID>${c.customerTaxID}</CustomerTaxID>
      <CompanyName>${xmlEscape(c.companyName)}</CompanyName>
      <BillingAddress>
        <StreetName>${xmlEscape(c.billingAddress.streetName)}</StreetName>
        <City>${xmlEscape(c.billingAddress.city)}</City>
        <PostalCode>${c.billingAddress.postalCode}</PostalCode>
        <Country>${c.billingAddress.country}</Country>
      </BillingAddress>
      <SelfBillingIndicator>${c.selfBillingIndicator}</SelfBillingIndicator>
    </Customer>`);
    }

    // Products
    for (const p of mf.product) {
      lines.push(`    <Product>
      <ProductType>${p.productType}</ProductType>
      <ProductCode>${xmlEscape(p.productCode)}</ProductCode>
      <ProductDescription>${xmlEscape(p.productDescription)}</ProductDescription>
      <ProductNumberCode>${xmlEscape(p.productNumberCode)}</ProductNumberCode>
    </Product>`);
    }

    // TaxTable
    lines.push('    <TaxTable>');
    for (const t of mf.taxTable) {
      lines.push(`      <TaxTableEntry>
        <TaxType>${t.taxType}</TaxType>
        <TaxCountryRegion>${t.taxCountryRegion}</TaxCountryRegion>
        <TaxCode>${t.taxCode}</TaxCode>
        <Description>${xmlEscape(t.description)}</Description>
        <TaxPercentage>${fmtMoney(t.taxPercentage)}</TaxPercentage>
      </TaxTableEntry>`);
    }
    lines.push('    </TaxTable>');

    lines.push('  </MasterFiles>');
    return lines.join('\n');
  }

  private sourceDocumentsToXml(sd: SaftSourceDocuments): string {
    const lines: string[] = [];
    lines.push('  <SourceDocuments>');

    // SalesInvoices
    const si = sd.salesInvoices;
    lines.push(`    <SalesInvoices>
      <NumberOfEntries>${si.numberOfEntries}</NumberOfEntries>
      <TotalDebit>${fmtMoney(si.totalDebit)}</TotalDebit>
      <TotalCredit>${fmtMoney(si.totalCredit)}</TotalCredit>`);

    for (const inv of si.invoice) {
      lines.push(this.invoiceToXml(inv));
    }

    lines.push('    </SalesInvoices>');

    // Payments (opcional)
    if (sd.payments) {
      const p = sd.payments;
      lines.push(`    <Payments>
      <NumberOfEntries>${p.numberOfEntries}</NumberOfEntries>
      <TotalDebit>${fmtMoney(p.totalDebit)}</TotalDebit>
      <TotalCredit>${fmtMoney(p.totalCredit)}</TotalCredit>`);

      for (const pay of p.payment) {
        lines.push(this.paymentToXml(pay));
      }

      lines.push('    </Payments>');
    }

    lines.push('  </SourceDocuments>');
    return lines.join('\n');
  }

  private invoiceToXml(inv: SaftInvoice): string {
    const lines: string[] = [];
    const ds = inv.documentStatus;
    const sr = inv.specialRegimes;

    lines.push(`      <Invoice>
        <InvoiceNo>${xmlEscape(inv.invoiceNo)}</InvoiceNo>
        <ATCUD>${xmlEscape(inv.atcud)}</ATCUD>
        <DocumentStatus>
          <InvoiceStatus>${ds.invoiceStatus}</InvoiceStatus>
          <InvoiceStatusDate>${ds.invoiceStatusDate}</InvoiceStatusDate>
          <SourceID>${xmlEscape(ds.sourceID)}</SourceID>
          <SourceBilling>${ds.sourceBilling}</SourceBilling>
        </DocumentStatus>
        <Hash>${xmlEscape(inv.hash)}</Hash>
        <HashControl>${xmlEscape(inv.hashControl)}</HashControl>
        <Period>${inv.period}</Period>
        <InvoiceDate>${inv.invoiceDate}</InvoiceDate>
        <InvoiceType>${inv.invoiceType}</InvoiceType>
        <SpecialRegimes>
          <SelfBillingIndicator>${sr.selfBillingIndicator}</SelfBillingIndicator>
          <CashVATSchemeIndicator>${sr.cashVATSchemeIndicator}</CashVATSchemeIndicator>
          <ThirdPartiesBillingIndicator>${sr.thirdPartiesBillingIndicator}</ThirdPartiesBillingIndicator>
        </SpecialRegimes>
        <SourceID>${xmlEscape(inv.sourceID)}</SourceID>
        <SystemEntryDate>${inv.systemEntryDate}</SystemEntryDate>
        <CustomerID>${xmlEscape(inv.customerID)}</CustomerID>`);

    // Lines
    for (const line of inv.line) {
      lines.push(this.invoiceLineToXml(line));
    }

    // Document totals
    const dt = inv.documentTotals;
    lines.push(`        <DocumentTotals>
          <TaxPayable>${fmtMoney(dt.taxPayable)}</TaxPayable>
          <NetTotal>${fmtMoney(dt.netTotal)}</NetTotal>
          <GrossTotal>${fmtMoney(dt.grossTotal)}</GrossTotal>
        </DocumentTotals>`);

    lines.push('      </Invoice>');
    return lines.join('\n');
  }

  private invoiceLineToXml(line: SaftInvoiceLine): string {
    const parts: string[] = [];

    parts.push(`        <Line>
          <LineNumber>${line.lineNumber}</LineNumber>
          <ProductCode>${xmlEscape(line.productCode)}</ProductCode>
          <ProductDescription>${xmlEscape(line.productDescription)}</ProductDescription>
          <Quantity>${line.quantity}</Quantity>
          <UnitOfMeasure>${xmlEscape(line.unitOfMeasure)}</UnitOfMeasure>
          <UnitPrice>${fmtMoney(line.unitPrice)}</UnitPrice>
          <TaxPointDate>${line.taxPointDate}</TaxPointDate>
          <Description>${xmlEscape(line.description)}</Description>`);

    if (line.debitAmount !== undefined) {
      parts.push(`          <DebitAmount>${fmtMoney(line.debitAmount)}</DebitAmount>`);
    }
    if (line.creditAmount !== undefined) {
      parts.push(`          <CreditAmount>${fmtMoney(line.creditAmount)}</CreditAmount>`);
    }

    parts.push(`          <Tax>
            <TaxType>${line.tax.taxType}</TaxType>
            <TaxCountryRegion>${line.tax.taxCountryRegion}</TaxCountryRegion>
            <TaxCode>${line.tax.taxCode}</TaxCode>
            <TaxPercentage>${fmtMoney(line.tax.taxPercentage)}</TaxPercentage>
          </Tax>`);

    if (line.taxExemptionReason) {
      parts.push(
        `          <TaxExemptionReason>${xmlEscape(line.taxExemptionReason)}</TaxExemptionReason>`,
      );
    }
    if (line.taxExemptionCode) {
      parts.push(
        `          <TaxExemptionCode>${xmlEscape(line.taxExemptionCode)}</TaxExemptionCode>`,
      );
    }

    parts.push('        </Line>');
    return parts.join('\n');
  }

  private paymentToXml(pay: SaftPayment): string {
    const ds = pay.documentStatus;
    const parts: string[] = [];

    parts.push(`      <Payment>
        <PaymentRefNo>${xmlEscape(pay.paymentRefNo)}</PaymentRefNo>
        <ATCUD>${xmlEscape(pay.atcud)}</ATCUD>
        <Period>${pay.period}</Period>
        <TransactionDate>${pay.transactionDate}</TransactionDate>
        <PaymentType>${pay.paymentType}</PaymentType>
        <DocumentStatus>
          <PaymentStatus>${ds.paymentStatus}</PaymentStatus>
          <PaymentStatusDate>${ds.paymentStatusDate}</PaymentStatusDate>
          <SourceID>${xmlEscape(ds.sourceID)}</SourceID>
          <SourceBilling>${ds.sourceBilling}</SourceBilling>
        </DocumentStatus>`);

    for (const pm of pay.paymentMethod) {
      parts.push(`        <PaymentMethod>
          <PaymentMechanism>${pm.paymentMechanism}</PaymentMechanism>
          <PaymentAmount>${fmtMoney(pm.paymentAmount)}</PaymentAmount>
          <PaymentDate>${pm.paymentDate}</PaymentDate>
        </PaymentMethod>`);
    }

    parts.push(`        <SourceID>${xmlEscape(pay.sourceID)}</SourceID>
        <SystemEntryDate>${pay.systemEntryDate}</SystemEntryDate>
        <CustomerID>${xmlEscape(pay.customerID)}</CustomerID>`);

    for (const line of pay.line) {
      parts.push(`        <Line>
          <LineNumber>${line.lineNumber}</LineNumber>`);
      for (const src of line.sourceDocumentID) {
        parts.push(`          <SourceDocumentID>
            <OriginatingON>${xmlEscape(src.originatingON)}</OriginatingON>
            <InvoiceDate>${src.invoiceDate}</InvoiceDate>
          </SourceDocumentID>`);
      }
      if (line.creditAmount !== undefined) {
        parts.push(`          <CreditAmount>${fmtMoney(line.creditAmount)}</CreditAmount>`);
      }
      if (line.debitAmount !== undefined) {
        parts.push(`          <DebitAmount>${fmtMoney(line.debitAmount)}</DebitAmount>`);
      }
      parts.push('        </Line>');
    }

    const dt = pay.documentTotals;
    parts.push(`        <DocumentTotals>
          <TaxPayable>${fmtMoney(dt.taxPayable)}</TaxPayable>
          <NetTotal>${fmtMoney(dt.netTotal)}</NetTotal>
          <GrossTotal>${fmtMoney(dt.grossTotal)}</GrossTotal>
        </DocumentTotals>
      </Payment>`);

    return parts.join('\n');
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private taxCodeDescription(code: string): string {
    const descriptions: Record<string, string> = {
      NOR: 'Taxa Normal',
      INT: 'Taxa Intermédia',
      RED: 'Taxa Reduzida',
      ISE: 'Isento',
    };
    return descriptions[code] ?? code;
  }
}
