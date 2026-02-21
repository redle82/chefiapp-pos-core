/**
 * P3-1: Task Filtering Hook
 * 
 * Filtros para tarefas:
 * - Todas
 * - Pendentes
 * - Críticas
 * - Concluídas
 */

import { useState, useMemo } from 'react';
import type { Task } from '../context/StaffCoreTypes';

export type TaskFilter = 'all' | 'pending' | 'critical' | 'done';

export function useTaskFilters(tasks: Task[]) {
    const [filter, setFilter] = useState<TaskFilter>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredTasks = useMemo(() => {
        let filtered = tasks;

        // Apply filter
        switch (filter) {
            case 'pending':
                filtered = filtered.filter(t => t.status === 'pending');
                break;
            case 'critical':
                filtered = filtered.filter(t => 
                    t.priority === 'critical' || 
                    t.priority === 'urgent' || 
                    (t.riskLevel && t.riskLevel > 70)
                );
                break;
            case 'done':
                filtered = filtered.filter(t => t.status === 'done');
                break;
            case 'all':
            default:
                // Show all
                break;
        }

        // Apply search (P3-2)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.id.toLowerCase().includes(query) ||
                (t.reason && t.reason.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [tasks, filter, searchQuery]);

    return {
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        filteredTasks,
    };
}
