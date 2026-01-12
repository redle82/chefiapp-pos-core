/**
 * Fiscal Receipt Preview - Preview do recibo fiscal antes de imprimir
 * 
 * Permite:
 * - Visualizar recibo antes de imprimir
 * - Download PDF
 * - Imprimir diretamente
 * - Ver QR Code (se disponível)
 */

import React, { useState } from 'react';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { useToast } from '../../../ui/design-system';
import type { TaxDocument } from '../../../../../fiscal-modules/types';

interface FiscalReceiptPreviewProps {
    taxDoc: TaxDocument;
    orderData: any;
    onPrint: () => void;
    onClose: () => void;
    pdfUrl?: string;
    qrCodeUrl?: string;
}

export const FiscalReceiptPreview: React.FC<FiscalReceiptPreviewProps> = ({
    taxDoc,
    orderData,
    onPrint,
    onClose,
    pdfUrl,
    qrCodeUrl,
}) => {
    const { success, error: showError } = useToast();
    const [downloading, setDownloading] = useState(false);

    const handleDownloadPDF = async () => {
        if (!pdfUrl) {
            showError('PDF não disponível');
            return;
        }

        setDownloading(true);
        try {
            const response = await fetch(pdfUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recibo-fiscal-${orderData.id || 'N/A'}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            success('PDF baixado com sucesso');
        } catch (err: any) {
            console.error('[FiscalReceiptPreview] Download failed:', err);
            showError('Erro ao baixar PDF: ' + (err.message || 'Unknown error'));
        } finally {
            setDownloading(false);
        }
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const vatRate = taxDoc.doc_type === 'SAF-T' || taxDoc.doc_type === 'MOCK' ? 23 : 21;
    const vatAmount = taxDoc.taxes.vat || 0;
    const subtotal = taxDoc.total_amount - vatAmount;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
        }}>
            <Card surface="base" padding="xl" style={{
                maxWidth: '400px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
            }}>
                <div style={{ marginBottom: 16 }}>
                    <Text size="lg" weight="bold">Preview do Recibo Fiscal</Text>
                </div>

                {/* Preview do Recibo (80mm) */}
                <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: '12px',
                    lineHeight: 1.4,
                    maxWidth: '70mm',
                    margin: '0 auto',
                    padding: '10mm',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                }}>
                    {/* Header */}
                    <div style={{
                        textAlign: 'center',
                        borderBottom: '1px dashed #000',
                        paddingBottom: 10,
                        marginBottom: 10,
                    }}>
                        <div style={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                            marginBottom: 5,
                        }}>
                            {orderData.restaurant_name || 'RESTAURANTE'}
                        </div>
                        <div style={{ fontSize: '10px', marginTop: 5 }}>
                            {taxDoc.doc_type === 'TICKETBAI' ? 'TICKETBAI' : 
                             taxDoc.doc_type === 'SAF-T' ? 'SAF-T' : 'RECIBO FISCAL'}
                        </div>
                        <div style={{ fontSize: '10px', marginTop: 5 }}>
                            Pedido: {orderData.short_id || orderData.id?.substring(0, 8) || 'N/A'}
                        </div>
                        <div style={{ fontSize: '10px', marginTop: 5 }}>
                            {dateStr} {timeStr}
                        </div>
                    </div>

                    {/* Items */}
                    <div style={{ margin: '15px 0' }}>
                        {taxDoc.items.map((item: TaxDocument['items'][0], idx: number) => (
                            <div key={idx} style={{
                                marginBottom: 8,
                                paddingBottom: 5,
                                borderBottom: '1px dotted #ccc',
                            }}>
                                <div style={{ fontWeight: 'bold' }}>
                                    {item.description}
                                </div>
                                <div style={{ fontSize: '10px', color: '#666', marginTop: 2 }}>
                                    {item.quantity}x {item.unit_price.toFixed(2)}€ = {item.total.toFixed(2)}€
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div style={{
                        marginTop: 15,
                        borderTop: '1px dashed #000',
                        paddingTop: 10,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span>Subtotal:</span>
                            <span>{subtotal.toFixed(2)}€</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span>IVA ({vatRate}%):</span>
                            <span>{vatAmount.toFixed(2)}€</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            borderTop: '2px solid #000',
                            paddingTop: 5,
                            marginTop: 5,
                        }}>
                            <span>TOTAL:</span>
                            <span>{taxDoc.total_amount.toFixed(2)}€</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        marginTop: 20,
                        textAlign: 'center',
                        fontSize: '9px',
                        borderTop: '1px dashed #000',
                        paddingTop: 10,
                    }}>
                        <div>Método de Pagamento: {orderData.payment_method || 'N/A'}</div>
                        {taxDoc.raw_payload?.gov_protocol && (
                            <div style={{ fontWeight: 'bold', marginTop: 5 }}>
                                Protocolo: {taxDoc.raw_payload.gov_protocol}
                            </div>
                        )}
                        {qrCodeUrl && (
                            <div style={{ marginTop: 10 }}>
                                <img 
                                    src={qrCodeUrl} 
                                    alt="QR Code" 
                                    style={{ width: '80px', height: '80px' }}
                                />
                            </div>
                        )}
                        <div style={{ marginTop: 10 }}>
                            Obrigado pela sua visita!
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 16,
                    flexWrap: 'wrap',
                }}>
                    <Button
                        variant="primary"
                        onClick={onPrint}
                        style={{ flex: 1, minWidth: '120px' }}
                    >
                        🖨️ Imprimir
                    </Button>
                    {pdfUrl && (
                        <Button
                            variant="outline"
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            style={{ flex: 1, minWidth: '120px' }}
                        >
                            {downloading ? 'Baixando...' : '📥 Download PDF'}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        style={{ flex: 1, minWidth: '120px' }}
                    >
                        Fechar
                    </Button>
                </div>
            </Card>
        </div>
    );
};
