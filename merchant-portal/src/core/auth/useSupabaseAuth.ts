import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import type { Session, User } from '@supabase/supabase-js'

export interface SupabaseAuthState {
  session: Session | null  // Pode ser null quando não autenticado
  user: User | null
  loading: boolean
  error: Error | null
}

/**
 * Hook unificado para autenticação Supabase.
 * 
 * Esta é a ÚNICA fonte de verdade para estado de autenticação.
 * 
 * Princípio: "Supabase Auth é a única fonte de verdade de identidade"
 * 
 * O app NÃO deve:
 * - Guardar token manualmente
 * - Criar "login local"
 * - Validar token manualmente
 * - Criar estado de autenticação próprio
 * 
 * O app apenas:
 * - Lê sessão: supabase.auth.getSession()
 * - Escuta mudanças: supabase.auth.onAuthStateChange()
 * - Mostra UI conforme estado
 * 
 * @example
 * ```tsx
 * const { session, user, loading } = useSupabaseAuth()
 * 
 * if (loading) return <Loading />
 * if (!session) return <Navigate to="/login" />
 * 
 * return <Dashboard user={user} />
 * ```
 */
export function useSupabaseAuth(): SupabaseAuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    // 1. Get initial session (bootstrap)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error)
        setLoading(false)
        initializedRef.current = true
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      initializedRef.current = true
    })

    // 2. Listen for auth changes (fonte real de verdade)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Evitar double render: só atualizar se já inicializou
        if (!initializedRef.current) {
          // Primeiro evento pode vir antes do getSession() completar
          // Nesse caso, já temos os dados, então podemos marcar como inicializado
          initializedRef.current = true
        }

        setSession(session)
        setUser(session?.user ?? null)
        setError(null)
        setLoading(false) // Garantir que loading está false após mudança

        // Log events for debugging (only in dev)
        if (import.meta.env.DEV) {
          if (event === 'SIGNED_IN') {
            console.log('[Auth] User signed in:', session?.user?.email)
          } else if (event === 'SIGNED_OUT') {
            console.log('[Auth] User signed out')
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('[Auth] Token refreshed')
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { session, user, loading, error }
}

