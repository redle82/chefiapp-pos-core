import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { evaluateRoute } from './router-guard'

export type Core = {
  entity: { identityConfirmed: boolean; menuDefined: boolean; published: boolean }
  capabilities: { canUseTPV: boolean; canReceiveOrders: boolean; canPreview: boolean }
  truth: { backendIsLive: boolean; urlExists: boolean; previewIsReal: boolean }
  previewState: 'none' | 'ghost' | 'live'
}

export type RouteMeta = {
  contractIds?: string[]
  allowedPreviewStates?: Array<'none' | 'ghost' | 'live'>
  redirectOnFail?: string
}

/**
 * GuardedRoute wraps page elements and enforces flow + contract checks using route meta.
 * Pass `core` and `meta` from your app context and route configuration.
 */
export function GuardedRoute({ core, meta, children }: { core: Core; meta: RouteMeta; children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const result = evaluateRoute(core, meta)
    if (!result.allowed) {
      // Log for auditability (adapt to your event log)
      // console.log('[RouterGuard] Blocked', { path: location.pathname, reason: result.reason, redirectTo: result.redirectTo })
      navigate(result.redirectTo || '/', { replace: true })
    }
  }, [core, meta, navigate, location.pathname])

  return <>{children}</>
}
