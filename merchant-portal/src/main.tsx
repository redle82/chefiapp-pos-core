import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { ErrorBoundary } from './ui/design-system/ErrorBoundary'
import { Logger } from './core/logger/Logger'
import { performanceMonitor } from './core/monitoring/performanceMonitor'

// Initialize monitoring
Logger.info('Application starting', {
  version: '1.0.0',
  environment: import.meta.env.MODE,
});

// Measure app initialization
const startTime = performance.now();
try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary context="Root">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  );

  const initDuration = performance.now() - startTime;
  performanceMonitor.recordMetric({
    name: 'app_init',
    value: initDuration,
    unit: 'ms',
    timestamp: new Date().toISOString(),
  });

} catch (error: any) {
  Logger.critical('Application initialization failed', error);
  throw error;
}
