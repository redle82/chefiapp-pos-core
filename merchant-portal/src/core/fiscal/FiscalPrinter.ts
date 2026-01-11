/**
 * Fiscal Printer - Driver de Impressão Fiscal
 * 
 * Suporta:
 * - Impressão via browser (window.print) - Fallback universal
 * - Impressoras térmicas (80mm) - Futuro
 * - Templates de recibo fiscal
 */

import { TaxDocument } from '../../../fiscal-modules/types';

export interface FiscalPrinterConfig {
    printerType?: 'browser' | 'thermal' | 'fiscal';
    paperWidth?: number; // mm (default: 80mm para térmica)
}

export class FiscalPrinter {
    private config: FiscalPrinterConfig;

    constructor(config: FiscalPrinterConfig = {}) {
        this.config = {
            printerType: config.printerType || 'browser',
            paperWidth: config.paperWidth || 80,
        };
    }

    /**
     * Imprime recibo fiscal
     */
    async printReceipt(taxDoc: TaxDocument, orderData: any): Promise<void> {
        try {
            switch (this.config.printerType) {
                case 'browser':
                    await this.printViaBrowser(taxDoc, orderData);
                    break;
                case 'thermal':
                    // Futuro: Integração com impressoras térmicas
                    console.warn('[FiscalPrinter] Thermal printing not yet implemented, falling back to browser');
                    await this.printViaBrowser(taxDoc, orderData);
                    break;
                case 'fiscal':
                    // Futuro: Integração com impressoras fiscais (Epson, Star, etc.)
                    console.warn('[FiscalPrinter] Fiscal printer not yet implemented, falling back to browser');
                    await this.printViaBrowser(taxDoc, orderData);
                    break;
                default:
                    await this.printViaBrowser(taxDoc, orderData);
            }
        } catch (error) {
            console.error('[FiscalPrinter] Print failed:', error);
            throw error;
        }
    }

    /**
     * Imprime via browser (window.print)
     * Fallback universal que funciona em qualquer dispositivo
     */
    private async printViaBrowser(taxDoc: TaxDocument, orderData: any): Promise<void> {
        // 1. Criar HTML do recibo
        const receiptHTML = this.generateReceiptHTML(taxDoc, orderData);

        // 2. Criar janela de impressão
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
            throw new Error('Não foi possível abrir janela de impressão. Verifique bloqueador de pop-ups.');
        }

        // 3. Escrever HTML
        printWindow.document.write(receiptHTML);
        printWindow.document.close();

        // 4. Aguardar carregamento e imprimir
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                // Fechar janela após impressão (ou deixar aberta para visualização)
                // printWindow.close();
            }, 250);
        };
    }

    /**
     * Gera HTML do recibo fiscal
     */
    private generateReceiptHTML(taxDoc: TaxDocument, orderData: any): string {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        const timeStr = now.toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const vatRate = taxDoc.doc_type === 'SAF-T' ? 23 : 21; // Portugal: 23%, Espanha: 21%
        const vatAmount = taxDoc.taxes.vat || 0;
        const subtotal = taxDoc.total_amount - vatAmount;

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Recibo Fiscal</title>
    <style>
        @media print {
            @page {
                size: 80mm auto;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 10mm;
            }
        }
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            max-width: 70mm;
            margin: 0 auto;
            padding: 10mm;
            color: #000;
        }
        .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }
        .restaurant-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .document-info {
            font-size: 10px;
            margin-top: 5px;
        }
        .items {
            margin: 15px 0;
        }
        .item {
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px dotted #ccc;
        }
        .item-name {
            font-weight: bold;
        }
        .item-details {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
        }
        .totals {
            margin-top: 15px;
            border-top: 1px dashed #000;
            padding-top: 10px;
        }
        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .total-line.final {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            border-top: 1px dashed #000;
            padding-top: 10px;
        }
        .protocol {
            font-weight: bold;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="restaurant-name">${orderData.restaurant_name || 'RESTAURANTE'}</div>
        <div class="document-info">
            ${taxDoc.doc_type === 'TICKETBAI' ? 'TICKETBAI' : taxDoc.doc_type === 'SAF-T' ? 'SAF-T' : 'RECIBO FISCAL'}
        </div>
        <div class="document-info">
            Pedido: ${orderData.short_id || orderData.id?.substring(0, 8) || 'N/A'}
        </div>
        <div class="document-info">
            ${dateStr} ${timeStr}
        </div>
    </div>

    <div class="items">
        ${taxDoc.items.map(item => `
            <div class="item">
                <div class="item-name">${item.description}</div>
                <div class="item-details">
                    ${item.quantity}x ${item.unit_price.toFixed(2)}€ = ${item.total.toFixed(2)}€
                </div>
            </div>
        `).join('')}
    </div>

    <div class="totals">
        <div class="total-line">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}€</span>
        </div>
        <div class="total-line">
            <span>IVA (${vatRate}%):</span>
            <span>${vatAmount.toFixed(2)}€</span>
        </div>
        <div class="total-line final">
            <span>TOTAL:</span>
            <span>${taxDoc.total_amount.toFixed(2)}€</span>
        </div>
    </div>

    <div class="footer">
        <div>Método de Pagamento: ${orderData.payment_method || 'N/A'}</div>
        ${taxDoc.raw_payload?.gov_protocol ? `
            <div class="protocol">
                Protocolo: ${taxDoc.raw_payload.gov_protocol}
            </div>
        ` : ''}
        <div style="margin-top: 10px;">
            Obrigado pela sua visita!
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Verifica se impressora está disponível
     */
    async checkPrinterAvailable(): Promise<boolean> {
        // MVP: Browser sempre disponível
        return true;
    }
}
