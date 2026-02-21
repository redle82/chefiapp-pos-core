// @ts-nocheck
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { computeWebCoreState } from './WebCoreState'
import type { WebCoreState } from './WebCoreState'
import { fetchHealth, type HealthStatus } from './health'
import { getTabIsolated } from './storage/TabIsolatedStorage'

/**
 * React Context para o WebCoreState.
 * Páginas consultam este contexto, nunca inferem estado.
 */
const WebCoreContext = createContext<WebCoreState | null>(null)

/**
 * Hook para aceder ao core imutável.
 * Páginas usam isto em vez de ler localStorage directamente.
 */
export function useWebCore(): WebCoreState {
  const core = useContext(WebCoreContext)
  if (!core) {
    throw new Error('useWebCore must be used within WebCoreProvider')
  }
  return core
}

/**
 * Provider que calcula o WebCoreState a partir do wizard state.
 * Deve envolver a app inteira no main.tsx.
 */
export function WebCoreProvider({ children }: { children: ReactNode }) {
  // Lê wizard state do TabIsolatedStorage
  const wizardStateRaw = getTabIsolated('wizard-state')
  let wizardState = null
  try {
    wizardState = wizardStateRaw ? JSON.parse(wizardStateRaw) : null
  } catch (e) {
    console.error('Failed to parse wizard-state', e)
    wizardState = null
  }

  // Health real — mínimo, sem retries inteligentes
  const [health, setHealth] = useState<HealthStatus>('ok')

  useEffect(() => {
    let active = true
    fetchHealth('').then((h) => { if (active) setHealth(h) })
    return () => { active = false }
  }, [])

  // Computa o core (única fonte de verdade)
  const core = computeWebCoreState(wizardState, health)

  return (
    <WebCoreContext.Provider value={core}>
      {children}
    </WebCoreContext.Provider>
  )
}
