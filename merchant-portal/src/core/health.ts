import { supabase } from './supabase'

export type HealthStatus = 'ok' | 'down'

export async function fetchHealth(basePath: string = ''): Promise<HealthStatus> {
  // IGNORE basePath - We are going Serverless (Supabase Functions)
  try {
    const { data, error } = await supabase.functions.invoke('health')

    if (error) {
      console.warn('[Health] Check failed:', error)
      return 'down'
    }

    const status = String((data && (data.status || data.health)) || '').toLowerCase()
    return status === 'ok' ? 'ok' : 'down'
  } catch (e) {
    console.warn('[Health] Exception:', e)
    return 'down'
  }
}

export * from './health/useCoreHealth'
export * from './health/gating'
