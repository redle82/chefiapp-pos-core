/**
 * P4-8: Advanced Search Panel Component
 * 
 * UI para busca avançada com múltiplos filtros
 */

import React, { useState } from 'react';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import type { Task } from '../context/StaffCoreTypes';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Input } from '../../../ui/design-system/primitives/Input';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { colors } from '../../../ui/design-system/tokens/colors';

interface AdvancedSearchPanelProps {
    onClose?: () => void;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({ onClose }) => {
    const { tasks } = useStaff();
    const {
        filters,
        logic,
        setLogic,
        addFilter,
        updateFilter,
        removeFilter,
        clearFilters,
        savedSearches,
        saveSearch,
        loadSearch,
        deleteSavedSearch,
    } = useAdvancedSearch(tasks);

    const [saveName, setSaveName] = useState('');

    return (
        <Card surface="layer1" padding="lg" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text size="lg" weight="bold">🔍 Busca Avançada</Text>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
                )}
            </div>

            {/* Logic Selector */}
            <div style={{ marginBottom: 16 }}>
                <Text size="sm" weight="bold" style={{ marginBottom: 8 }}>Lógica:</Text>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        variant={logic === 'AND' ? 'solid' : 'outline'}
                        size="sm"
                        onClick={() => setLogic('AND')}
                    >
                        E (AND)
                    </Button>
                    <Button
                        variant={logic === 'OR' ? 'solid' : 'outline'}
                        size="sm"
                        onClick={() => setLogic('OR')}
                    >
                        OU (OR)
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text size="sm" weight="bold">Filtros:</Text>
                    <Button variant="ghost" size="sm" onClick={addFilter}>+ Adicionar</Button>
                </div>
                {filters.map((filter, index) => (
                    <div key={index} style={{ 
                        display: 'flex', 
                        gap: 8, 
                        marginBottom: 8,
                        padding: 12,
                        background: colors.surface.layer2,
                        borderRadius: 8
                    }}>
                        <select
                            value={filter.field}
                            onChange={(e) => updateFilter(index, { field: e.target.value as any })}
                            style={{ flex: 1, padding: 8, borderRadius: 4, border: `1px solid ${colors.border.subtle}` }}
                        >
                            <option value="title">Título</option>
                            <option value="description">Descrição</option>
                            <option value="id">ID</option>
                            <option value="reason">Motivo</option>
                            <option value="priority">Prioridade</option>
                            <option value="status">Status</option>
                            <option value="type">Tipo</option>
                        </select>
                        <select
                            value={filter.operator}
                            onChange={(e) => updateFilter(index, { operator: e.target.value as any })}
                            style={{ flex: 1, padding: 8, borderRadius: 4, border: `1px solid ${colors.border.subtle}` }}
                        >
                            <option value="contains">Contém</option>
                            <option value="equals">Igual a</option>
                            <option value="startsWith">Começa com</option>
                            <option value="endsWith">Termina com</option>
                        </select>
                        <Input
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            placeholder="Valor..."
                            style={{ flex: 2 }}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeFilter(index)}>✕</Button>
                    </div>
                ))}
                {filters.length === 0 && (
                    <Text size="sm" color="tertiary" style={{ textAlign: 'center', padding: 16 }}>
                        Nenhum filtro adicionado. Clique em "Adicionar" para começar.
                    </Text>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Button variant="outline" size="sm" onClick={clearFilters}>Limpar</Button>
            </div>

            {/* Save Search */}
            {filters.length > 0 && (
                <div style={{ marginBottom: 16, padding: 12, background: colors.surface.layer2, borderRadius: 8 }}>
                    <Text size="sm" weight="bold" style={{ marginBottom: 8 }}>Salvar Busca:</Text>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Input
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="Nome da busca..."
                            style={{ flex: 1 }}
                        />
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                                if (saveName.trim()) {
                                    saveSearch(saveName);
                                    setSaveName('');
                                }
                            }}
                        >
                            Salvar
                        </Button>
                    </div>
                </div>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
                <div>
                    <Text size="sm" weight="bold" style={{ marginBottom: 8 }}>Buscas Salvas:</Text>
                    {savedSearches.map((saved, index) => (
                        <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: 8,
                            marginBottom: 4,
                            background: colors.surface.layer3,
                            borderRadius: 4
                        }}>
                            <Text size="sm">{saved.name}</Text>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <Button variant="ghost" size="sm" onClick={() => loadSearch(saved)}>Carregar</Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteSavedSearch(saved.name)}>✕</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
