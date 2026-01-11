import React from 'react'

export type RouteMeta = {
  contractIds?: string[]
  allowedPreviewStates?: Array<'none' | 'ghost' | 'live'>
  redirectOnFail?: string
}

export const routeMeta: RouteMeta = {
  contractIds: ['ONT-001'],
  allowedPreviewStates: ['ghost', 'live'],
}

// Reference-only: consume core via your app provider (e.g., useWebCore())
export function MenuPage() {
  return (
    <section>
      <h1>Menu</h1>
      {/* Guard ensures access; render menu editor here */}
    </section>
  )
}
