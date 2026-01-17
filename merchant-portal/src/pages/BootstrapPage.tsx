import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../core/supabase'
import { useCoreHealth } from '../core/health'
import { InlineAlert } from '../ui/design-system'
import { getTabIsolated, setTabIsolated } from '../core/storage/TabIsolatedStorage'
import { DbWriteGate } from '../core/governance/DbWriteGate'
import '../App.css'

/**
 * BootstrapPage — System Initialization
 *
 * TRUTH LOCK: No fake causal steps. Real checks, real feedback.
 *
 * This page verifies the system is ready before allowing progression.
 * If restaurant_id exists in localStorage, proceeds to preview.
 * Otherwise, redirects to start flow.
 * 
 * UPDATE: S0 Resilience Check
 * Ensure this page NEVER blocks the user, even if the backend is down.
 */

type BootstrapState =
  | 'checking'
  | 'checking_restaurant'
  | 'checking_health'
  | 'ready'
  | 'error'
  | 'timeout'
  | 'redirecting'

// S0 CONFIG: More tolerant values
const BOOTSTRAP_TIMEOUT = 15000 // 15s (was 10s) - Give slow backends a chance

export function BootstrapPage() {
  const navigate = useNavigate()
  const { status: _health } = useCoreHealth({ autoStart: false, timeout: BOOTSTRAP_TIMEOUT })

  const [state, setState] = useState<BootstrapState>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [progressStep, setProgressStep] = useState<string | null>(null)

  const switchToDemoMode = () => {
    setTabIsolated('chefiapp_demo_mode', 'true')
    // Safety: ensure we have a dummy ID to pass guards
    if (!getTabIsolated('chefiapp_restaurant_id')) {
      setTabIsolated('chefiapp_restaurant_id', 'demo-restaurant-id')
    }
    navigate('/preview')
  }

  const bootstrap = useCallback(async () => {
    console.log('[Bootstrap] Starting authentication check...');
    setState('checking')
    setErrorMessage(null)
    setShowProgress(false)
    setProgressStep(null)

    // 1. Check Auth Session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    console.log('[Bootstrap] Session check result:', { hasSession: !!session, error: authError });

    // DEMO MODE BYPASS
    const isDemo = getTabIsolated('chefiapp_demo_mode') === 'true'
    if (isDemo || (!session && !authError)) {
      // If no session and not demo -> Redirect Start
      if (!isDemo && !session) {
        console.log('[Bootstrap] No session found, redirecting to login');
        setState('redirecting')
        setTimeout(() => navigate('/login'), 300)
        return
      }
      // If Demo -> Allow pass
      setState('ready')
      setTimeout(() => navigate('/preview'), 500)
      return
    }

    setState('checking_restaurant')
    setProgressStep('Verificando identidade...')

    try {
      // 2. Check Membership (Sovereign Link)
      const user = session!.user
      console.log('[Bootstrap] Checking membership for user:', user.id);
      const { data: members, error: memberError } = await supabase
        .from('gm_restaurant_members')
        .select('restaurant_id, role')
        .eq('user_id', user.id)

      console.log('[Bootstrap] Membership query result:', { members, error: memberError });

      if (memberError) throw memberError

      if (members && members.length > 0) {
        // EXISTING OWNER/STAFF
        const member = members[0]
        console.log('[Bootstrap] Existing member found:', member);
        setTabIsolated('chefiapp_restaurant_id', member.restaurant_id)
        setTabIsolated('chefiapp_user_role', member.role)

        // WIZARD COMPLETION GATE: Check if wizard is completed
        const { data: restaurant, error: restCheckError } = await supabase
          .from('gm_restaurants')
          .select('wizard_completed_at, setup_status')
          .eq('id', member.restaurant_id)
          .single()

        if (!restCheckError && restaurant) {
          const wizardCompleted = restaurant.wizard_completed_at !== null
          const status = (restaurant.setup_status || 'not_started') as 'not_started' | 'quick_done' | 'advanced_in_progress' | 'advanced_done'
          const advancedDone = wizardCompleted || status === 'advanced_done'
          const quickDone = status === 'quick_done' || status === 'advanced_in_progress'

          if (advancedDone) {
            setState('ready')
            setProgressStep(`Bem-vindo de volta!`)
            const targetPath = member.role === 'owner' ? '/dashboard' : '/preview'
            // P2-3 FIX: Navegação imediata após verificação real (sem delay artificial)
            navigate(targetPath)
            return
          }

          const onboardingMode = getTabIsolated('chefiapp_onboarding_mode');
          if (onboardingMode === 'migration') {
            setState('ready')
            setProgressStep('Iniciando migração inteligente...')
            // P2-3 FIX: Navegação imediata após verificação real
            navigate('/migration/wizard')
            return
          }

          if (quickDone) {
            setState('ready')
            setProgressStep('Configuração rápida concluída')
            // P2-3 FIX: Navegação imediata após verificação real
            navigate('/app/dashboard')
            return
          }

          setState('ready')
          setProgressStep('Completa a configuração inicial...')
          // P2-3 FIX: Navegação imediata após verificação real
          navigate('/onboarding/identity')
          return
        }

        // Fallback: if check fails, redirect to dashboard (existing behavior)
        setState('ready')
        setProgressStep(`Bem-vindo de volta!`)
        const targetPath = member.role === 'owner' ? '/app/dashboard' : '/preview'
        // P2-3 FIX: Navegação imediata (sem delay artificial)
        navigate(targetPath)
      } else {
        // NEW USER -> AUTO CREATE FIRST RESTAURANT
        console.log('[Bootstrap] New user detected - creating first restaurant');
        setProgressStep('Criando o teu restaurante...')

        // A) Create Restaurant using gm_restaurants table
        // Use user metadata or default for name
        const name = user.user_metadata?.name || 'Meu Restaurante'
        // Generate safe, collision-resistant slug (timestamp-based, 6 chars)
        const timestamp = Date.now().toString(36).slice(-6).toLowerCase()
        const slug = `rest-${timestamp}` // e.g., "rest-a1b2c3"



        const { data: restData, error: restError } = await DbWriteGate.insert(
          'BootstrapPage',
          'gm_restaurants',
          {
            name: name,
            slug: slug,
            owner_id: user.id,
            status: 'active',
            country: 'ES',
            plan: 'trial',
            type: 'Restaurante'
          },
          { userId: user.id }
        );

        if (restError) throw restError

        // B) Create Member Link (Owner) - using restaurant_members table
        const { error: linkError } = await DbWriteGate.insert(
          'BootstrapPage',
          'gm_restaurant_members',
          {
            user_id: user.id,
            restaurant_id: restData.id,
            role: 'owner'
          },
          { tenantId: restData.id }
        );

        if (linkError) throw linkError

        // P2-3 FIX: Verificação real de sucesso antes de navegar
        // Verificar se restaurante foi realmente criado
        const { data: verifyRest, error: verifyError } = await supabase
          .from('gm_restaurants')
          .select('id, name')
          .eq('id', restData.id)
          .single()

        if (verifyError || !verifyRest) {
          throw new Error('Falha ao verificar criação do restaurante. Tente novamente.')
        }

        // Success - Set Local Context
        setTabIsolated('chefiapp_restaurant_id', restData.id)
        setTabIsolated('chefiapp_user_role', 'owner')

        setState('ready')
        setProgressStep('Cozinha criada com sucesso!')
        // P2-3 FIX: Navegação imediata após verificação real (sem delay artificial)
        navigate('/onboarding/identity')
      }

    } catch (error: any) {
      console.error('[Bootstrap] Fatal:', error)
      setState('error')
      setErrorMessage(error.message || 'Erro ao conectar ao banco de dados.')
    }
  }, [navigate])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  return (
    <div style={{ background: '#0b0b0c', minHeight: '100vh', color: '#f5f5f7' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          padding: '0 20px',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: 420,
            margin: '0 auto',
            width: '100%',
          }}
        >

          {/* CHECKING STATE */}
          {(state === 'checking' || state === 'checking_restaurant' || state === 'checking_health') && (
            <>
              <div
                style={{
                  width: 60,
                  height: 60,
                  border: '3px solid rgba(50, 215, 75, 0.2)',
                  borderTopColor: '#32d74b',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: 24,
                  boxShadow: '0 0 20px rgba(50, 215, 75, 0.1)'
                }}
              />
              <h1 className="h1" style={{ fontSize: 22, color: '#fff' }}>
                Conectando ao Sistema Nervoso
              </h1>
              {showProgress && progressStep && (
                <p className="muted" style={{ marginTop: 10, fontSize: 15, fontWeight: 500, color: '#32d74b' }}>
                  {progressStep}
                </p>
              )}
              {!showProgress && (
                <p className="muted" style={{ marginTop: 10, opacity: 0.6 }}>
                  Validando credenciais operacionais...
                </p>
              )}
            </>
          )}

          {/* TIMEOUT STATE - S0 GUARD */}
          {state === 'timeout' && (
            <>
              <div
                style={{
                  width: 60,
                  height: 60,
                  background: 'rgba(255, 59, 48, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  marginBottom: 24,
                  border: '1px solid rgba(255, 59, 48, 0.3)'
                }}
              >
                ⏱
              </div>
              <h1 className="h1" style={{ fontSize: 22 }}>
                Latência na Rede
              </h1>
              <p className="muted" style={{ marginTop: 10, marginBottom: 24 }}>
                A conexão segura está demorando.
              </p>
              <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={bootstrap}
                  style={{
                    padding: '14px 24px',
                    background: 'transparent',
                    border: '1px solid #32d74b',
                    borderRadius: 10,
                    color: '#32d74b',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Tentar conectar novamente
                </button>
                <button
                  onClick={switchToDemoMode}
                  style={{
                    padding: '14px 24px',
                    background: '#32d74b', // Primary Action now
                    border: 'none',
                    borderRadius: 10,
                    color: '#000',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Entrar em Modo Demo (Offline)
                </button>
              </div>
            </>
          )}

          {/* READY STATE */}
          {state === 'ready' && (
            <>
              <div
                style={{
                  width: 60,
                  height: 60,
                  background: 'rgba(50, 215, 75, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  marginBottom: 24,
                  border: '1px solid #32d74b',
                  boxShadow: '0 0 30px rgba(50, 215, 75, 0.2)'
                }}
              >
                <div style={{ width: '12px', height: '12px', background: '#32d74b', borderRadius: '50%' }}></div>
              </div>
              <h1 className="h1" style={{ fontSize: 22, color: '#fff' }}>
                Acesso Autorizado
              </h1>
              <p className="muted" style={{ marginTop: 10, color: '#32d74b' }}>
                Iniciando protocolos...
              </p>
            </>
          )}

          {/* REDIRECTING STATE */}
          {state === 'redirecting' && (
            <>
              <div
                style={{
                  width: 60,
                  height: 60,
                  border: '3px solid rgba(50, 215, 75, 0.2)',
                  borderTopColor: '#32d74b',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: 24,
                }}
              />
              <h1 className="h1" style={{ fontSize: 22 }}>
                Bem-vindo
              </h1>
              <p className="muted" style={{ marginTop: 10 }}>
                A iniciar configuração inicial...
              </p>
            </>
          )}

          {/* ERROR STATE - S0 GUARD */}
          {state === 'error' && (
            <>
              <div
                style={{
                  width: 60,
                  height: 60,
                  background: 'rgba(239, 83, 80, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  marginBottom: 24,
                }}
              >
                ✕
              </div>
              <h1 className="h1" style={{ fontSize: 22 }}>
                Falha na Conexão
              </h1>

              <div style={{ marginTop: 16, width: '100%', maxWidth: 320 }}>
                <InlineAlert
                  type="error"
                  message={errorMessage || 'Erro desconhecido'}
                />

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p className="muted" style={{ fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
                    Você pode continuar em modo offline/demo.
                  </p>
                  <button
                    onClick={switchToDemoMode}
                    style={{
                      padding: '14px 24px',
                      background: '#32d74b', // Primary Action
                      border: 'none',
                      borderRadius: 10,
                      color: '#000',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Entrar Agora (Demo)
                  </button>
                  <button
                    onClick={bootstrap}
                    style={{
                      padding: '14px 24px',
                      background: 'transparent',
                      border: '1px solid #333',
                      borderRadius: 10,
                      color: '#888',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Tentar Reconectar
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
