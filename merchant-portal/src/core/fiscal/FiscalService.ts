/**
 * Fiscal Service - Integração FiscalObserver com eventos de pagamento
 * 
 * Segue o padrão GATE 5: "The Eye of Sauron"
 * - Observa eventos de pagamento
 * - Gera documentos fiscais
 * - Armazena em fiscal_event_store
 * - Não bloqueia o Core
 */

import { supabase } from '../supabase';
import { FiscalObserver } from '../../../fiscal-modules/FiscalObserver';
import { FiscalResult, TaxDocument } from '../../../fiscal-modules/types';
import { FiscalEventStore } from '../../../fiscal-modules/FiscalEventStore';
import { SupabaseFiscalEventStore } from './SupabaseFiscalEventStore';
import { ConsoleFiscalAdapter } from '../../../fiscal-modules/ConsoleFiscalAdapter';
import { TicketBAIAdapter } from '../../../fiscal-modules/adapters/TicketBAIAdapter';
import { SAFTAdapter } from '../../../fiscal-modules/adapters/SAFTAdapter';
import { Logger } from '../logger/Logger';

export interface FiscalServiceConfig {
    adapter?: FiscalObserver; // Default: ConsoleFiscalAdapter
    eventStore?: FiscalEventStore; // Default: new FiscalEventStore()
    enabled?: boolean; // Feature flag
}

export class FiscalService {
    private adapter: FiscalObserver;
    private eventStore: FiscalEventStore | SupabaseFiscalEventStore;
    private enabled: boolean;
    private useSupabase: boolean;

    constructor(config: FiscalServiceConfig = {}) {
        // MVP: Usar ConsoleFiscalAdapter como default
        // Em produção, selecionar adapter baseado no país do restaurante
        this.adapter = config.adapter || new ConsoleFiscalAdapter();
        // Usar SupabaseFiscalEventStore no frontend (merchant-portal)
        this.useSupabase = typeof window !== 'undefined';
        this.eventStore = config.eventStore || (this.useSupabase ? new SupabaseFiscalEventStore() : new FiscalEventStore());
        this.enabled = config.enabled !== false; // Default: enabled
    }

    /**
     * Seleciona adapter fiscal baseado no país
     */
    private selectAdapter(country?: string): FiscalObserver {
        if (country === 'ES') {
            return new TicketBAIAdapter();
        } else if (country === 'PT') {
            return new SAFTAdapter();
        }
        // Default: Mock adapter
        return new ConsoleFiscalAdapter();
    }

    /**
     * Processa pagamento confirmado e gera documento fiscal
     * 
     * @param orderId ID do pedido
     * @param restaurantId ID do restaurante
     * @param paymentData Dados do pagamento
     */
    async processPaymentConfirmed(params: {
        orderId: string;
        restaurantId: string;
        paymentMethod: string;
        amountCents: number;
        paymentId?: string;
    }): Promise<FiscalResult | null> {
        if (!this.enabled) {
            Logger.info('[FiscalService] Fiscal printing disabled', { orderId: params.orderId });
            return null;
        }

        try {
            // 1. Buscar dados do pedido
            const order = await this.getOrderData(params.orderId, params.restaurantId);
            if (!order) {
                Logger.warn('[FiscalService] Order not found', { orderId: params.orderId });
                return null;
            }

            // 2. Detectar país do restaurante
            const country = await this.getRestaurantCountry(params.restaurantId);
            
            // 3. Selecionar adapter baseado no país
            const adapter = this.selectAdapter(country);

            // 4. Criar documento fiscal
            const taxDoc = this.createTaxDocument(order, params, country);

            // 5. Processar via adapter regional
            const result = await adapter.onSealed(
                {
                    seal_id: `SEAL-${params.orderId}-${Date.now()}`,
                    entity_type: 'ORDER',
                    entity_id: params.orderId,
                    legal_state: 'PAYMENT_SEALED',
                    financial_state: JSON.stringify({ amount: params.amountCents }),
                    created_at: new Date(),
                } as any, // LegalSeal mock
                {
                    event_id: `EVENT-${params.orderId}-${Date.now()}`,
                    stream_id: `ORDER:${params.orderId}`,
                    stream_version: 0,
                    type: 'PAYMENT_CONFIRMED',
                    payload: {
                        order_id: params.orderId,
                        payment_id: params.paymentId,
                        amount_cents: params.amountCents,
                        payment_method: params.paymentMethod,
                    },
                    occurred_at: new Date(),
                    idempotency_key: `fiscal:${params.orderId}`,
                } as any // CoreEvent mock
            );

            // 4. Armazenar em fiscal_event_store
            if (this.useSupabase && this.eventStore instanceof SupabaseFiscalEventStore) {
                await this.eventStore.recordInteraction(taxDoc, result, params.orderId, params.restaurantId);
            } else if (this.eventStore instanceof FiscalEventStore) {
                await this.eventStore.recordInteraction(taxDoc, result);
            }

            Logger.info('[FiscalService] Fiscal document generated', {
                orderId: params.orderId,
                status: result.status,
                protocol: result.gov_protocol,
            });

            return result;
        } catch (error: any) {
            Logger.error('[FiscalService] Failed to process fiscal document', error, {
                orderId: params.orderId,
            });
            // Não lança erro - fiscal não deve bloquear pagamento
            return null;
        }
    }

