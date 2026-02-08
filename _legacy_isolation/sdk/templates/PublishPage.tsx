import React from 'react'

export type RouteMeta = {
  contractIds?: string[]
  allowedPreviewStates?: Array<'none' | 'ghost' | 'live'>
  redirectOnFail?: string
}

export const routeMeta: RouteMeta = {
  contractIds: ['ONT-001', 'ONT-002', 'CAP-002'],
  allowedPreviewStates: ['ghost', 'live'],
}

export function PublishPage() {
  return (
    <section>
      <h1>Publish</h1>
      {/* Publish action UI; guard pre-validates identity + menu */}
    </section>
  )
}
