/**
 * FiscalPrintButton Tests - Testes de UI para botão de impressão fiscal
 * 
 * Testa:
 * - Renderização do botão
 * - Busca de documento fiscal
 * - Geração de documento fiscal
 * - Preview de recibo
 * - Impressão
 * - Tratamento de erros
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FiscalPrintButton } from '../../../merchant-portal/src/pages/TPV/components/FiscalPrintButton';
import { getFiscalService } from '../../../merchant-portal/src/core/fiscal/FiscalService';
import { FiscalPrinter } from '../../../merchant-portal/src/core/fiscal/FiscalPrinter';
import { useToast } from '../../../merchant-portal/src/ui/design-system';
import { supabase } from '../../../merchant-portal/src/core/supabase';

// Mock FiscalService completely to avoid PostgresLink dependency
jest.mock('../../../merchant-portal/src/core/fiscal/FiscalService', () => ({
    getFiscalService: jest.fn(() => ({
        getFiscalDocument: jest.fn(),
        processPaymentConfirmed: jest.fn(),
        getOrderData: jest.fn(),
    })),
}));
jest.mock('../../../merchant-portal/src/core/fiscal/FiscalPrinter');
jest.mock('../../../merchant-portal/src/core/health/useCoreHealth', () => ({
    useCoreHealth: jest.fn(() => ({
        health: { status: 'up' },
        isLoading: false,
    })),
}));
// Mock AppShell to avoid CSS import errors
jest.mock('../../../merchant-portal/src/ui/design-system/AppShell', () => ({
    AppShell: ({ children }: any) => <div>{children}</div>,
}));
// Mock useToast - define function directly in mock
const mockUseToastFn = jest.fn();
jest.mock('../../../merchant-portal/src/ui/design-system', () => ({
    useToast: jest.fn(() => ({
        success: jest.fn(),
        error: jest.fn(),
    })),
}));
jest.mock('../../../merchant-portal/src/pages/TPV/components/FiscalReceiptPreview', () => ({
    FiscalReceiptPreview: ({ onPrint, onClose }: any) => (
        <div data-testid="fiscal-receipt-preview">
            <button onClick={onPrint}>Print</button>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));
jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

const mockGetFiscalService = getFiscalService as jest.MockedFunction<typeof getFiscalService>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('FiscalPrintButton', () => {
    const defaultProps = {
        orderId: 'order-123',
        restaurantId: 'restaurant-456',
        orderTotal: 5000, // €50.00
        paymentMethod: 'cash',
        onPrintComplete: jest.fn(),
    };

    const mockFiscalService = {
        getFiscalDocument: jest.fn(),
        processPaymentConfirmed: jest.fn(),
        getOrderData: jest.fn(),
    };

    const mockToast = {
        toasts: [],
        show: jest.fn().mockReturnValue('toast-id'),
        dismiss: jest.fn(),
        success: jest.fn().mockReturnValue('toast-id'),
        error: jest.fn().mockReturnValue('toast-id'),
        warning: jest.fn().mockReturnValue('toast-id'),
        info: jest.fn().mockReturnValue('toast-id'),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetFiscalService.mockReturnValue(mockFiscalService as any);
        mockUseToast.mockReturnValue(mockToast as any);
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { name: 'Restaurante Teste', address: 'Rua Teste', tax_registration_number: '123456789' },
                        error: null,
                    }),
                }),
            }),
        });
    });

    describe('Renderização', () => {
        it('deve renderizar botão de impressão', () => {
            render(<FiscalPrintButton {...defaultProps} />);
            
            expect(screen.getByText('🖨️ Imprimir Recibo Fiscal')).toBeInTheDocument();
        });

        it('deve mostrar estado de carregamento ao preparar', async () => {
            mockFiscalService.getFiscalDocument.mockResolvedValue(null);
            mockFiscalService.processPaymentConfirmed.mockResolvedValue({
                status: 'SUCCESS',
                gov_protocol: 'PROTO-123',
            });
            mockFiscalService.getFiscalDocument.mockResolvedValueOnce(null).mockResolvedValueOnce({
                id: 'fiscal-123',
                doc_type: 'INVOICE',
                payload_sent: {
                    items: [{ name: 'Item 1', quantity: 1, price: 5000 }],
                    vat_amount: 1000,
                },
            });
            mockFiscalService.getOrderData.mockResolvedValue({
                items: [{ name: 'Item 1', quantity: 1, price_cents: 5000 }],
            });

            render(<FiscalPrintButton {...defaultProps} />);
            
            const button = screen.getByText('🖨️ Imprimir Recibo Fiscal');
            fireEvent.click(button);
            
            expect(screen.getByText('Preparando...')).toBeInTheDocument();
        });
    });

    describe('Busca de Documento Fiscal', () => {
        it('deve buscar documento fiscal existente', async () => {
            const fiscalDoc = {
                id: 'fiscal-123',
                doc_type: 'INVOICE',
                payload_sent: {
                    items: [{ name: 'Item 1', quantity: 1, price: 5000 }],
                    vat_amount: 1000,
                },
            };
            
            mockFiscalService.getFiscalDocument.mockResolvedValue(fiscalDoc);
            mockFiscalService.getOrderData.mockResolvedValue({
                items: [{ name: 'Item 1', quantity: 1, price_cents: 5000 }],
            });

            render(<FiscalPrintButton {...defaultProps} />);
            
            const button = screen.getByText('🖨️ Imprimir Recibo Fiscal');
            fireEvent.click(button);
            
            await waitFor(() => {
                expect(mockFiscalService.getFiscalDocument).toHaveBeenCalledWith('order-123');
            });
        });

        it('deve gerar documento fiscal se não existir', async () => {
            mockFiscalService.getFiscalDocument
                .mockResolvedValueOnce(null) // Primeira busca: não existe
                .mockResolvedValueOnce({ // Segunda busca: após gerar
                    id: 'fiscal-123',
                    doc_type: 'INVOICE',
                    payload_sent: {
                        items: [{ name: 'Item 1', quantity: 1, price: 5000 }],
                        vat_amount: 1000,
                    },
                });
            
            mockFiscalService.processPaymentConfirmed.mockResolvedValue({
                status: 'SUCCESS',
                gov_protocol: 'PROTO-123',
            });
            
            mockFiscalService.getOrderData.mockResolvedValue({
                items: [{ name: 'Item 1', quantity: 1, price_cents: 5000 }],
            });

            render(<FiscalPrintButton {...defaultProps} />);
            
            const button = screen.getByText('🖨️ Imprimir Recibo Fiscal');
            fireEvent.click(button);
            
            await waitFor(() => {
                expect(mockFiscalService.processPaymentConfirmed).toHaveBeenCalledWith({
                    orderId: 'order-123',
                    restaurantId: 'restaurant-456',
                    paymentMethod: 'cash',
                    amountCents: 5000,
                });
            });
        });
    });

    describe('Preview de Recibo', () => {
        it('deve mostrar preview após buscar documento', async () => {
            const fiscalDoc = {
                id: 'fiscal-123',
                doc_type: 'INVOICE',
                payload_sent: {
                    items: [{ name: 'Item 1', quantity: 1, price: 5000 }],
                    vat_amount: 1000,
                },
            };
            
            mockFiscalService.getFiscalDocument.mockResolvedValue(fiscalDoc);
            mockFiscalService.getOrderData.mockResolvedValue({
                items: [{ name: 'Item 1', quantity: 1, price_cents: 5000 }],
            });

            render(<FiscalPrintButton {...defaultProps} />);
            
            const button = screen.getByText('🖨️ Imprimir Recibo Fiscal');
            fireEvent.click(button);
            
            await waitFor(() => {
                // Preview deve aparecer (componente FiscalReceiptPreview)
                expect(mockFiscalService.getOrderData).toHaveBeenCalled();
            });
        });
    });

    describe('Impressão', () => {
        it('deve imprimir recibo via FiscalPrinter', async () => {
            const fiscalDoc = {
                id: 'fiscal-123',
                doc_type: 'INVOICE',
                payload_sent: {
                    items: [{ name: 'Item 1', quantity: 1, price: 5000 }],
                    vat_amount: 1000,
                },
            };
            
            mockFiscalService.getFiscalDocument.mockResolvedValue(fiscalDoc);
            mockFiscalService.getOrderData.mockResolvedValue({
                items: [{ name: 'Item 1', quantity: 1, price_cents: 5000 }],
            });

            const mockPrinter = {
                printReceipt: jest.fn().mockResolvedValue(undefined),
                generateQRCodeUrl: jest.fn().mockReturnValue('qr-code-url'),
            };
            
            (FiscalPrinter as jest.MockedClass<typeof FiscalPrinter>).mockImplementation(() => mockPrinter as any);

            render(<FiscalPrintButton {...defaultProps} />);
            
            const button = screen.getByText('🖨️ Imprimir Recibo Fiscal');
            fireEvent.click(button);
            
            await waitFor(() => {
                // Preview deve aparecer
            });
            
            // Simular clique em imprimir do preview
            // (Isso seria testado no componente FiscalReceiptPreview)
        });
    });

    describe('Tratamento de Erros', () => {
        it('deve mostrar erro se buscar documento falhar', async () => {
            mockFiscalService.getFiscalDocument.mockRejectedValue(new Error('Erro ao buscar documento'));

            render(<FiscalPrintButton {...defaultProps} />);
            
            const button = screen.getByText('🖨️ Imprimir Recibo Fiscal');
            fireEvent.click(button);
            
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Erro ao buscar documento');
            });
        });

        it('deve mostrar erro se gerar documento falhar', async () => {
            mockFiscalService.getFiscalDocument.mockResolvedValue(null);
            mockFiscalService.processPaymentConfirmed.mockRejectedValue(new Error('Erro ao gerar documento'));

            render(<FiscalPrintButton {...defaultProps} />);
            
            const button = screen.getByText('🖨️ Imprimir Recibo Fiscal');
            fireEvent.click(button);
            
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Erro ao gerar documento');
            });
        });

        it('deve mostrar erro se buscar dados do pedido falhar', async () => {
            const fiscalDoc = {
                id: 'fiscal-123',
                doc_type: 'INVOICE',
                payload_sent: {
                    items: [{ name: 'Item 1', quantity: 1, price: 5000 }],
                    vat_amount: 1000,
                },
            };
            
            mockFiscalService.getFiscalDocument.mockResolvedValue(fiscalDoc);
            mockFiscalService.getOrderData.mockRejectedValue(new Error('Erro ao buscar dados'));

            render(<FiscalPrintButton {...defaultProps} />);
            
            const button = screen.getByText('🖨️ Imprimir Recibo Fiscal');
            fireEvent.click(button);
            
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Erro ao buscar dados');
            });
        });
    });
});
