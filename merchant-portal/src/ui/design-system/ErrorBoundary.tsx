import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';
import { Logger, captureException, Sentry } from '../../core/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    context?: string; // e.g. "TPV", "Kitchen", "Root"
}

interface State {
    hasError: boolean;
    error: Error | null;
    eventId: string | null;
}

/**
 * ErrorBoundary - The Safety Net (Layer 4)
 * 
 * Prevents the "White Screen of Death". 
 * Captures errors to Sentry for monitoring.
 * Adheres to CANON Law 1: Tool Sovereignty (Maintain control).
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        eventId: null,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('💥 Uncaught error:', error, errorInfo);

        // H.3 Observability: Centralized Logging + Sentry
        Logger.critical('Uncaught Error in Boundary', error, {
            context: this.props.context || 'Global',
            componentStack: errorInfo.componentStack
        });

        // Send to Sentry with full context
        Sentry.withScope((scope) => {
            scope.setTag('boundary_context', this.props.context || 'Global');
            scope.setContext('react_error_info', {
                componentStack: errorInfo.componentStack,
            });
            const eventId = Sentry.captureException(error);
            this.setState({ eventId });
        });
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div style={{
                    padding: 40,
                    textAlign: 'center',
                    fontFamily: 'system-ui',
                    color: '#F87171', // Red-400
                    background: '#1F2937', // Gray-800
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16
                }}>
                    <h2 style={{ margin: 0, fontSize: 24, color: '#FFF' }}>
                        Ocorreu um erro
                    </h2>
                    <p style={{ opacity: 0.8, maxWidth: 400 }}>
                        {this.props.context ? `Problema no módulo ${this.props.context}` : 'O sistema encontrou um problema inesperado.'}
                    </p>

                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: 12,
                        borderRadius: 8,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        maxWidth: '90%',
                        overflow: 'auto'
                    }}>
                        {this.state.error?.message || 'Erro desconhecido'}
                    </div>

                    <Button variant="primary" onClick={this.handleReload}>
                        Tentar Novamente
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
