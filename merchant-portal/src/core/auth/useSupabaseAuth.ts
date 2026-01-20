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
  const initialSessionProcessedRef = useRef(false)

  useEffect(() => {
    let mounted = true;
    let hashProcessed = false;

    // DEV BYPASS: Demo Mode (Global Mock Session)
    if (typeof window !== 'undefined') {
      const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';
      if (import.meta.env.DEV && isDemo) {
        console.warn('[Auth] 🚧 DEV BYPASS: Activating Demo Mode (Mock Session)');
        const mockUser = {
          id: 'demo-user',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'demo@chefiapp.com',
          phone: '',
          app_metadata: { provider: 'email' },
          user_metadata: { name: 'Demo User' },
          created_at: new Date().toISOString(),
        } as User;

        const mockSession = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser,
        } as Session;

        setSession(mockSession);
        setUser(mockUser);
        setLoading(false);
        initializedRef.current = true;
        return;
      }
    }

    // 1. Verificar se há hash OAuth na URL PRIMEIRO e processar explicitamente
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        hashProcessed = true;
        console.log('[Auth] OAuth hash detected, processing...');

        // Processar hash explicitamente
        supabase.auth.getSession().then(({ data: { session: hashSession }, error: hashError }) => {
          if (!mounted) return;

          if (hashSession) {
            console.log('[Auth] OAuth hash processed successfully');
            setSession(hashSession);
            setUser(hashSession.user);
            setLoading(false);
            initializedRef.current = true;
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          } else if (hashError) {
            console.error('[Auth] Error processing OAuth hash:', hashError);
            setError(hashError);
            setLoading(false);
            initializedRef.current = true;
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        });
      }
    }

    // 2. Get initial session (bootstrap) - apenas se não processamos hash
    // Safety: sempre chamar getSession() para garantir que loading seja setado para false
    if (!hashProcessed) {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return;

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
      }).catch((err) => {
        // Safety: garantir que loading seja false mesmo em caso de erro
        if (!mounted) return;
        console.error('[Auth] getSession error:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        initializedRef.current = true;
      });
    } else {
      // Se processamos hash mas ainda não temos sessão, garantir que loading seja false após timeout
      // (o onAuthStateChange deve disparar, mas se não disparar, não queremos loading infinito)
      setTimeout(() => {
        if (mounted && !initializedRef.current) {
          console.warn('[Auth] Hash processed but no session after 3s - setting loading to false');
          setLoading(false);
          initializedRef.current = true;
        }
      }, 3000);
    }

    // 3. Listen for auth changes (fonte real de verdade)
    // Este listener é crítico - ele dispara quando o Supabase processa o hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Ignorar INITIAL_SESSION se já processamos uma vez
        // INITIAL_SESSION é disparado toda vez que o listener é registrado
        // Se o hook for remontado (ex: React StrictMode), isso pode causar loops
        if (event === 'INITIAL_SESSION') {
          if (initialSessionProcessedRef.current) {
            // Já processamos INITIAL_SESSION antes - ignorar eventos repetidos
            return;
          }
          initialSessionProcessedRef.current = true;
        }

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

        // Limpar hash OAuth da URL após SIGNED_IN
        if (event === 'SIGNED_IN' && typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          console.log('[Auth] SIGNED_IN event - clearing OAuth hash');
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Log events for debugging (only in dev)
        // Não logar INITIAL_SESSION repetidamente para reduzir ruído
        if (import.meta.env.DEV) {
          if (event === 'SIGNED_IN') {
            console.log('[Auth] User signed in:', session?.user?.email)
          } else if (event === 'SIGNED_OUT') {
            console.log('[Auth] User signed out')
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('[Auth] Token refreshed')
          } else if (event !== 'INITIAL_SESSION') {
            // Só logar INITIAL_SESSION na primeira vez
            console.log('[Auth] Auth state changed:', event)
          }
        }
      }
    )

    return () => {
      mounted = false;
      subscription.unsubscribe()
    }
  }, [])

  return { session, user, loading, error }
}

