/**
 * Hook para gerenciar chamados do garçom com deduplicação
 */
// @ts-nocheck


import { useMemo } from 'react';
import type { WaiterCall, DedupeConfig } from '../types';
import { DEFAULT_DEDUPE_CONFIG, AlertPriority } from '../types';

export function useWaiterCalls(
  calls: WaiterCall[],
  config: DedupeConfig = DEFAULT_DEDUPE_CONFIG
) {
  // Deduplicar chamados: 3 chamados da mesma mesa = 1 alerta urgente
  const deduplicatedCalls = useMemo(() => {
    const grouped = new Map<string, WaiterCall[]>();
    
    // Agrupar por mesa
    calls.forEach(call => {
      const existing = grouped.get(call.tableId) || [];
      existing.push(call);
      grouped.set(call.tableId, existing);
    });

    // Processar cada grupo
    const result: WaiterCall[] = [];
    
    grouped.forEach((groupCalls, _tableId) => {
      // Ordenar por data (mais recente primeiro)
      const sorted = groupCalls.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      const totalCount = sorted.length;
      const mostRecent = sorted[0];

      // Se passou do threshold, criar alerta urgente
      if (totalCount >= config.urgentThreshold) {
        result.push({
          ...mostRecent,
          priority: AlertPriority.P0,
          count: totalCount,
        });
      } else {
        // Manter chamados individuais
        result.push(...sorted);
      }
    });

    // Ordenar por prioridade + tempo
    return result.sort((a, b) => {
      const priorityOrder = {
        [AlertPriority.P0]: 0,
        [AlertPriority.P1]: 1,
        [AlertPriority.P2]: 2,
        [AlertPriority.P3]: 3,
      };
      
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Mesma prioridade: mais recente primeiro
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [calls, config]);

  // Contar chamados por prioridade
  const counts = useMemo(() => {
    return {
      urgent: deduplicatedCalls.filter(c => c.priority === AlertPriority.P0).length,
      high: deduplicatedCalls.filter(c => c.priority === AlertPriority.P1).length,
      medium: deduplicatedCalls.filter(c => c.priority === AlertPriority.P2).length,
      low: deduplicatedCalls.filter(c => c.priority === AlertPriority.P3).length,
      total: deduplicatedCalls.length,
    };
  }, [deduplicatedCalls]);

  return {
    calls: deduplicatedCalls,
    counts,
  };
}

