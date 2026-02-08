import { FiscalObserver } from '../FiscalObserver';
import { FiscalResult, TaxDocument } from '../types';
import type { LegalSeal } from '../../legal-boundary/types';
import type { CoreEvent } from '../../event-log/types';

interface InvoiceXpressConfig {
    apiKey?: string; // P0-1 FIX: Opcional - backend busca do banco
    accountName: string; // Obrigatório - usado para identificar restaurante
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 segundo
const MAX_DELAY_MS = 10000; // 10 segundos
const REQUEST_TIMEOUT_MS = 15000; // 15 segundos

export class InvoiceXpressAdapter implements FiscalObserver {
    private config: InvoiceXpressConfig | null = null;

    constructor(config?: InvoiceXpressConfig) {
        if (config) {
            this.config = config;
        }
    }

    /**
     * Calcula delay com backoff exponencial
     */
    private calculateDelay(attempt: number): number {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        return Math.min(delay, MAX_DELAY_MS);
    }

    /**
     * Called when a payment is sealed.
     * Generates a request to InvoiceXpress API.
     */
    async onSealed(seal: LegalSeal, event: CoreEvent): Promise<FiscalResult> {
        console.log('[InvoiceXpressAdapter] Processing event', event.event_id);

        // Dry run: sem credenciais → retorno mock (não chama API)
        if (!this.config || !this.config.accountName) {
            return {
                status: 'REPORTED',
                gov_protocol: `INV-MOCK-${event.event_id}`,
                reported_at: new Date(),
            };
        }

        // Extract TaxDocument from event payload (injected by FiscalService)
        const taxDoc = (event.payload as any)?.tax_document as TaxDocument | undefined;
        
        if (!taxDoc) {
            console.warn('[InvoiceXpressAdapter] No tax_document in event payload. Using fallback.');
            // Fallback: create minimal taxDoc from event
            const totalAmount = ((event.payload as any)?.amount_cents || 0) / 100;
            const fallbackVatRate = 0.23; // Default: 23% (Portugal)
            const fallbackVatAmount = totalAmount * fallbackVatRate / (1 + fallbackVatRate);
            const fallbackVatAmountCents = Math.round(fallbackVatAmount * 100);
            
            const fallbackDoc: TaxDocument = {
                doc_type: 'MOCK',
                ref_event_id: event.event_id,
                ref_seal_id: seal.seal_id,
                total_amount: totalAmount,
                taxes: { vat: fallbackVatAmount },
                // TASK-2.3.1: Separar vatRate de vatAmount
                vatRate: fallbackVatRate,
                vatAmount: fallbackVatAmountCents,
                items: [{
                    code: 'ITEM-001',
                    description: 'Refeição',
                    quantity: 1,
                    unit_price: totalAmount,
                    total: totalAmount,
                }],
            };
            return this.processWithTaxDoc(fallbackDoc, event);
        }

        return this.processWithTaxDoc(taxDoc, event);
    }

