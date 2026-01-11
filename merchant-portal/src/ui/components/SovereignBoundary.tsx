import React, { Component, ErrorInfo, ReactNode } from 'react';
import { OSCopy } from '../design-system/sovereign/OSCopy';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class SovereignBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Sovereign Boundary caught an error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    backgroundColor: '#0F172A', // Slate 900
                    color: '#E2E8F0', // Slate 200
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 600 }}>
                        {OSCopy.error?.title || 'Serviço Indisponível'}
                    </h1>
                    <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                        {OSCopy.error?.description || 'O sistema de pedidos está temporariamente fora do ar.'}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
