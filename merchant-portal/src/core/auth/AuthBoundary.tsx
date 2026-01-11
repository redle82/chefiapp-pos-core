import React from 'react';
import { useAuthStateMachine } from './useAuthStateMachine';
import { EmptyState } from '../../ui/design-system/EmptyState';
// import { InlineAlert } from '../../ui/design-system'; // Optional if needed

/**
 * @deprecated Use RequireAuth instead
 * 
 * This component uses the legacy useAuthStateMachine system.
 * All routes should use RequireAuth which uses Supabase Auth.
 * 
 * See: docs/AUTH_UNIFICATION_PLAN.md
 */
interface AuthBoundaryProps {
    children: React.ReactNode;
}

export const AuthBoundary: React.FC<AuthBoundaryProps> = ({ children }) => {
    const { state, reason, logout } = useAuthStateMachine();

    if (state === 'AUTHING') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-white"></div>
                    <span className="text-xs uppercase tracking-widest opacity-50">Verificando Identidade...</span>
                </div>
            </div>
        );
    }

    if (state === 'UNAUTH' || state === 'EXPIRED') {
        const isExpired = state === 'EXPIRED';
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <EmptyState
                        title={isExpired ? "Sessão Expirada" : "Acesso Restrito"}
                        description={reason || "Faça login para continuar."}
                        icon={isExpired ? "🔒" : "🛡️"}
                        action={{
                            label: "Ir para Login",
                            onClick: () => window.location.href = '/start'
                        }}
                    />
                    {isExpired && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={logout}
                                className="text-xs text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
                            >
                                Limpar Sessão
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // DEGRADED (Demo) allows render but might show a banner (handled inside app layout normally)
    // AUTHED allows render

    return <>{children}</>;
};