    /**
     * Busca dados do pedido para gerar documento fiscal
     * Exposto como método público para uso externo
     */
    async getOrderData(orderId: string, restaurantId: string) {
        const { data, error } = await supabase
            .from('gm_orders')
            .select(`
                *,
                items:gm_order_items(*),
                restaurant:gm_restaurants(name, address, city, postal_code, country_code)
            `)
            .eq('id', orderId)
            .eq('restaurant_id', restaurantId)
            .single();

        if (error) {
            Logger.error('[FiscalService] Failed to fetch order', error, { orderId });
            return null;
        }

        // Enriquecer dados do pedido com informações do restaurante
        if (data && data.restaurant) {
            data.restaurant_name = data.restaurant.name;
            data.restaurant_address = data.restaurant.address;
            data.restaurant_city = data.restaurant.city;
            data.restaurant_postal_code = data.restaurant.postal_code;
        }

        return data;
    }

    /**
     * Busca país do restaurante
     * MVP: Default para Espanha
     * Produção: Buscar de gm_restaurants.country_code ou legal_profiles
     */
    private async getRestaurantCountry(restaurantId: string): Promise<string> {
        try {
            // Tentar buscar de legal_profiles ou gm_restaurants
            const { data, error } = await supabase
                .from('gm_restaurants')
                .select('country_code, iso')
                .eq('id', restaurantId)
                .single();

            if (!error && data) {
                return data.country_code || data.iso || 'ES'; // Default: Espanha
            }
        } catch (err) {
            Logger.warn('[FiscalService] Failed to fetch restaurant country', err, { restaurantId });
        }

        // Default: Espanha (para Ibiza)
        return 'ES';
    }

    /**
     * Cria documento fiscal a partir do pedido
     * MVP: Versão simplificada (mock)
     * Produção: Implementar adapters regionais
     */
    private createTaxDocument(order: any, payment: {
        paymentMethod: string;
        amountCents: number;
    }, country: string = 'ES'): TaxDocument {
        // Buscar dados do restaurante para XML SAF-T
        const restaurantName = order.restaurant_name || 'Restaurante';
        const restaurantAddress = order.restaurant_address || 'N/A';
        const restaurantCity = order.restaurant_city || 'N/A';
        const restaurantPostalCode = order.restaurant_postal_code || '0000-000';
        // Detectar tipo de documento baseado no país
        let docType: 'MOCK' | 'TICKETBAI' | 'SAF-T' = 'MOCK';
        let vatRate = 0.21; // Default: 21% (Espanha)
        
        if (country === 'ES') {
            docType = 'TICKETBAI';
            vatRate = 0.21; // 21% IVA (Espanha)
        } else if (country === 'PT') {
            docType = 'SAF-T';
            vatRate = 0.23; // 23% IVA (Portugal)
        }

        // Calcular impostos
        const totalAmount = payment.amountCents / 100; // Converter para euros
        const vatAmount = totalAmount * vatRate;
        const subtotal = totalAmount - vatAmount;

        return {
            doc_type: docType,
            ref_event_id: `EVENT-${order.id}`,
            ref_seal_id: `SEAL-${order.id}`,
            total_amount: totalAmount,
            taxes: {
                vat: vatAmount, // IVA (Espanha/Portugal)
            },
            items: (order.items || []).map((item: any) => ({
                code: item.product_id || 'N/A',
                description: item.name_snapshot || item.product_name || 'Item',
                quantity: item.quantity || 1,
                unit_price: (item.price_snapshot || item.unit_price || 0) / 100,
                total: ((item.price_snapshot || item.unit_price || 0) * (item.quantity || 1)) / 100,
            })),
            raw_payload: {
                order_id: order.id,
                restaurant_id: order.restaurant_id,
                restaurant_name: restaurantName,
                address: restaurantAddress,
                city: restaurantCity,
                postal_code: restaurantPostalCode,
                tax_registration_number: order.tax_registration_number || '999999999',
                payment_method: payment.paymentMethod,
                total_amount: totalAmount,
                vat_amount: vatAmount,
                subtotal: subtotal,
                items: order.items,
                generated_at: new Date().toISOString(),
            },
        };
    }

    /**
     * Verifica se documento fiscal já foi gerado para um pedido
     */
    async hasFiscalDocument(orderId: string, docType: string = 'MOCK'): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('fiscal_event_store')
                .select('fiscal_event_id')
                .eq('order_id', orderId)
                .eq('doc_type', docType)
                .eq('fiscal_status', 'REPORTED')
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                Logger.error('[FiscalService] Failed to check fiscal document', error, { orderId });
                return false;
            }

            return !!data;
        } catch (error) {
            Logger.error('[FiscalService] Error checking fiscal document', error, { orderId });
            return false;
        }
    }

    /**
     * Busca documento fiscal por order_id
     */
    async getFiscalDocument(orderId: string) {
        try {
            const { data, error } = await supabase
                .from('fiscal_event_store')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                Logger.error('[FiscalService] Failed to fetch fiscal document', error, { orderId });
                return null;
            }

            return data;
        } catch (error) {
            Logger.error('[FiscalService] Error fetching fiscal document', error, { orderId });
            return null;
        }
    }
}

// Singleton instance
let fiscalServiceInstance: FiscalService | null = null;

export function getFiscalService(): FiscalService {
    if (!fiscalServiceInstance) {
        fiscalServiceInstance = new FiscalService({
            enabled: true, // Feature flag - pode vir de config
        });
    }
    return fiscalServiceInstance;
}
