import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { TenantKernel } from '../../../../core-engine/kernel/TenantKernel';
// import { PostgresEventStore } from '../../../../core-engine/persistence/PostgresEventStore'; // REMOVED: Incompatible with Browser (pg)
import { BrowserEventStore } from './BrowserEventStore';
import { Logger } from '../logger';
import { isDevStableMode } from '../runtime/devStableMode';
import { isTenantSealed } from '../tenant/TenantResolver';

interface KernelContextType {
    kernel: TenantKernel | null;
    isBooting: boolean;
    error: Error | null;
}

const KernelContext = createContext<KernelContextType | undefined>(undefined);

export function useKernel() {
    const context = useContext(KernelContext);
    if (!context) {
        // Transitional: allow undefined if kernel not ready?? 
        // No, strict mode.
        throw new Error('useKernel must be used within a KernelProvider');
    }
    return context;
}

interface KernelProviderProps {
    tenantId: string;
    children: React.ReactNode;
}

export function KernelProvider({ tenantId, children }: KernelProviderProps) {
    const [kernel, setKernel] = useState<TenantKernel | null>(null);
    const [isBooting, setIsBooting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const kernelRef = useRef<TenantKernel | null>(null);
    const loggedSkipRef = useRef(false);

    useEffect(() => {
        if (!tenantId) return;

        // Prevent rebooting same tenant
        if (kernelRef.current?.tenantId === tenantId) return;

        const bootKernel = async () => {
            try {
                // 🛑 KERNEL FUSE: Do not boot if no tenantId
                if (!tenantId) {
                    Logger.warn('[KernelProvider] 🛑 Fuse: Boot prevented (No TenantId)');
                    return;
                }

                // 🔒 HARD-STOP: Kernel must never boot without a sealed tenant (INCIDENT #004)
                if (!isTenantSealed()) {
                    if (isDevStableMode() && !loggedSkipRef.current) {
                        loggedSkipRef.current = true;
                        console.info('[KernelProvider] Boot skipped: tenant not sealed');
                    }
                    return;
                }

                Logger.info('[KernelProvider] Booting Kernel...', { tenantId });
                setIsBooting(true);
                setError(null);

                // 1. Initialize Event Store (Browser Compatible)
                // Replaced PostgresEventStore with BrowserEventStore (IndexedDB)
                const eventStore = new BrowserEventStore(tenantId);

                // 2. Initialize Kernel
                const newKernel = new TenantKernel(
                    { tenantId, debugMode: import.meta.env.DEV },
                    eventStore
                );

                // 3. Boot (Hydrate)
                await newKernel.boot();

                kernelRef.current = newKernel;
                setKernel(newKernel);
                Logger.info('[KernelProvider] Kernel Booted Successfully', { executionId: newKernel.executionId });
            } catch (err: any) {
                Logger.critical('[KernelProvider] Boot Failed', err);
                setError(err);
            } finally {
                setIsBooting(false);
            }
        };

        bootKernel();

        return () => {
            // Cleanup if needed (unmount)
            // Kernel doesn't have 'shutdown' yet but we could implement it.
            kernelRef.current = null;
        };
    }, [tenantId]);

    // Error Boundary inside Context
    if (error) {
        return (
            <div className="p-4 bg-red-900 text-white rounded">
                <h3 className="font-bold">SYSTEM ERROR: Kernel Panic</h3>
                <p>{error.message}</p>
            </div>
        );
    }

    return (
        <KernelContext.Provider value={{ kernel, isBooting, error }}>
            {children}
        </KernelContext.Provider>
    );
}
