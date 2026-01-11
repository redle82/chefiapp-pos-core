/**
 * CustomersPage - Página de gerenciamento de clientes (CRM)
 * 
 * FASE 3: UI para visualizar e gerenciar clientes
 */

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../ui/design-system/layouts/AdminLayout';
import { AdminSidebar } from '../../ui/design-system/domain/AdminSidebar';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Input } from '../../ui/design-system/primitives/Input';
import { Button } from '../../ui/design-system/primitives/Button';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { useToast } from '../../ui/design-system';
import { CustomerService, type CustomerProfile } from '../../core/crm/CustomerService';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { useNavigate } from 'react-router-dom';

export const CustomersPage: React.FC = () => {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const restaurantId = getTabIsolated('chefiapp_restaurant_id');

    const [customers, setCustomers] = useState<CustomerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTopCustomers, setShowTopCustomers] = useState(false);

    useEffect(() => {
        if (restaurantId) {
            loadCustomers();
        }
    }, [restaurantId, showTopCustomers]);

    const loadCustomers = async () => {
        if (!restaurantId) return;

        setLoading(true);
        try {
            let data: CustomerProfile[];
            if (showTopCustomers) {
                data = await CustomerService.getTopCustomers(restaurantId, 20);
            } else if (searchQuery) {
                data = await CustomerService.searchCustomers(restaurantId, searchQuery);
            } else {
                data = await CustomerService.getTopCustomers(restaurantId, 50);
            }
            setCustomers(data);
        } catch (err) {
            error('Erro ao carregar clientes: ' + (err instanceof Error ? err.message : 'Unknown'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setShowTopCustomers(true);
            return;
        }
        setShowTopCustomers(false);
        await loadCustomers();
    };

    return (
        <AdminLayout
            sidebar={<AdminSidebar activePath="/app/crm" onNavigate={navigate} />}
            content={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 64 }}>
                    <div>
                        <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                            👥 Clientes (CRM)
                        </Text>
                        <Text size="sm" color="secondary">
                            Gerencie seus clientes e visualize histórico de pedidos
                        </Text>
                    </div>

                    {/* Search Bar */}
                    <Card surface="base" padding="lg">
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Input
                                placeholder="Buscar por nome, email ou telefone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                fullWidth
                            />
                            <Button variant="primary" onClick={handleSearch}>
                                Buscar
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSearchQuery('');
                                    setShowTopCustomers(true);
                                    loadCustomers();
                                }}
                            >
                                Top Clientes
                            </Button>
                        </div>
                    </Card>

                    {/* Customers List */}
                    {loading ? (
                        <Card surface="base" padding="xl">
                            <Text size="sm" color="tertiary">Carregando clientes...</Text>
                        </Card>
                    ) : customers.length === 0 ? (
                        <Card surface="base" padding="xl">
                            <Text size="sm" color="tertiary" style={{ textAlign: 'center' }}>
                                {searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
                            </Text>
                        </Card>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {customers.map((customer) => (
                                <Card key={customer.id} surface="base" padding="lg">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                                <Text size="lg" weight="bold" color="primary">
                                                    {customer.full_name || customer.preferred_name || 'Cliente sem nome'}
                                                </Text>
                                                {customer.tags && customer.tags.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        {customer.tags.map((tag) => (
                                                            <Badge key={tag} status="ready" label={tag} size="sm" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                                                {customer.email && (
                                                    <Text size="sm" color="secondary">📧 {customer.email}</Text>
                                                )}
                                                {customer.phone && (
                                                    <Text size="sm" color="secondary">📱 {customer.phone}</Text>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: 24 }}>
                                                <div>
                                                    <Text size="xs" color="tertiary">Visitas</Text>
                                                    <Text size="md" weight="bold">{customer.total_visits || 0}</Text>
                                                </div>
                                                <div>
                                                    <Text size="xs" color="tertiary">Total Gasto</Text>
                                                    <Text size="md" weight="bold">
                                                        {new Intl.NumberFormat('pt-PT', {
                                                            style: 'currency',
                                                            currency: 'EUR'
                                                        }).format(customer.total_spent || 0)}
                                                    </Text>
                                                </div>
                                                {customer.last_visit_at && (
                                                    <div>
                                                        <Text size="xs" color="tertiary">Última Visita</Text>
                                                        <Text size="sm" color="secondary">
                                                            {new Date(customer.last_visit_at).toLocaleDateString('pt-PT')}
                                                        </Text>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            }
        />
    );
};
