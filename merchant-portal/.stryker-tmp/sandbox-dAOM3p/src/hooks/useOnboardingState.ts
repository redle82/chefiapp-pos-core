// @ts-nocheck
import { useCallback, useState } from 'react'
import { ApiError, fetchJson, internalHeaders } from '../api'
import { CONFIG } from '../config'

export interface OnboardingGates {
  ok: boolean | null
  tier: string | null
  addons: string[]
  error: string | null
  message: string | null
}

export interface OnboardingProfile {
  name?: string | null
  slug: string | null
  status: 'draft' | 'published' | 'suspended'
  web_level: 'BASIC' | 'PRO' | 'EXPERIENCE'
}

export interface OnboardingSteps {
  identity: boolean
  menu: boolean
  payments: boolean
  design: boolean
  publishable: boolean
  published: boolean
}

export interface OnboardingState {
  restaurantId: string
  apiBase: string
  internalToken: string
  profile: OnboardingProfile | null
  gates: OnboardingGates
  steps: OnboardingSteps
  raw: any
  loading: boolean
  error: any
}

const defaultGates: OnboardingGates = {
  ok: null,
  tier: null,
  addons: [],
  error: null,
  message: null,
}

const defaultSteps: OnboardingSteps = {
  identity: false,
  menu: false,
  payments: false,
  design: false,
  publishable: false,
  published: false,
}

export function useOnboardingState(initialConfig?: {
  apiBase?: string
  internalToken?: string
  restaurantId?: string
}) {
  const [apiBase, setApiBase] = useState(initialConfig?.apiBase ?? CONFIG.API_BASE)
  const [internalToken, setInternalToken] = useState(initialConfig?.internalToken ?? 'dev-token')
  const [restaurantId, setRestaurantId] = useState(initialConfig?.restaurantId ?? '')

  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [gates, setGates] = useState<OnboardingGates>(defaultGates)
  const [steps, setSteps] = useState<OnboardingSteps>(defaultSteps)
  const [raw, setRaw] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const loadState = useCallback(async (rid?: string) => {
    const id = rid || restaurantId
    if (!id) {
      setError({ message: 'RESTAURANT_ID_REQUIRED' })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const r = await fetchJson(apiBase, `/internal/wizard/${encodeURIComponent(id)}/state`, {
        method: 'GET',
        headers: internalHeaders(internalToken),
      })
      setRaw(r)
      setProfile({
        slug: r?.profile?.slug ?? null,
        status: r?.profile?.status ?? 'draft',
        web_level: r?.profile?.web_level ?? 'BASIC',
      })
      setGates({
        ok: r?.gates?.ok ?? null,
        tier: r?.gates?.tier ?? null,
        addons: Array.isArray(r?.gates?.addons) ? r.gates.addons : [],
        error: r?.gates?.error ?? null,
        message: r?.gates?.message ?? null,
      })
      setSteps({
        identity: Boolean(r?.identity_complete),
        menu: Boolean(r?.menu_complete),
        payments: Boolean(r?.payments_complete),
        design: Boolean(r?.design_complete),
        publishable: Boolean(r?.can_publish),
        published: r?.profile?.status === 'published',
      })
      if (rid && rid !== restaurantId) setRestaurantId(rid)
    } catch (e: any) {
      if (e instanceof ApiError) {
        setError({ message: e.message, status: e.status, body: e.body })
      } else {
        setError({ message: String(e?.message || e) })
      }
    } finally {
      setLoading(false)
    }
  }, [apiBase, internalToken, restaurantId])

  // Required steps: identity + menu + published
  // Payments is OPTIONAL (user can skip)
  const hasCompletedRequiredSteps =
    steps.identity &&
    steps.menu &&
    steps.published

  const isReadyForTPV = hasCompletedRequiredSteps && gates.ok === true

  const stepStatus = useCallback((stepNum: 1 | 2 | 3 | 4 | 5): 'completed' | 'current' | 'blocked' | 'pending' => {
    const stepMap: Record<number, keyof OnboardingSteps> = {
      1: 'identity',
      2: 'menu',
      3: 'payments',
      4: 'design',
      5: 'published',
    }
    const key = stepMap[stepNum]
    if (steps[key]) return 'completed'
    if (gates.ok === false && (stepNum === 4 || stepNum === 5)) return 'blocked'

    // Determine current step
    if (!steps.identity) return stepNum === 1 ? 'current' : 'pending'
    if (!steps.menu) return stepNum === 2 ? 'current' : 'pending'
    if (!steps.payments) return stepNum === 3 ? 'current' : 'pending'
    if (!steps.design) return stepNum === 4 ? 'current' : 'pending'
    if (!steps.published) return stepNum === 5 ? 'current' : 'pending'
    return 'completed'
  }, [steps, gates.ok])

  return {
    // Config
    apiBase,
    setApiBase,
    internalToken,
    setInternalToken,
    restaurantId,
    setRestaurantId,

    // State
    profile,
    gates,
    steps,
    raw,
    loading,
    error,

    // Actions
    loadState,

    // Computed
    isReadyForTPV,
    stepStatus,
  }
}

export type OnboardingHook = ReturnType<typeof useOnboardingState>
