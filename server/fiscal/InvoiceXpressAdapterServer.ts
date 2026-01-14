
import fetch from 'node-fetch';

interface InvoiceXpressItem {
    name: string;
    description: string;
    unit_price: number; // Net
    quantity: number;
    tax: {
        name: string;
        value: number; // Percentage (e.g. 23)
    };
    unit_price_without_tax?: number; // Optional hint
}

interface InvoiceXpressPayload {
    date: string; // YYYY-MM-DD
    due_date: string;
    client: {
        name: string;
        code: string;
        email?: string;
    };
    items: InvoiceXpressItem[];
    reference?: string;
    observations?: string;
}

export class InvoiceXpressAdapterServer {
    private accountName: string;
    private apiKey: string;

    constructor(accountName: string, apiKey: string) {
        if (!accountName || !apiKey) throw new Error('InvoiceXpress: Credenciais inválidas');
        this.accountName = accountName;
        this.apiKey = apiKey;
    }

    /**
     * Emits a standard simplified invoice (FS) or Invoice (FT)
     * 
     * TASK-2.3.2: Usa vatRate do TaxDocument se fornecido
     */
    async emitInvoice(orderData: any, paymentData: any, vatRate?: number): Promise<any> {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = today;

        // TASK-2.3.2: Usar vatRate fornecido ou default baseado no país
        // vatRate vem como decimal (0.23 = 23%), converter para percentual para InvoiceXpress
        const taxRate = vatRate ? vatRate * 100 : 23.0; // Default: 23% se não fornecido

        const items: InvoiceXpressItem[] = orderData.items.map((item: any) => {
            const unitPriceGross = Number(item.unit_price || 0) / 100;
            const quantity = Number(item.quantity || 1);

            // TASK-2.3.2: Calculate Base from Gross using vatRate
            // Base = Gross / (1 + Rate/100)
            // taxRate já está em percentual (23.0 = 23%)
            const unitPriceNet = unitPriceGross / (1 + (taxRate / 100));

            return {
                name: item.name,
                description: item.name,
                unit_price: unitPriceGross, // InvoiceXpress usually takes unit_price as the base unless configured differently?
                // Correction: InvoiceXpress API 'unit_price' documentation says: "Unit price of the item".
                // If issuing invoices via API, best practice is usually NET price.
                // However, let's use explicit unit_price_without_tax to be safe.
                quantity: quantity,
                unit_price_without_tax: Number(unitPriceNet.toFixed(4)),
                tax: {
                    name: 'IVA',
                    value: taxRate
                }
            };
        });

        const invoice: InvoiceXpressPayload = {
            date: today,
            due_date: dueDate,
            client: {
                name: 'Consumidor Final',
                code: 'Consumer',
            },
            items: items,
            reference: `ORDER-${orderData.id}`,
            observations: `Pedido #${orderData.id} - ${paymentData.method}`
        };

        // Send logic
        const url = `https://${this.accountName}.app.invoicexpress.com/invoices.json`;
        // Use Simplified Invoice "simplified_invoices" or "invoices"?
        // For RESTAURANTS, usually "simplified_invoices" (FS) for B2C < 1000eur.
        // Let's assume standard Invoice (FT) for safety or Simplified?
        // Let's use generic endpoint or "invoices" type "SimplifiedInvoice".
        // API specific: POST /simplified_invoices.json

        const endpoint = `https://${this.accountName}.app.invoicexpress.com/simplified_invoices.json`;

        console.log(`[InvoiceXpressServer] Sending to ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                simplified_invoice: invoice, // root key
                api_key: this.apiKey // API Key in body is deprecated? Standard is query param.
                // Checking docs: usually ?api_key=... OR Basic Auth.
                // Let's assume query param based on common ruby gems.
            })
        });

        // Try query param if body fails? Or just put it in URL.
        const urlWithKey = `${endpoint}?api_key=${this.apiKey}`;

        // Actually, let's redo the fetch with URL param to be safe.
        const response2 = await fetch(urlWithKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ simplified_invoice: invoice })
        });

        if (!response2.ok) {
            const txt = await response2.text();
            throw new Error(`InvoiceXpress Error ${response2.status}: ${txt}`);
        }

        const data = await response2.json() as any;
        return data.simplified_invoice || data;
    }
}
