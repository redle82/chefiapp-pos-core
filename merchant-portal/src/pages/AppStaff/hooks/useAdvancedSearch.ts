/**
 * P4-8: Advanced Search Hook
 * 
 * Busca avançada com múltiplos filtros e critérios combinados
 */

import { useState, useMemo } from 'react';
import type { Task } from '../context/StaffCoreTypes';

export type SearchFilter = {
    field: 'title' | 'description' | 'id' | 'reason' | 'priority' | 'status' | 'type';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
    value: string;
};

export type SearchLogic = 'AND' | 'OR';

export interface AdvancedSearchState {
    filters: SearchFilter[];
    logic: SearchLogic;
    savedSearches: Array<{ name: string; filters: SearchFilter[]; logic: SearchLogic }>;
}

export function useAdvancedSearch(tasks: Task[] = []) {
    const [filters, setFilters] = useState<SearchFilter[]>([]);
    const [logic, setLogic] = useState<SearchLogic>('AND');
    const [savedSearches, setSavedSearches] = useState<Array<{ name: string; filters: SearchFilter[]; logic: SearchLogic }>>(() => {
        // Load from localStorage
        const saved = localStorage.getItem('chefiapp_saved_searches');
        return saved ? JSON.parse(saved) : [];
    });

    const addFilter = () => {
        setFilters([...filters, {
            field: 'title',
            operator: 'contains',
            value: '',
        }]);
    };

    const updateFilter = (index: number, filter: Partial<SearchFilter>) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], ...filter };
        setFilters(newFilters);
    };

    const removeFilter = (index: number) => {
        setFilters(filters.filter((_, i) => i !== index));
    };

    const clearFilters = () => {
        setFilters([]);
    };

    const saveSearch = (name: string) => {
        const newSaved = [...savedSearches, { name, filters, logic }];
        setSavedSearches(newSaved);
        localStorage.setItem('chefiapp_saved_searches', JSON.stringify(newSaved));
    };

    const loadSearch = (savedSearch: { name: string; filters: SearchFilter[]; logic: SearchLogic }) => {
        setFilters(savedSearch.filters);
        setLogic(savedSearch.logic);
    };

    const deleteSavedSearch = (name: string) => {
        const newSaved = savedSearches.filter(s => s.name !== name);
        setSavedSearches(newSaved);
        localStorage.setItem('chefiapp_saved_searches', JSON.stringify(newSaved));
    };

    const filteredTasks = useMemo(() => {
        if (filters.length === 0) return tasks;

        return tasks.filter(task => {
            const results = filters.map(filter => {
                let fieldValue: string = '';
                
                switch (filter.field) {
                    case 'title':
                        fieldValue = task.title.toLowerCase();
                        break;
                    case 'description':
                        fieldValue = task.description.toLowerCase();
                        break;
                    case 'id':
                        fieldValue = task.id.toLowerCase();
                        break;
                    case 'reason':
                        fieldValue = (task.reason || '').toLowerCase();
                        break;
                    case 'priority':
                        fieldValue = task.priority.toLowerCase();
                        break;
                    case 'status':
                        fieldValue = task.status.toLowerCase();
                        break;
                    case 'type':
                        fieldValue = (task.type || '').toLowerCase();
                        break;
                }

                const searchValue = filter.value.toLowerCase();

                switch (filter.operator) {
                    case 'contains':
                        return fieldValue.includes(searchValue);
                    case 'equals':
                        return fieldValue === searchValue;
                    case 'startsWith':
                        return fieldValue.startsWith(searchValue);
                    case 'endsWith':
                        return fieldValue.endsWith(searchValue);
                    default:
                        return false;
                }
            });

            if (logic === 'AND') {
                return results.every(r => r);
            } else {
                return results.some(r => r);
            }
        });
    }, [tasks, filters, logic]);

    return {
        filters,
        logic,
        setLogic,
        addFilter,
        updateFilter,
        removeFilter,
        clearFilters,
        filteredTasks,
        savedSearches,
        saveSearch,
        loadSearch,
        deleteSavedSearch,
    };
}
