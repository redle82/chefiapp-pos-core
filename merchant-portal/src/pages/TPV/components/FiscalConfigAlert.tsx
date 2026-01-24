/**
 * Fiscal Config Alert - Alerta quando fiscal não está configurado
 * 
 * Mostra banner vermelho se fiscal não estiver configurado corretamente
 */

import React, { useState, useEffect } from 'react';
import { getFiscalService } from '../../../core/fiscal/FiscalService';
import { supabase } from '../../../core/supabase';

interface FiscalConfigAlertProps {
    restaurantId: string | null;
}

export const FiscalConfigAlert: React.FC<FiscalConfigAlertProps> = ({ restaurantId }) => {
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!restaurantId) {
            setIsConfigured(null);
            setChecking(false);
            return;
        }

        const checkFiscalConfig = async () => {
            try {
                // Verificar se há configuração fiscal no banco
                // Por enquanto, verificar se há InvoiceXpress configurado
                // TODO: Verificar configuração real quando implementar settings UI
                const { data, error } = await supabase
                    .from('gm_restaurants')
                    .select('fiscal_config')
                    .eq('id', restaurantId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.warn('[FiscalConfigAlert] Error checking config:', error);
                }

                // Se não há configuração, considerar não configurado
                setIsConfigured(data?.fiscal_config?.invoicexpress?.apiKey ? true : false);
            } catch (err) {
                console.error('[FiscalConfigAlert] Failed to check config:', err);
                setIsConfigured(false); // Assume não configurado em caso de erro
            } finally {
                setChecking(false);
            }
        };

        checkFiscalConfig();
    }, [restaurantId]);

    // Não mostrar nada se ainda está verificando ou se está configurado
    if (checking || isConfigured === null || isConfigured) {
        return null;
    }

    return (
        <div
            style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '14px',
                fontWeight: 500,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span>⚠️</span>
                <span>
                    <strong>Fiscal não configurado</strong> - Risco de multa. Configure credenciais fiscais nas configurações.
                </span>
            </div>
            <button
                onClick={() => {
                    // Navegar para settings (futuro)
                    window.location.href = '/app/settings?tab=fiscal';
                }}
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
            >
                Configurar
            </button>
        </div>
    );
};
