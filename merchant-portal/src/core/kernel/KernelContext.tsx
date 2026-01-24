import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { TenantKernel } from '../../../../core-engine/kernel/TenantKernel';
// import { PostgresEventStore } from '../../../../core-engine/persistence/PostgresEventStore'; // REMOVED: Incompatible with Browser (pg)
import { BrowserEventStore } from './BrowserEventStore';
import { Logger } from '../logger';
import { isDevStableMode } from '../runtime/devStableMode';
import { isTenantSealedFor } from '../tenant/TenantResolver';
import type { TransitionRequest, TransitionResult } from '../../../../core-engine/executor/CoreExecutor';

// STEP 7: Status explícito do Kernel
type KernelStatus = 'BOOTING' | 'READY' | 'FROZEN' | 'FAILED';

interface KernelContextType {
    kernel: TenantKernel | null;
    status: KernelStatus;  // NOVO: estado explícito
    isReady: boolean;      // NOVO: status === 'READY'
    isBooting: boolean;     // Mantido para compatibilidade
    error: Error | null;
    // STEP 7: Wrapper fail-closed para kernel.execute()
    // Aceita campos extras além de TransitionRequest (como restaurantId, items, etc.)
    executeSafe: (request: Omit<TransitionRequest, "tenantId"> & Record<string, any>) => Promise<{ ok: boolean; result?: TransitionResult; reason?: string; error?: any }>;
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
    const [status, setStatus] = useState<KernelStatus>('BOOTING');
    const [isBooting, setIsBooting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const kernelRef = useRef<TenantKernel | null>(null);
    const loggedSkipRef = useRef(false);
    
    // STEP 7: isReady é derivado de status
    const isReady = status === 'READY';

    useEffect(() => {
        if (!tenantId) {
            setStatus('FAILED');
            return;
        }

        // Prevent rebooting same tenant
        if (kernelRef.current?.tenantId === tenantId) return;

        const bootKernel = async () => {
            try {
                // STEP 7: DEV_STABLE_MODE = Kernel FROZEN (não boota)
                if (isDevStableMode()) {
                    setStatus('FROZEN');
                    if (!loggedSkipRef.current) {
                        loggedSkipRef.current = true;
                        // Log apenas uma vez, silencioso
                        if (import.meta.env.DEV) {
                            console.info('[KernelProvider] Kernel FROZEN: DEV_STABLE_MODE');
                        }
                    }
                    return;
                }

                // STEP 7: Se tenant não selado, não boota (hard-stop)
                if (!isTenantSealedFor(tenantId)) {
                    if (isDevStableMode()) {
                        if (!loggedSkipRef.current) {
                            loggedSkipRef.current = true;
                            console.info('[KernelProvider] Boot skipped: tenant not sealed');
                        }
                    } else {
                        // Non-stable: still fail-closed
                        if (!loggedSkipRef.current) {
                            loggedSkipRef.current = true;
                            Logger.warn('[KernelProvider] Boot prevented: tenant not sealed');
                        }
                    }
                    setStatus('FAILED');
                    return;
                }

                // STEP 7: Se bootando
                setStatus('BOOTING');
                setIsBooting(true);
                setError(null);

                Logger.info('[KernelProvider] Booting Kernel...', { tenantId });

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
                
                // STEP 7: Após boot bem-sucedido
                setStatus('READY');
                Logger.info('[KernelProvider] Kernel Booted Successfully', { executionId: newKernel.executionId });
            } catch (err: any) {
                // STEP 7: Boot falhou
                setStatus('FAILED');
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
    
    // STEP 7: Wrapper fail-closed para kernel.execute()
    // Aceita campos extras além de TransitionRequest (como restaurantId, items, etc.)
    const executeSafe = useCallback(async (request: Omit<TransitionRequest, "tenantId"> & Record<string, any>) => {
        if (status !== 'READY' || !kernel) {
            return {
                ok: false,
                reason: status === 'FROZEN' ? 'KERNEL_FROZEN' 
                     : status === 'BOOTING' ? 'KERNEL_BOOTING'
                     : status === 'FAILED' ? 'KERNEL_FAILED'
                     : 'KERNEL_NOT_READY'
            };
        }
        
        try {
            const result = await kernel.execute(request);
            return { ok: true, result };
        } catch (err) {
            // STEP 7: Kernel nunca lança exceção para fora - captura interna
            return { ok: false, reason: 'KERNEL_EXECUTION_ERROR', error: err };
        }
    }, [status, kernel]);

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
        <KernelContext.Provider value={{ 
            kernel, 
            status, 
            isReady, 
            isBooting, 
            error,
            executeSafe  // STEP 7: método fail-closed
        }}>
            {children}
        </KernelContext.Provider>
    );
}
