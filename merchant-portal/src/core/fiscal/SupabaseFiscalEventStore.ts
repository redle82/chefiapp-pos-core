/**
 * SupabaseFiscalEventStore - Implementação do FiscalEventStore usando Supabase Client
 * 
 * Para uso no frontend (merchant-portal)
 */

import { supabase } from '../supabase';
import type { TaxDocument } from '../../../../fiscal-modules/types';
import type { FiscalResult } from '../../../../fiscal-modules/types';
import { Logger } from '../logger';

export class SupabaseFiscalEventStore {
    /**
     * Records an interaction with the Fiscal Authority.
     */
    async recordInteraction(
        doc: TaxDocument,
        result: FiscalResult,
        orderId: string,
        restaurantId: string
    ): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('fiscal_event_store')
                .insert({
                    ref_seal_id: doc.ref_seal_id,
                    ref_event_id: doc.ref_event_id,
                    order_id: orderId,
                    restaurant_id: restaurantId,
                    doc_type: doc.doc_type,
                    gov_protocol: result.gov_protocol || null,
                    payload_sent: doc.raw_payload || {},
                    response_received: result,
                    fiscal_status: result.status === 'REPORTED' ? 'REPORTED' : 
                                  result.status === 'REJECTED' ? 'REJECTED' : 
                                  'PENDING',
                    retry_count: 0, // P0-4 FIX: Inicializar retry_count
                })
                .select('fiscal_event_id')
                .single();

            if (error) {
                // Se for erro de duplicata (idempotency), retornar ID existente
                if (error.code === '23505') { // unique_violation
                    Logger.warn('[SupabaseFiscalEventStore] Duplicate fiscal document, fetching existing', {
                        orderId,
                        docType: doc.doc_type,
                    });
                    
                    const { data: existing } = await supabase
                        .from('fiscal_event_store')
                        .select('fiscal_event_id')
                        .eq('order_id', orderId)
                        .eq('doc_type', doc.doc_type)
                        .single();
                    
                    if (existing) {
                        return existing.fiscal_event_id;
                    }
                }
                
                throw error;
            }

            if (!data) {
                throw new Error('Failed to insert fiscal event');
            }

            Logger.info('[SupabaseFiscalEventStore] Fiscal event recorded', {
                fiscalEventId: data.fiscal_event_id,
                orderId,
            });

            return data.fiscal_event_id;
        } catch (err: any) {
            Logger.error('[SupabaseFiscalEventStore] Failed to record interaction', err, {
                orderId,
                docType: doc.doc_type,
            });
            throw err;
        }
    }

    /**
     * Busca documento fiscal por order_id
     */
    async getByOrderId(orderId: string, docType?: string) {
        try {
            let query = supabase
                .from('fiscal_event_store')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (docType) {
                query = query.eq('doc_type', docType);
            }

            const { data, error } = await query.single();

            if (error) {
                if (error.code === 'PGRST116') { // not found
                    return null;
                }
                throw error;
            }

            return data;
        } catch (err: any) {
            Logger.error('[SupabaseFiscalEventStore] Failed to get fiscal document', err, { orderId });
            return null;
        }
    }
}
