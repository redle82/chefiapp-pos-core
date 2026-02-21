// import { describe, it, expect } from 'vitest'; // Jest globals are automatic
import { FiscalPrinter } from '../../src/core/fiscal/FiscalPrinter';

describe('FiscalPrinter: Kitchen Ticket', () => {
    // Hack to access private method for testing
    // In real app, we might export it or make it public, but for test we can cast to any
    const printer = new FiscalPrinter() as any;

    it('SHOULD generate STANDARD ticket for POS orders', () => {
        const order = {
            id: '12345678-uuid',
            tableNumber: 10,
            items: [
                { quantity: 2, name: 'Burger', notes: 'No Onion' }
            ],
            notes: 'Allergy'
        };

        const html = printer.generateKitchenTicketHTML(order);

        expect(html).toContain('<div class="title">COZINHA</div>');
        expect(html).toContain('Mesa: 10');
        expect(html).not.toContain('class="delivery-provider"');
    });

    it('SHOULD generate DELIVERY ticket when metadata is present', () => {
        const order = {
            id: '87654321-uuid',
            tableNumber: 'DELIVERY-XXXX',
            items: [
                { quantity: 1, name: 'Pizza' }
            ],
            deliveryMetadata: {
                provider: 'glovo',
                customerName: 'John Doe',
                orderCode: 'ABC-123'
            }
        };

        const html = printer.generateKitchenTicketHTML(order);

        expect(html).toContain('GLOVO'); // Uppercased via style/logic
        expect(html).toContain('John Doe'); // Customer Name
        expect(html).toContain('#C-123'); // Slice -5
        expect(html).not.toContain('Mesa:'); // Should hide standard headers
        expect(html).toContain('delivery-provider'); // CSS Class check
    });
});