    private async processWithTaxDoc(taxDoc: TaxDocument, event: CoreEvent): Promise<FiscalResult> {
        // Retry logic com backoff exponencial
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // Real API Call Logic
                const invoice = this.mapToInvoiceXpress(taxDoc, event);
                const response = await this.sendToInvoiceXpress(invoice);

                console.log(`[InvoiceXpressAdapter] ✅ Invoice created successfully (attempt ${attempt})`, {
                    invoiceId: response.id,
                    orderId: (event.payload as any)?.order_id
                });

                return {
                    status: 'REPORTED',
                    gov_protocol: response.id.toString(), // Invoice ID
                    reported_at: new Date(),
                    // InvoiceXpress returns PDF URL in response
                    pdf_url: response.pdf?.url || `https://${this.config!.accountName}.app.invoicexpress.com/documents/${response.id}.pdf`,
                    qr_code: response.qr_code,
                    fiscal_signature: response.fiscal_signature
                };

            } catch (error: any) {
                lastError = error;
                const isClientError = error.message?.includes('Client error');
                const isNetworkError = error.message?.includes('fetch') || 
                                     error.message?.includes('network') || 
                                     error.message?.includes('timeout') ||
                                     error.message?.includes('Failed to fetch') ||
                                     error.message?.includes('Network error');
                
                const isRetriable = !isClientError && (isNetworkError || (error.message?.includes('5') && attempt < MAX_RETRIES));
                
                if (isClientError) {
                    return {
                        status: 'REJECTED',
                        error_details: error.message || 'Unknown error',
                        reported_at: new Date(),
                    };
                }
                if (!isRetriable || attempt === MAX_RETRIES) {
                    // Erro não retriable ou último attempt
                    console.error(`[InvoiceXpressAdapter] ❌ API Error (attempt ${attempt}/${MAX_RETRIES}):`, error);
                    return {
                        status: 'REJECTED',
                        error_details: error.message || 'Unknown error',
                        reported_at: new Date(),
                    };
                }

                // Retry com backoff
                const delay = this.calculateDelay(attempt);
                console.warn(`[InvoiceXpressAdapter] ⚠️ Retry ${attempt}/${MAX_RETRIES} after ${delay}ms:`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // Se chegou aqui, todos os retries falharam
        return {
            status: 'REJECTED',
            error_details: lastError?.message || 'Max retries exceeded',
            reported_at: new Date(),
        };
    }

    private mapToInvoiceXpress(taxDoc: TaxDocument, event: CoreEvent): any {
        // Map TaxDocument to InvoiceXpress Invoice structure
        // Reference: https://www.invoicexpress.com/api/invoices
        
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

        return {
            date: today.toISOString().split('T')[0], // YYYY-MM-DD
            due_date: dueDate.toISOString().split('T')[0],
            client: {
                name: "Consumidor Final",
                code: "Consumer",
                email: undefined, // Optional
            },
            items: taxDoc.items.map(item => {
                // TASK-2.3.2: Usar vatRate do TaxDocument se disponível
                const vatRate = taxDoc.vatRate || 0.23; // Default: 23% se não especificado
                
                // unit_price_without_tax = unit_price / (1 + vatRate)
                const unitPriceWithoutTax = item.unit_price / (1 + vatRate);
                
                return {
                    name: item.description,
                    description: item.description,
                    unit_price: item.unit_price,
                    quantity: item.quantity,
                    // TASK-2.3.2: Calcular unit_price_without_tax usando vatRate
                    unit_price_without_tax: Number(unitPriceWithoutTax.toFixed(4)),
                    tax: {
                        name: "IVA",
                        value: vatRate * 100, // Percentage (e.g., 23 for 23%)
                    }
                };
            }),
            // Optional: Add reference to order
            reference: `ORDER-${(event.payload as any)?.order_id || 'N/A'}`,
            // Optional: Add notes
            observations: `Pedido #${(event.payload as any)?.order_id || 'N/A'}`,
        };
    }

    private async sendToInvoiceXpress(invoice: any): Promise<any> {
        // P0-1 FIX: API key NUNCA deve ser enviada do cliente
        // Usar backend proxy que mantém API key segura
        // O backend busca as credenciais do restaurante e faz a chamada real
        
        // Detectar API base (simples e compatível)
        let apiBase = 'http://localhost:4320'; // Default
        if (typeof window !== 'undefined') {
            // Buscar de localStorage ou usar default
            const stored = localStorage.getItem('chefiapp_api_base');
            if (stored) {
                apiBase = stored;
            } else {
                // Fallback: tentar detectar do window (se configurado)
                const win = window as any;
                if (win.__CHEFIAPP_API_BASE__) {
                    apiBase = win.__CHEFIAPP_API_BASE__;
                }
            }
        }
        
        const url = `${apiBase}/api/fiscal/invoicexpress/invoices`;

        // Timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            // P0-1 FIX: Enviar apenas accountName, não apiKey
            // Backend busca apiKey do banco de dados
            const token = typeof window !== 'undefined' 
                ? (localStorage.getItem('x-chefiapp-token') || '')
                : '';
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-chefiapp-token': token, // Token de autenticação (não API key do InvoiceXpress)
                },
                body: JSON.stringify({ 
                    invoice,
                    accountName: this.config!.accountName,
                    // NÃO enviar apiKey - backend busca do banco
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `InvoiceXpress API Error (${response.status})`;
                
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.errors?.join(', ') || errorJson.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                
                // Categorizar erro para retry logic
                if (response.status >= 500) {
                    // Erro do servidor - retriable
                    throw new Error(`Server error: ${errorMessage}`);
                } else if (response.status === 429) {
                    // Rate limit - retriable
                    throw new Error(`Rate limit: ${errorMessage}`);
                } else {
                    // Erro do cliente - não retriable
                    throw new Error(`Client error: ${errorMessage}`);
                }
            }

            const data = await response.json();
            
            // InvoiceXpress returns { invoice: {...} }
            if (data.invoice) {
                return data.invoice;
            }
            
            // Fallback: return data directly if structure is different
            return data;
        } catch (error: any) {
            clearTimeout(timeoutId);
            
            // Tratar timeout
            if (error.name === 'AbortError') {
                throw new Error('Request timeout: InvoiceXpress API did not respond in time');
            }
            
            // Re-throw outros erros
            throw error;
        }
    }
}
