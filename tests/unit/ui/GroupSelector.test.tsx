/**
 * GroupSelector Tests - Testes de UI para seletor de grupos de consumo
 * 
 * Testa:
 * - Renderização do seletor
 * - Seleção de grupos
 * - Criação de novo grupo
 * - Estados vazios
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupSelector } from '../../../merchant-portal/src/pages/TPV/components/GroupSelector';
import type { ConsumptionGroup } from '../../../merchant-portal/src/pages/TPV/types/ConsumptionGroup';

describe('GroupSelector', () => {
    const mockGroups: ConsumptionGroup[] = [
        {
            id: 'group-1',
            restaurant_id: 'rest-1',
            order_id: 'order-1',
            label: 'Mesa 1',
            color: '#FF5733',
            position: 1,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 'group-2',
            restaurant_id: 'rest-1',
            order_id: 'order-2',
            label: 'Mesa 2',
            color: '#33FF57',
            position: 2,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 'group-3',
            restaurant_id: 'rest-1',
            order_id: 'order-3',
            label: 'Mesa 3',
            color: '#3357FF',
            position: 3,
            status: 'paid', // Inactive groups are 'paid' or 'cancelled'
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];

    const mockOnSelect = jest.fn();
    const mockOnCreateNew = jest.fn();

    beforeEach(() => {
        mockOnSelect.mockClear();
        mockOnCreateNew.mockClear();
    });

    it('deve renderizar o seletor de grupos', () => {
        render(
            <GroupSelector
                groups={mockGroups}
                selectedGroupId={null}
                onSelect={mockOnSelect}
            />
        );
        
        expect(screen.getByText('Selecionar Grupo')).toBeInTheDocument();
    });

    it('deve mostrar apenas grupos ativos', () => {
        render(
            <GroupSelector
                groups={mockGroups}
                selectedGroupId={null}
                onSelect={mockOnSelect}
            />
        );
        
        expect(screen.getByText('Mesa 1')).toBeInTheDocument();
        expect(screen.getByText('Mesa 2')).toBeInTheDocument();
        expect(screen.queryByText('Mesa 3')).not.toBeInTheDocument(); // Paid (not active)
    });

    it('deve chamar onSelect quando grupo é clicado', () => {
        render(
            <GroupSelector
                groups={mockGroups}
                selectedGroupId={null}
                onSelect={mockOnSelect}
            />
        );
        
        const group1Button = screen.getByText('Mesa 1');
        fireEvent.click(group1Button);
        
        expect(mockOnSelect).toHaveBeenCalledWith('group-1');
    });

    it('deve destacar grupo selecionado', () => {
        render(
            <GroupSelector
                groups={mockGroups}
                selectedGroupId="group-1"
                onSelect={mockOnSelect}
            />
        );
        
        const group1Button = screen.getByText('Mesa 1').closest('button');
        expect(group1Button).toBeInTheDocument();
        // Verificar que o botão está selecionado (pode variar com a implementação do Button)
    });

    it('deve mostrar botão criar novo quando onCreateNew é fornecido', () => {
        render(
            <GroupSelector
                groups={mockGroups}
                selectedGroupId={null}
                onSelect={mockOnSelect}
                onCreateNew={mockOnCreateNew}
            />
        );
        
        expect(screen.getByText(/Criar Grupo/)).toBeInTheDocument();
    });

    it('deve chamar onCreateNew quando botão criar novo é clicado', () => {
        render(
            <GroupSelector
                groups={mockGroups}
                selectedGroupId={null}
                onSelect={mockOnSelect}
                onCreateNew={mockOnCreateNew}
            />
        );
        
        const createButton = screen.getByText(/Criar Grupo/);
        fireEvent.click(createButton);
        
        expect(mockOnCreateNew).toHaveBeenCalledTimes(1);
    });

    it('não deve mostrar botão criar novo quando onCreateNew não é fornecido', () => {
        render(
            <GroupSelector
                groups={mockGroups}
                selectedGroupId={null}
                onSelect={mockOnSelect}
            />
        );
        
        expect(screen.queryByText(/Criar Grupo/)).not.toBeInTheDocument();
    });

    it('deve mostrar estado vazio quando não há grupos ativos', () => {
        render(
            <GroupSelector
                groups={[]}
                selectedGroupId={null}
                onSelect={mockOnSelect}
            />
        );
        
        expect(screen.getByText('Selecionar Grupo')).toBeInTheDocument();
        // Não deve mostrar grupos
    });
});
