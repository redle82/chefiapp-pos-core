/**
 * Historical Data Engine - The "Time Machine"
 * 
 * Este módulo gerencia dados de vendas "importados" de sistemas legados (GloriaFood, TPVs antigos).
 * Estes dados são READ-ONLY para fins operacionais (não alteram caixa fiscal atual).
 * 
 * Funcionalidades:
 * 1. Mapeamento de CSV/JSON para estrutura unificada.
 * 2. Consultas de Dashboard que mesclam (UNION) dados reais com históricos.
 * 3. Identificação de tendências (ex: "Sexta passada vendeu X no sistema antigo").
 */

import { supabase } from '../supabase';

export interface HistoricalSale {
    id: string; // ID original ou gerado
    restaurantId: string;
    sourceSystem: 'gloriafood' | 'ifood' | 'legacy_pos' | 'csv_import';
    importedAt: Date;

    // Dados normalizados
    saleDate: Date;
    totalCents: number;
    paymentMethod: string;
    itemsCount: number;

    // Metadata original (para auditoria)
    originalId?: string;
    rawJson?: any;
}

export interface SalesPeriodStats {
    period: string; // 'YYYY-MM-DD'
    totalCents: number;
    ordersCount: number;
    source: 'chefiapp' | 'historical' | 'hybrid';
}

export class HistoricalDataEngine {

    /**
     * Importar Lote de Vendas Históricas
     * (Geralmente chamado via API/Edge Function, mas aqui versionado no client para MVP)
     */
    async importBatch(restaurantId: string, source: string, sales: Partial<HistoricalSale>[]): Promise<{ imported: number; errors: number }> {
        // Normalizar dados
        const rows = sales.map(sale => ({
            restaurant_id: restaurantId,
            source_system: source,
            sale_date: sale.saleDate,
            total_cents: sale.totalCents,
            payment_method: sale.paymentMethod,
            items_count: sale.itemsCount || 1,
            original_id: sale.originalId,
            raw_data: sale.rawJson,
            imported_at: new Date(),
        }));

        // Insert em batch na tabela 'gm_historical_sales'
        // OBS: Tabela deve existir no Supabase.
        const { error } = await supabase
            .from('gm_historical_sales')
            .insert(rows);

        if (error) {
            console.error('[TimeMachine] Batch import failed:', error);
            throw error;
        }

        return { imported: rows.length, errors: 0 };
    }

    /**
     * Obter Vendas Totais (Híbrido: Real + Histórico)
     * Útil para gráficos "Ano todo".
     */
    async getHybridSalesStats(restaurantId: string, startDate: Date, endDate: Date): Promise<SalesPeriodStats[]> {
        // 1. Buscar histórico
        const { data: history } = await supabase
            .from('gm_historical_sales')
            .select('sale_date, total_cents')
            .eq('restaurant_id', restaurantId)
            .gte('sale_date', startDate.toISOString())
            .lte('sale_date', endDate.toISOString());

        // 2. Buscar vendas reais (chefiapp)
        const { data: real } = await supabase
            .from('gm_orders')
            .select('created_at, total_amount')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'PAID') // Apenas pagas
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        // 3. Merge e Agrupamento (Ex: por dia)
        const statsMap = new Map<string, SalesPeriodStats>();

        // Processar Histórico
        (history || []).forEach((h: any) => {
            const day = new Date(h.sale_date).toISOString().split('T')[0];
            const existing = statsMap.get(day) || { period: day, totalCents: 0, ordersCount: 0, source: 'historical' };
            existing.totalCents += h.total_cents;
            existing.ordersCount += 1;
            statsMap.set(day, existing);
        });

        // Processar Real
        (real || []).forEach((r: any) => {
            const day = new Date(r.created_at).toISOString().split('T')[0];
            const existing = statsMap.get(day) || { period: day, totalCents: 0, ordersCount: 0, source: 'chefiapp' };

            // Se já tinha histórico, vira hibrido
            if (existing.source === 'historical') existing.source = 'hybrid';

            existing.totalCents += r.total_amount || 0;
            existing.ordersCount += 1;
            statsMap.set(day, existing);
        });

        return Array.from(statsMap.values()).sort((a, b) => a.period.localeCompare(b.period));
    }
}

export const historicalEngine = new HistoricalDataEngine();
