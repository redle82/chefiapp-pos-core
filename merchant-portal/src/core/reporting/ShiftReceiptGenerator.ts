/**
 * ShiftReceiptGenerator
 * 
 * Utility to generate HTML receipts for Shift Closure (Fecho de Caixa).
 * Optimized for 80mm/58mm thermal printers.
 */

export interface ShiftReceiptData {
    restaurantName: string;
    terminalId: string;
    operatorName: string;
    openedAt: Date;
    closedAt: Date;
    openingBalanceCents: number;
    closingBalanceCents: number;
    dailySalesCents: number;
    expectedBalanceCents: number;
    differenceCents: number;
    paymentMethods?: Record<string, number>; // method -> cents
    legalFooter?: string;
}

export const generateShiftReceiptHtml = (data: ShiftReceiptData): string => {
    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(cents / 100);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleString('pt-PT', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // calculate duration
    const durationMs = data.closedAt.getTime() - data.openedAt.getTime();
    const durationHrs = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    // Base Styles for Thermal Printing
    const styles = `
        <style>
            @page { margin: 0; size: auto; }
            body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                margin: 0;
                padding: 10px;
                width: 100%;
                max-width: 300px; /* ~80mm paper */
                color: #000;
            }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .bold { font-weight: bold; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
            .center { text-align: center; }
        </style>
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Fecho de Caixa</title>
            ${styles}
        </head>
        <body>
            <div class="header">
                <div class="title">${data.restaurantName}</div>
                <div>FECHO DE CAIXA</div>
            </div>

            <div class="row">
                <span>Terminal:</span>
                <span>${data.terminalId}</span>
            </div>
            <div class="row">
                <span>Operador:</span>
                <span>${data.operatorName}</span>
            </div>
            
            <div class="divider"></div>

            <div class="row">
                <span>Abertura:</span>
                <span>${formatDate(data.openedAt)}</span>
            </div>
            <div class="row">
                <span>Fecho:</span>
                <span>${formatDate(data.closedAt)}</span>
            </div>
            <div class="center" style="margin-bottom: 5px; font-size: 10px;">
                (Duração: ${durationHrs}h ${durationMins}m)
            </div>

            <div class="divider"></div>

            <div class="row">
                <span>Saldo Inicial:</span>
                <span>${formatPrice(data.openingBalanceCents)}</span>
            </div>
            <div class="row bold">
                <span>+ Vendas (Sessão):</span>
                <span>${formatPrice(data.dailySalesCents)}</span>
            </div>
            
            ${data.paymentMethods ? `
                <div style="margin-left: 10px; font-size: 10px; margin-bottom: 5px;">
                    ${Object.entries(data.paymentMethods).map(([method, amount]) => `
                        <div class="row" style="margin-bottom: 2px;">
                            <span>- ${method}:</span>
                            <span>${formatPrice(amount)}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="divider"></div>

            <div class="row">
                <span>Saldo Esperado:</span>
                <span>${formatPrice(data.expectedBalanceCents)}</span>
            </div>
            <div class="row bold" style="font-size: 14px; margin-top: 5px;">
                <span>SALDO FINAL:</span>
                <span>${formatPrice(data.closingBalanceCents)}</span>
            </div>

            <div class="divider"></div>

            <div class="row bold">
                <span>Diferença:</span>
                <span>${data.differenceCents > 0 ? '+' : ''}${formatPrice(data.differenceCents)}</span>
            </div>

            <div class="footer">
                ${data.legalFooter ? `${data.legalFooter}<br>` : ''}
                Emitido em ${formatDate(new Date())}<br>
                Software: ChefIApp POS
            </div>

            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;
};
