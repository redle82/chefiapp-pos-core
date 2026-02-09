/**
 * Fiscal Printer - Driver de Impressão Fiscal
 * 
 * Suporta:
 * - Impressão via browser (window.print) - Fallback universal
 * - Impressoras térmicas (80mm) - Futuro
 * - Templates de recibo fiscal
 */

import type { TaxDocument } from '../../../../fiscal-modules/types';

export interface FiscalPrinterConfig {
    printerType?: 'browser' | 'thermal' | 'fiscal';
    paperWidth?: number; // mm (default: 80mm para térmica)
}

export function buildFiscalReceiptHtml(taxDoc: TaxDocument, orderData: any): string {
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

    const vatRate = taxDoc.doc_type === 'SAF-T' || taxDoc.doc_type === 'MOCK' ? 23 : 21; // Portugal: 23%, Espanha: 21%
    const vatAmount = taxDoc.taxes.vat || 0;
    const subtotal = taxDoc.total_amount - vatAmount;

    const pdfUrl = taxDoc.raw_payload?.pdf_url || taxDoc.raw_payload?.invoice?.pdf?.url;
    const protocol = taxDoc.raw_payload?.gov_protocol;
    const qrCodeUrl = pdfUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pdfUrl)}`
        : protocol
            ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`FISCAL:${protocol}`)}`
            : null;
    const legalFooter = orderData.legal_footer || orderData.legalFooter || "";

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
        .legal-footer {
            margin-top: 8px;
            font-size: 9px;
            white-space: pre-wrap;
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
        ${qrCodeUrl ? `
            <div style="margin-top: 10px; text-align: center;">
                <img src="${qrCodeUrl}" alt="QR Code" style="width: 80px; height: 80px; image-rendering: pixelated;" />
                <div style="font-size: 8px; margin-top: 5px;">
                    ${pdfUrl ? 'Escaneie para ver fatura online' : 'Protocolo Fiscal'}
                </div>
            </div>
        ` : ''}
        ${orderData.restaurant_address ? `
            <div style="font-size: 9px; margin-top: 10px; text-align: center;">
                ${orderData.restaurant_address}
            </div>
        ` : ''}
        ${orderData.restaurant_nif ? `
            <div style="font-size: 9px; margin-top: 5px; text-align: center;">
                NIF: ${orderData.restaurant_nif}
            </div>
        ` : ''}
        ${legalFooter ? `
            <div class="legal-footer">${legalFooter}</div>
        ` : ''}
        <div style="margin-top: 10px;">
            Obrigado pela sua visita!
        </div>
    </div>
</body>
</html>`;
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
     * Imprime pedido para cozinha (Ticket Interno)
     */
    async printKitchenTicket(order: any): Promise<void> {
        // Fallback for browser print
        const receiptHTML = this.generateKitchenTicketHTML(order);

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) throw new Error('Popup blocked');

        printWindow.document.write(receiptHTML);
        printWindow.document.close();

        return new Promise((resolve) => {
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    // printWindow.close(); // Optional
                    resolve();
                }, 250);
            };
        });
    }

    /**
     * Gera HTML do Ticket de Cozinha
     */
    private generateKitchenTicketHTML(order: any): string {
        const now = new Date();
        const isDelivery = !!order.deliveryMetadata;
        const metadata = order.deliveryMetadata || {};

        // Delivery styles
        const deliveryHeader = isDelivery ? `
            <div class="delivery-provider">${metadata.provider.toUpperCase()}</div>
            <div class="delivery-code">#${metadata.orderCode?.slice(-5) || '????'}</div>
            <div class="customer-name">${metadata.customerName || 'Cliente'}</div>
        ` : '';

        // Standard styles
        const standardHeader = !isDelivery ? `
            <div class="title">COZINHA</div>
            <div class="meta">Mesa: ${order.tableNumber || 'BALCÃO'}</div>
            <div class="meta">Senha: #${order.id.slice(-4)}</div>
        ` : '';

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>COZINHA ${isDelivery ? '- DELIVERY' : ''}</title>
    <style>
        body { font-family: 'Courier New'; max-width: 80mm; margin: 0 auto; padding: 5mm; }
        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .title { font-size: 24px; font-weight: bold; }
        .meta { font-size: 16px; margin-top: 5px; font-weight: bold; }
        
        /* Delivery Specifics */
        .delivery-provider { font-size: 32px; font-weight: 900; background: #000; color: #fff; padding: 5px; margin-bottom: 5px; }
        .delivery-code { font-size: 24px; font-weight: bold; margin: 5px 0; border: 2px solid #000; display: inline-block; padding: 2px 8px; }
        .customer-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }

        .item { font-size: 18px; margin-bottom: 12px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
        .qty { font-weight: bold; font-size: 22px; display: inline-block; width: 40px; vertical-align: top; }
        .name { display: inline-block; width: calc(100% - 50px); vertical-align: top; font-weight: bold; }
        .notes { font-size: 16px; margin-top: 4px; font-weight: bold; background: #eee; padding: 4px; display: block; margin-left: 40px; }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; border-top: 1px solid #000; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        ${isDelivery ? deliveryHeader : standardHeader}
        <div class="meta">${now.toLocaleTimeString()}</div>
    </div>
    <div class="items">
        ${order.items.map((item: any) => `
            <div class="item">
                <span class="qty">${item.quantity}</span>
                <span class="name">${item.name}</span>
                ${item.notes ? `<div class="notes">📝 ${item.notes}</div>` : ''}
                ${item.modifiers && item.modifiers.length > 0 ?
                item.modifiers.map((m: any) => `<div class="notes"> + ${m.name || m}</div>`).join('')
                : ''}
            </div>
        `).join('')}
    </div>
    <div class="footer">
        ${order.notes ? `<div style="font-size: 14px; font-weight: bold;">⚠️ ${order.notes}</div>` : ''}
    </div>
</body>
</html>`;
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
        // FASE 6: Melhorar tratamento de erros e compatibilidade
        try {
            // 1. Criar HTML do recibo
            const receiptHTML = this.generateReceiptHTML(taxDoc, orderData);

            // 2. Criar janela de impressão
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
                // FASE 6: Tentar fallback se pop-up foi bloqueado
                const userConfirmed = window.confirm(
                    'Bloqueador de pop-ups detectado. Deseja abrir o recibo em uma nova aba para impressão?'
                );
                if (userConfirmed) {
                    const newWindow = window.open('', '_blank');
                    if (newWindow) {
                        newWindow.document.write(receiptHTML);
                        newWindow.document.close();
                        // Aguardar e imprimir
                        newWindow.onload = () => {
                            setTimeout(() => {
                                newWindow.print();
                            }, 250);
                        };
                        return;
                    }
                }
                throw new Error('Não foi possível abrir janela de impressão. Verifique bloqueador de pop-ups nas configurações do navegador.');
            }

            // 3. Escrever HTML
            printWindow.document.write(receiptHTML);
            printWindow.document.close();

            // 4. Aguardar carregamento e imprimir
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout ao carregar janela de impressão. Tente novamente.'));
                }, 5000); // 5 segundos de timeout

                printWindow.onload = () => {
                    clearTimeout(timeout);
                    setTimeout(() => {
                        try {
                            printWindow.print();
                            // FASE 6: Não fechar automaticamente para permitir visualização
                            // printWindow.close();
                            resolve();
                        } catch (printError: any) {
                            reject(new Error(`Erro ao imprimir: ${printError.message || 'Erro desconhecido'}`));
                        }
                    }, 250);
                };

                // FASE 6: Fallback se onload não disparar
                if (printWindow.document.readyState === 'complete') {
                    clearTimeout(timeout);
                    setTimeout(() => {
                        try {
                            printWindow.print();
                            resolve();
                        } catch (printError: any) {
                            reject(new Error(`Erro ao imprimir: ${printError.message || 'Erro desconhecido'}`));
                        }
                    }, 250);
                }
            });
        } catch (error: any) {
            console.error('[FiscalPrinter] Browser print error:', error);
            throw error instanceof Error ? error : new Error(`Erro ao imprimir: ${error?.message || 'Erro desconhecido'}`);
        }
    }

    /**
     * Gera PDF do recibo (usando html2pdf ou similar)
     * Retorna blob do PDF
     */
    async generatePDF(taxDoc: TaxDocument, orderData: any): Promise<Blob> {
        const receiptHTML = this.generateReceiptHTML(taxDoc, orderData);

        // Usar html2pdf.js ou similar para gerar PDF
        // Por enquanto, retornamos HTML como fallback
        // TODO: Integrar biblioteca de geração de PDF (html2pdf.js, jsPDF, etc.)

        const blob = new Blob([receiptHTML], { type: 'text/html' });
        return blob;
    }

    /**
     * Gera URL de QR Code para o recibo
     * Inclui link para visualizar fatura online (se disponível)
     */
    public generateQRCodeUrl(taxDoc: TaxDocument, orderData: any): string | null {
        // Se tiver PDF URL do InvoiceXpress, usar isso
        const pdfUrl = taxDoc.raw_payload?.pdf_url || taxDoc.raw_payload?.invoice?.pdf?.url;
        if (pdfUrl) {
            // Gerar QR Code usando API pública (ex: qr-server.com)
            return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pdfUrl)}`;
        }

        // Fallback: QR Code com protocolo fiscal
        const protocol = taxDoc.raw_payload?.gov_protocol;
        if (protocol) {
            const qrData = `FISCAL:${protocol}`;
            return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
        }

        return null;
    }

    /**
     * Gera HTML do recibo fiscal (melhorado para 80mm térmico)
     */
    private generateReceiptHTML(taxDoc: TaxDocument, orderData: any): string {
        return buildFiscalReceiptHtml(taxDoc, orderData);
    }

    /**
     * Verifica se impressora está disponível
     */
    async checkPrinterAvailable(): Promise<boolean> {
        // MVP: Browser sempre disponível
        return true;
    }
}
