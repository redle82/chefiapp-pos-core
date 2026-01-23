/**
 * ErrorBoundary Component
 * 
 * Catches React errors and sends them to Sentry
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { logError } from '@/services/logging';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Sentry
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Also send to Sentry directly for additional context
    if (Sentry.getCurrentHub().getClient()) {
      Sentry.withScope((scope) => {
        scope.setContext('errorBoundary', {
          componentStack: errorInfo.componentStack,
        });
        Sentry.captureException(error);
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Algo deu errado</Text>
            <Text style={styles.message}>
              Ocorreu um erro inesperado. O erro foi registrado e será investigado.
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={styles.errorText}>
                {this.state.error.toString()}
              </Text>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginBottom: 24,
    fontFamily: 'monospace',
    textAlign: 'left',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
