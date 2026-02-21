import { getTabIsolated, setTabIsolated } from '../core/storage/TabIsolatedStorage';

type TrackPayload = Record<string, unknown>

type TrackEvent = {
  name: string
  ts: number
  path?: string
  payload?: TrackPayload
}

const STORAGE_KEY = 'chefiapp_analytics_queue'
const MAX_QUEUE = 200

function safeNow() {
  return Date.now()
}

function safePath() {
  try {
    return window.location?.pathname
  } catch {
    return undefined
  }
}

function readQueue(): TrackEvent[] {
  try {
    const raw = getTabIsolated(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(queue: TrackEvent[]) {
  try {
    setTabIsolated(STORAGE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)))
  } catch {
    // ignore
  }
}

export type FlushResult = {
  ok: boolean
  sent: number
  remaining: number
  status?: number
  error?: string
}

export async function flush(url: string): Promise<FlushResult> {
  const queue = readQueue()
  if (queue.length === 0) {
    return { ok: true, sent: 0, remaining: 0 }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: queue }),
      keepalive: true,
    })

    if (!res.ok) {
      return { ok: false, sent: 0, remaining: queue.length, status: res.status, error: 'http_error' }
    }

    writeQueue([])
    return { ok: true, sent: queue.length, remaining: 0, status: res.status }
  } catch (e) {
    return { ok: false, sent: 0, remaining: queue.length, error: e instanceof Error ? e.message : 'network_error' }
  }
}

export function track(name: string, payload?: TrackPayload) {
  const evt: TrackEvent = {
    name,
    ts: safeNow(),
    path: safePath(),
    payload,
  }

  // 1) Always log (dev visibility)
  console.info('[analytics]', evt.name, evt)

  // 2) Push to dataLayer if present (future GA/TagManager)
  try {
    const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: evt.name, ...evt })
    }
  } catch {
    // ignore
  }

  // 3) Buffer locally (future upload)
  const q = readQueue()
  q.push(evt)
  writeQueue(q)
}
