/**
 * Fiscal Print Button - Botão para imprimir recibo fiscal
 * 
 * Permite:
 * - Imprimir recibo fiscal após pagamento
 * - Reimprimir recibos anteriores
 * - Visualizar documento fiscal
 */

import React, { useState } from 'react';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Text } from '../../../ui/design-system/primitives/Text';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { getFiscalService } from '../../../core/fiscal/FiscalService';
import { FiscalPrinter } from '../../../core/fiscal/FiscalPrinter';
import { useToast } from '../../../ui/design-system';
import { supabase } from '../../../core/supabase';
import { FiscalReceiptPreview } from './FiscalReceiptPreview';
import type { TaxDocument } from '../../../../../fiscal-modules/types';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';

interface FiscalPrintButtonProps {
    orderId: string;
    restaurantId: string;
    orderTotal: number; // em centavos
    paymentMethod: string;
    onPrintComplete?: () => void;
}

export const FiscalPrintButton: React.FC<FiscalPrintButtonProps> = ({
    orderId,
    restaurantId,
    orderTotal,
    paymentMethod,
    onPrintComplete,
}) => {
    const [printing, setPrinting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [taxDocument, setTaxDocument] = useState<TaxDocument | null>(null);
    const [orderData, setOrderData] = useState<any>(null);
    const { success, error: showError } = useToast();

    const handlePrint = async () => {
        setPrinting(true);
        try {
            const fiscalService = getFiscalService();

            // 1. Buscar documento fiscal
            let fiscalDoc = await fiscalService.getFiscalDocument(orderId);

            // 2. Se não existe, adicionar à fila fiscal (backend processa)
            if (!fiscalDoc) {
                // TASK-2.1.2: Usar endpoint do backend em vez de chamar diretamente
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4320';
                const sessionToken = localStorage.getItem('chefiapp_session_token') ||
                    getTabIsolated('chefiapp_session_token');

                const response = await fetch(`${apiUrl}/api/fiscal/emit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-chefiapp-token': sessionToken || '',
                    },
                    body: JSON.stringify({
                        orderId,
                        restaurantId,
                        paymentMethod,
                        amountCents: orderTotal,
                        idempotencyKey: `fiscal:${orderId}:${Date.now()}`,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Falha ao adicionar à fila fiscal');
                }

                const result = await response.json();
                console.log('[FiscalPrintButton] Fiscal emission queued', result);

                // Aguardar um pouco para o worker processar (em produção, usar polling ou webhook)
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Buscar novamente após processar
                fiscalDoc = await fiscalService.getFiscalDocument(orderId);
            }

            if (!fiscalDoc) {
                throw new Error('Documento fiscal não encontrado');
            }

            // 3. Buscar dados do pedido
            const orderData = await fiscalService.getOrderData(orderId, restaurantId);
            if (!orderData) {
                throw new Error('Falha ao buscar dados do pedido');
            }

            // 4. Buscar dados do restaurante
            const { data: restaurant } = await supabase
                .from('gm_restaurants')
                .select('name, address, tax_registration_number')
                .eq('id', restaurantId)
                .single();

            // 5. Construir TaxDocument completo
            const payload = fiscalDoc.payload_sent as any;
            const taxDocument: TaxDocument = {
                doc_type: fiscalDoc.doc_type as any,
                ref_event_id: fiscalDoc.ref_event_id || orderId,
                ref_seal_id: fiscalDoc.ref_seal_id || orderId,
                total_amount: orderTotal / 100,
                taxes: {
                    vat: payload?.vat_amount || 0,
                },
                items: (payload?.items || []).map((item: any) => ({
                    code: item.product_id || item.code || 'N/A',
                    description: item.name || item.name_snapshot || item.description || 'Item',
                    quantity: item.quantity || 1,
                    unit_price: (item.price_snapshot || item.unit_price || item.price || 0) / 100,
                    total: ((item.price_snapshot || item.unit_price || item.price || 0) * (item.quantity || 1)) / 100,
                })),
                raw_payload: payload,
            };

            // 6. Preparar dados para preview/impressão
            const finalOrderData = {
                ...orderData,
                payment_method: paymentMethod,
                restaurant_name: restaurant?.name || 'Restaurante',
                restaurant_address: restaurant?.address || null,
                restaurant_nif: restaurant?.tax_registration_number || null,
            };

            // 7. Mostrar preview antes de imprimir
            setTaxDocument(taxDocument);
            setOrderData(finalOrderData);
            setShowPreview(true);
        } catch (err: any) {
            console.error('[FiscalPrintButton] Print failed:', err);
            showError(err.message || 'Erro ao imprimir recibo fiscal');
        } finally {
            setPrinting(false);
        }
    };

    const handlePrintFromPreview = async () => {
        if (!taxDocument || !orderData) return;

        try {
            const printer = new FiscalPrinter({ printerType: 'browser' });
            await printer.printReceipt(taxDocument, orderData);
            success('Recibo fiscal impresso');
            setShowPreview(false);
            onPrintComplete?.();
        } catch (err: any) {
            console.error('[FiscalPrintButton] Print from preview failed:', err);
            showError(err.message || 'Erro ao imprimir recibo fiscal');
        }
    };

    const pdfUrl = taxDocument?.raw_payload?.pdf_url || taxDocument?.raw_payload?.invoice?.pdf?.url;
    const printer = taxDocument && orderData ? new FiscalPrinter() : null;
    const qrCodeUrl = printer && taxDocument && orderData
        ? printer.generateQRCodeUrl(taxDocument, orderData)
        : null;

    return (
        <>
            <Button
                tone="action"
                size="lg"
                onClick={handlePrint}
                disabled={printing}
                style={{ width: '100%' }}
            >
                {printing ? 'Preparando...' : '🖨️ Imprimir Recibo Fiscal'}
            </Button>

            {showPreview && taxDocument && orderData && (
                <FiscalReceiptPreview
                    taxDoc={taxDocument}
                    orderData={orderData}
                    onPrint={handlePrintFromPreview}
                    onClose={() => setShowPreview(false)}
                    pdfUrl={pdfUrl || undefined}
                    qrCodeUrl={qrCodeUrl || undefined}
                />
            )}
        </>
    );
};
