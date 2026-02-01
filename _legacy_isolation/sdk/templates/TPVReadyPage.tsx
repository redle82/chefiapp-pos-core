import React from 'react'

export type RouteMeta = {
  contractIds?: string[]
  allowedPreviewStates?: Array<'none' | 'ghost' | 'live'>
  redirectOnFail?: string
}

export const routeMeta: RouteMeta = {
  contractIds: ['ONT-002', 'ONT-003', 'CAP-004'],
  allowedPreviewStates: ['live'],
}

export function TPVReadyPage() {
  return (
    <section>
      <h1>TPV</h1>
      {/* POS console; payments may be cash/offline; guard ensures readiness */}
    </section>
  )
}
