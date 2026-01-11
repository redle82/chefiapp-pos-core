import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../ui/design-system/Card';
import { Button } from '../../../ui/design-system/Button';
import { Colors, Spacing, Typography } from '../../../ui/design-system/tokens';

export type PaymentMethod = 'cash' | 'card' | 'pix';

interface CheckoutModalProps {
    total: number;
    onConfirm: (method: PaymentMethod) => void;
    onCancel: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ total, onConfirm, onCancel }) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [amountGiven, setAmountGiven] = useState<string>('');

    const formattedTotal = new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
    }).format(total);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            fontFamily: Typography.fontFamily
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ width: '100%', maxWidth: '400px' }}
            >
                <Card padding="xl" style={{ border: '1px solid #333', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                    <h2 style={{ margin: '0 0 24px', textAlign: 'center', fontSize: '24px' }}>Fechar Conta</h2>

                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ fontSize: '14px', opacity: 0.5 }}>Total a Pagar</div>
                        <div style={{ fontSize: '48px', fontWeight: 700, color: Colors.success }}>
                            {formattedTotal}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
                        {[
                            { id: 'cash', icon: '💵', label: 'Dinheiro' },
                            { id: 'card', icon: '💳', label: 'Cartão' },
                            { id: 'pix', icon: '💠', label: 'Pix' }
                        ].map(method => (
                            <button
                                key={method.id}
                                onClick={() => {
                                    setSelectedMethod(method.id as PaymentMethod);
                                    setAmountGiven(''); // Reset on change
                                }}
                                style={{
                                    background: selectedMethod === method.id ? Colors.primary : '#222',
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '16px 8px',
                                    cursor: 'pointer',
                                    color: selectedMethod === method.id ? '#000' : '#fff',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontSize: 24, marginBottom: 8 }}>{method.icon}</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{method.label}</div>
                            </button>
                        ))}
                    </div>

                    {/* CHANGE CALCULATOR for CASH */}
                    {selectedMethod === 'cash' && (
                        <div style={{ marginBottom: 32, padding: 16, background: '#222', borderRadius: 12 }}>
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: '13px', color: '#888', marginBottom: 4 }}>Valor Recebido (€)</div>
                                <input
                                    type="number"
                                    value={amountGiven}
                                    onChange={(e) => setAmountGiven(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: '1px solid #444',
                                        borderRadius: 8,
                                        padding: '12px',
                                        color: 'white',
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>

                            {amountGiven && !isNaN(parseFloat(amountGiven)) && (
                                <div style={{
                                    opacity: (parseFloat(amountGiven) - total / 100) >= 0 ? 1 : 0.5,
                                    transition: 'all 0.3s'
                                }}>
                                    <div style={{ fontSize: '13px', color: '#888', marginBottom: 4 }}>Troco</div>
                                    <div style={{
                                        fontSize: '32px',
                                        fontWeight: 'bold',
                                        color: (parseFloat(amountGiven) - total / 100) >= 0 ? Colors.success : Colors.warning
                                    }}>
                                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
                                            .format(Math.max(0, parseFloat(amountGiven) - total / 100))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12 }}>
                        <Button variant="ghost" onClick={onCancel} style={{ flex: 1 }}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!selectedMethod || (selectedMethod === 'cash' && (!amountGiven || parseFloat(amountGiven) < total / 100))}
                            onClick={() => selectedMethod && onConfirm(selectedMethod)}
                            style={{ flex: 1, opacity: (!selectedMethod || (selectedMethod === 'cash' && (!amountGiven || parseFloat(amountGiven) < total / 100))) ? 0.5 : 1 }}
                        >
                            Confirmar
                        </Button>
                    </div>

                </Card>
            </motion.div>
        </div>
    );
};
