import { PaymentGatewayAdapter } from "./PaymentGatewayAdapter";
import { LocalMockGateway } from "./LocalMockGateway";

export class GatewayRegistry {
    private static instance: GatewayRegistry;
    private gateways: Map<string, PaymentGatewayAdapter> = new Map();

    private constructor() {
        // Register default gateways
        this.register(new LocalMockGateway());
    }

    public static getInstance(): GatewayRegistry {
        if (!GatewayRegistry.instance) {
            GatewayRegistry.instance = new GatewayRegistry();
        }
        return GatewayRegistry.instance;
    }

    public register(gateway: PaymentGatewayAdapter): void {
        this.gateways.set(gateway.providerId, gateway);
    }

    public get(providerId: string): PaymentGatewayAdapter {
        const gateway = this.gateways.get(providerId);
        if (!gateway) {
            throw new Error(`Gateway Provider not found: ${providerId}`);
        }
        return gateway;
    }

    public listProviders(): string[] {
        return Array.from(this.gateways.keys());
    }
}
