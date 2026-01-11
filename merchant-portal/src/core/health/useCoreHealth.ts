import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchHealth } from '../health'
import { getTabIsolated } from '../storage/TabIsolatedStorage'

/**
 * useCoreHealth — Continuous Health Monitoring
 *
 * TRUTH PRINCIPLE: The UI never assumes backend is up.
 * This hook provides real-time backend health visibility.
 *
 * States:
 * - UNKNOWN: Initial state, checking
 * - UP: Backend responding OK
 * - DOWN: Backend unreachable or erroring
 * - DEGRADED: Backend responding but slow/partial
 */

export type CoreHealthStatus = 'UNKNOWN' | 'UP' | 'DOWN' | 'DEGRADED'

export interface CoreHealthState {
  status: CoreHealthStatus
  lastChecked: number | null
  lastSuccess: number | null
  consecutiveFailures: number
  latencyMs: number | null
  isChecking: boolean
}

export interface UseCoreHealthOptions {
  /** Base URL for health endpoint. Default: localStorage or '' */
  baseUrl?: string
  /** Polling interval in ms when UP. Default: 30000 (30s) */
  pollInterval?: number
  /** Polling interval in ms when DOWN. Default: 5000 (5s) - more aggressive */
  downPollInterval?: number
  /** Timeout for health request in ms. Default: 5000 */
  timeout?: number
  /** Latency threshold for DEGRADED status in ms. Default: 2000 */
  degradedThresholdMs?: number
  /** Auto-start polling. Default: true */
  autoStart?: boolean
}

const DEFAULT_OPTIONS: Required<UseCoreHealthOptions> = {
  baseUrl: '',
  pollInterval: 30000,
  downPollInterval: 5000,
  timeout: 5000,
  degradedThresholdMs: 2000,
  autoStart: true,
}

export function useCoreHealth(options: UseCoreHealthOptions = {}): CoreHealthState & {
  check: () => Promise<CoreHealthStatus>
  startPolling: () => void
  stopPolling: () => void
} {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const [state, setState] = useState<CoreHealthState>({
    status: 'UNKNOWN',
    lastChecked: null,
    lastSuccess: null,
    consecutiveFailures: 0,
    latencyMs: null,
    isChecking: false,
  })

  // Use only setTimeout for polling
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const check = useCallback(async (): Promise<CoreHealthStatus> => {
    if (!mountedRef.current) return state.status

    // 🛡️ SECURITY: Bypass only allowed in DEV mode
    if (import.meta.env.DEV && getTabIsolated('chefiapp_bypass_health') === 'true') {
      const fakeStatus: CoreHealthStatus = 'UP'
      setState({
        status: fakeStatus,
        lastChecked: Date.now(),
        lastSuccess: Date.now(),
        consecutiveFailures: 0,
        latencyMs: 0,
        isChecking: false,
      })
      return fakeStatus
    }

    setState(s => ({ ...s, isChecking: true }))
    const startTime = Date.now()

    try {
      const result = await fetchHealth()
      const now = Date.now()
      const latencyMs = now - startTime

      if (result === 'down') {
        if (!mountedRef.current) return 'DOWN'
        setState(s => ({
          ...s,
          status: 'DOWN',
          lastChecked: now,
          consecutiveFailures: s.consecutiveFailures + 1,
          latencyMs,
          isChecking: false,
        }))
        return 'DOWN'
      }

      const status: CoreHealthStatus =
        latencyMs > opts.degradedThresholdMs ? 'DEGRADED' : 'UP'

      if (!mountedRef.current) return status

      if (state.status !== status) {
        console.log(`[CoreHealth] Status changed: ${state.status} -> ${status}`)
      }

      setState({
        status,
        lastChecked: now,
        lastSuccess: now,
        consecutiveFailures: 0,
        latencyMs,
        isChecking: false,
      })

      return status

    } catch (err) {
      const now = Date.now()
      const latencyMs = now - startTime

      if (!mountedRef.current) return 'DOWN'

      setState(s => ({
        ...s,
        status: 'DOWN',
        lastChecked: now,
        consecutiveFailures: s.consecutiveFailures + 1,
        latencyMs,
        isChecking: false,
      }))
      return 'DOWN'
    }
  }, [opts.degradedThresholdMs, state.status])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()

    // Define the poll loop
    const poll = async () => {
      // Check first
      const currentStatus = await check()

      if (!mountedRef.current) return

      // Schedule next
      const interval = currentStatus === 'DOWN' ? opts.downPollInterval : opts.pollInterval
      pollingRef.current = setTimeout(poll, interval)
    }

    // Start the loop
    poll()
  }, [check, stopPolling, opts.pollInterval, opts.downPollInterval])

  // Lifecycle
  useEffect(() => {
    mountedRef.current = true

    if (opts.autoStart) {
      startPolling()
    }

    return () => {
      mountedRef.current = false
      stopPolling()
    }
  }, [opts.autoStart, startPolling, stopPolling])

  return {
    ...state,
    check,
    startPolling,
    stopPolling,
  }
}

/**
 * Utility: Check if action should be blocked based on health
 */
export function shouldBlockAction(status: CoreHealthStatus): boolean {
  return status === 'DOWN' || status === 'UNKNOWN'
}

/**
 * Utility: Get user-friendly message for health status
 */
export function getHealthMessage(status: CoreHealthStatus): string {
  switch (status) {
    case 'UP':
      return 'Sistema operacional'
    case 'DOWN':
      return 'Sistema indisponivel. Tenta novamente em breve.'
    case 'DEGRADED':
      return 'Sistema lento. Algumas operacoes podem demorar.'
    case 'UNKNOWN':
      return 'A verificar sistema...'
  }
}
