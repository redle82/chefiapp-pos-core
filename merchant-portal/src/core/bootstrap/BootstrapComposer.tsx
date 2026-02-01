import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { WebCoreProvider } from '../useWebCore'
import { ProductProvider } from '../../cinematic/context/ProductContext'
// FASE 3.4: BootstrapComposer é legado - OrderProvider movido para OrderContextReal
// Por enquanto, comentado para não quebrar se ainda for usado
// import { OrderProvider } from '../../pages/TPV/context/OrderContextReal'
import { StaffProvider } from '../../pages/AppStaff/context/StaffContext'
// REMOVIDO: InventoryReflexProvider foi removido na refatoração Fase 1-2
import { OnboardingEngineProvider } from '../../cinematic/context/OnboardingEngineProvider'
import { AutopilotProvider } from '../../cinematic/context/AutopilotContext'
import { InventoryReflexBridge } from '../../intelligence/nervous-system/InventoryReflexBridge'
import { SubconsciousVisuals } from '../../intelligence/nervous-system/SubconsciousVisuals'
import { Kernel, SystemLayer } from './CoreKernel'
import { PaymentGuard } from '../billing/PaymentGuard'

// 🏛️ LAYER GATE: The Guardian of Order
const LayerGate = ({ layer, children, name }: { layer: SystemLayer, children: ReactNode, name: string }) => {
    const [stable, setStable] = useState(false);

    useEffect(() => {
        // 1. Mount Phase: We exist.
        Kernel.signal(layer, 'mounting');

        // 2. Stability Phase: We are ready.
        // In a real system, we might wait for async checks here.
        // For now, React Mount = Stability.
        Kernel.signal(layer, 'stable');
        setStable(true);

        return () => Kernel.signal(layer, 'void');
    }, [layer]);

    if (!stable) {
        // ⏳ Render nothing until this layer is stable.
        // This enforces the "Time-Domain Layering" (Cascade).
        return (
            <div style={{ padding: 20, color: '#666', fontFamily: 'monospace', fontSize: 10 }}>
                [System] Mounting L{layer}: {name}...
            </div>
        );
    }

    return <>{children}</>;
}

// Layer L2: Core Kernel (Bootstrap)
const CoreLayer = ({ children }: { children: ReactNode }) => (
    <WebCoreProvider>
        <OnboardingEngineProvider>
            {children}
        </OnboardingEngineProvider>
    </WebCoreProvider>
)

// Layer L3: World (Orientation)
// Now explicit! Wraps the App in the Router.
const WorldLayer = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
        {children}
    </BrowserRouter>
)

// Layer L4: Truth (Data State)
// FASE 3.4: OrderProvider removido - BootstrapComposer é legado e não é usado
const DataLayer = ({ children }: { children: ReactNode }) => (
    <ProductProvider>
        {/* OrderProvider removido - usar OrderContextReal em AppDomainWrapper se necessário */}
        {children}
    </ProductProvider>
)

// Layer L5: Agency (Operation & Identity)
const LogicLayer = ({ children }: { children: ReactNode }) => (
    <StaffProvider>
        {children}
    </StaffProvider>
)

// Layer L6: Intelligence (Nervous System)
// REMOVIDO: InventoryReflexProvider foi removido na refatoração Fase 1-2
const IntelligenceLayer = ({ children }: { children: ReactNode }) => (
    <AutopilotProvider>
        <InventoryReflexBridge />
        <SubconsciousVisuals />
        {children}
    </AutopilotProvider>
)

export const BootstrapComposer = ({ children }: { children: ReactNode }) => {
    // 🎼 The Symphony of Existence
    return (
        <LayerGate layer={SystemLayer.L2_KERNEL} name="Kernel">
            <CoreLayer>
                <LayerGate layer={SystemLayer.L3_WORLD} name="World">
                    <WorldLayer>
                        <LayerGate layer={SystemLayer.L4_TRUTH} name="Truth">
                            <PaymentGuard>
                                <DataLayer>
                                    <LayerGate layer={SystemLayer.L5_AGENCY} name="Agency">
                                        <LogicLayer>
                                            <LayerGate layer={SystemLayer.L6_INTELLIGENCE} name="Intelligence">
                                                <IntelligenceLayer>
                                                    {children}
                                                </IntelligenceLayer>
                                            </LayerGate>
                                        </LogicLayer>
                                    </LayerGate>
                                </DataLayer>
                            </PaymentGuard>
                        </LayerGate>
                    </WorldLayer>
                </LayerGate>
            </CoreLayer>
        </LayerGate>
    )
}
