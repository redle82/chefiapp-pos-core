import React, { useState } from 'react';
import { Card, Text, Button } from '../../../ui/design-system/primitives';
import { useLoyalty } from '../../../core/loyalty/LoyaltyContext';
import { spacing } from '../../../ui/design-system/tokens/spacing';

interface CustomerSearchModalProps {
    restaurantId: string;
    onClose: () => void;
}

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({ restaurantId, onClose }) => {
    const { searchCustomerByPhone, createCustomer, setActiveCustomer } = useLoyalty();
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'search' | 'create'>('search');
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const customer = await searchCustomerByPhone(phone, restaurantId);
            if (customer) {
                setActiveCustomer(customer);
                onClose();
            } else {
                setMode('create');
            }
        } catch (err) {
            setError('Erro ao buscar cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const customer = await createCustomer(name, phone, restaurantId);
            setActiveCustomer(customer);
            onClose();
        } catch (err: any) {
            setError('Erro ao criar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
            <Card surface="layer1" padding="xl" style={{ width: 400 }}>
                <Text weight="bold" size="xl" color="primary" style={{ marginBottom: spacing[4] }}>
                    {mode === 'search' ? 'Identificar Cliente' : 'Novo Cliente'}
                </Text>

                {mode === 'search' ? (
                    <form onSubmit={handleSearch}>
                        <div style={{ marginBottom: spacing[4] }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: 4 }}>Telefone (Celular)</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="912345678"
                                autoFocus
                                style={{ width: '100%', padding: 12, borderRadius: 8, fontSize: 18 }}
                            />
                        </div>
                        <Button type="submit" tone="action" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Buscando...' : 'Buscar'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleCreate}>
                        <div style={{ marginBottom: spacing[3] }}>
                            <Text color="secondary">Cliente não encontrado com este número.</Text>
                        </div>
                        <div style={{ marginBottom: spacing[3] }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: 4 }}>Telefone</label>
                            <input
                                type="tel"
                                value={phone}
                                disabled
                                style={{ width: '100%', padding: 12, borderRadius: 8, fontSize: 18, opacity: 0.7 }}
                            />
                        </div>
                        <div style={{ marginBottom: spacing[4] }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: 4 }}>Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Nome do Cliente"
                                autoFocus
                                required
                                style={{ width: '100%', padding: 12, borderRadius: 8, fontSize: 18 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: spacing[2] }}>
                            <Button type="button" variant="outline" onClick={() => setMode('search')} disabled={loading}>
                                Voltar
                            </Button>
                            <Button type="submit" tone="success" style={{ flex: 1 }} disabled={loading}>
                                {loading ? 'Criando...' : 'Cadastrar'}
                            </Button>
                        </div>
                    </form>
                )}

                {error && <Text color="destructive" style={{ marginTop: spacing[3] }}>{error}</Text>}

                <div style={{ marginTop: spacing[4], textAlign: 'center' }}>
                    <Button variant="ghost" onClick={onClose}>Fechar</Button>
                </div>
            </Card>
        </div>
    );
};
