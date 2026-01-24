import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError, Sentry } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Customer Portal Safety Net
 * 
 * Prevents white screen of death for customers.
 * Captures errors to Sentry.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Customer Portal Error:', error, errorInfo);
    
    logError(error, {
      componentStack: errorInfo.componentStack,
      source: 'ErrorBoundary',
    });

    // Send to Sentry with component stack
    Sentry.withScope((scope) => {
      scope.setContext('react_error_info', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Ops! Algo deu errado
            </h1>
            <p className="text-gray-600 mb-6">
              Desculpe pelo inconveniente. Estamos trabalhando para resolver.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
