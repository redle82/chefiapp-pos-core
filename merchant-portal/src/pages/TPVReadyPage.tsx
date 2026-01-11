import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingState } from '../hooks/useOnboardingState'
import { useCoreHealth } from '../core/health/useCoreHealth'
import { track } from '../analytics/track'
import { Card } from '../ui/design-system/Card'
import { Button } from '../ui/design-system/Button'
import { Badge } from '../ui/design-system/Badge'
import { Spacing, Colors } from '../ui/design-system/tokens'
import { getTabIsolated, setTabIsolated } from '../core/storage/TabIsolatedStorage'
import '../App.css'
import { CONFIG } from '../config'

// Router Guard meta — page consumes the system, does not decide
export const routeMeta = {
  contractIds: ['ONT-002', 'ONT-003', 'CAP-004'],
  allowedPreviewStates: ['live'] as Array<'live'>,
}

/**
 * TPVReadyPage — Página final: TPV pronto para operar
 */
export function TPVReadyPage() {
  const navigate = useNavigate()
  const apiBase = import.meta.env.VITE_API_BASE || CONFIG.API_BASE
  const internalToken = import.meta.env.VITE_INTERNAL_TOKEN || 'dev-internal'
  const restaurantId = getTabIsolated('chefiapp_restaurant_id')
  const slug = getTabIsolated('chefiapp_slug') || 'sofia-gastrobar'

  const { status: healthStatus, check: checkHealth, isChecking } = useCoreHealth({ baseUrl: apiBase, autoStart: true })

  const { loading, gates, loadState, isReadyForTPV } = useOnboardingState({
    apiBase,
    internalToken,
    restaurantId: restaurantId ?? undefined,
  })

  useEffect(() => {
    loadState()
    checkHealth()
  }, [])

  useEffect(() => {
    if (!loading && isReadyForTPV && !getTabIsolated('chefiapp_evt_tpv_ready')) {
      setTabIsolated('chefiapp_evt_tpv_ready', '1')
      track('tpv_ready')
    }
  }, [loading, isReadyForTPV])

  // No local redirects; Router Guard handles protection and remediation

  if (loading) {
    return (
      <div style={{ background: '#0b0b0c', minHeight: '100vh', color: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '16px 20px 24px', textAlign: 'center' }}>
          <Card style={{ margin: 0, maxWidth: 520, marginInline: 'auto', padding: 20 }}>
            A preparar o teu painel…
          </Card>
        </div>
      </div>
    )
  }

  const publicUrl = `${apiBase}/public/${slug}`
  const tier = gates.tier || 'free'

  const isHealthUp = healthStatus === 'UP'
  const canOperate = isHealthUp && isReadyForTPV && gates.ok === true
  const blockedMessage = !isHealthUp
    ? 'Sistema indisponivel. Aguarda a recuperacao ou tenta novamente.'
    : gates.ok === false
      ? gates.message || 'Bloqueado pelos gates do setup.'
      : !isReadyForTPV
        ? 'Faltam passos obrigatorios antes de operar o TPV.'
        : null

  return (
    <div style={{ background: '#0b0b0c', minHeight: '100vh', color: '#f5f5f7' }}>
      <div style={{ padding: '16px 20px 28px', paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {canOperate ? (
            <>
              <Badge
                variant="success"
                label="Online e pronto"
                icon="✓"
                className="mb-4"
              />

              <h1 className="h1" style={{ fontSize: 22, marginTop: Spacing['10'] }}>
                O teu TPV está pronto.
              </h1>
              <p className="muted" style={{ marginTop: Spacing.xs }}>
                Já podes receber pedidos.
              </p>
            </>
          ) : (
            <>
              <Badge
                variant="warning"
                label="A aguardar core"
                icon="⚠️"
                className="mb-4"
              />
              <h1 className="h1" style={{ fontSize: 22, marginTop: Spacing['10'] }}>
                Ainda não é seguro operar.
              </h1>
              <p className="muted" style={{ marginTop: Spacing.xs }}>
                {blockedMessage || 'Confirma saúde do backend e passos obrigatórios.'}
              </p>
            </>
          )}

          <Card style={{ marginTop: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div>
                <div className="h3">{canOperate ? 'Tudo pronto' : 'Acesso bloqueado'}</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  {canOperate ? 'O essencial está concluído.' : 'Core precisa estar UP e passos obrigatórios completos.'}
                </div>
              </div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: canOperate ? 'rgba(80,200,120,.12)' : 'rgba(255,200,80,.12)',
                border: `1px solid ${canOperate ? 'rgba(80,200,120,.28)' : 'rgba(255,200,80,.38)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: canOperate ? Colors.success : Colors.warning
              }}>
                {canOperate ? '✓' : '!'}
              </div>
            </div>

            <ul style={{ margin: '12px 0 0', paddingLeft: 20, opacity: 0.95 }}>
              <li style={{ color: canOperate ? Colors.success : undefined }}>✓ Identidade</li>
              <li style={{ color: canOperate ? Colors.success : undefined }}>✓ Menu</li>
              <li style={{ color: canOperate ? Colors.success : undefined }}>✓ Página criada</li>
              <li style={{ opacity: 0.8 }}>Pagamentos (opcional)</li>
              {!isHealthUp && <li style={{ color: Colors.error }}>Backend indisponível</li>}
            </ul>

            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <Button
                variant="primary"
                onClick={() => navigate('/app/tpv')}
                disabled={!canOperate || isChecking}
                style={{ justifyContent: 'center' }}
              >
                {canOperate ? 'Abrir TPV' : 'Aguardar core'}
              </Button>
              <a
                href={canOperate ? publicUrl : undefined}
                aria-disabled={!canOperate}
                target={canOperate ? '_blank' : undefined}
                rel={canOperate ? 'noreferrer' : undefined}
                className="btn" // Keeping btn class for anchor/link style if Button doesn't support 'as' or href yet.
                // Or better, wrap generic button style? For now, keep anchor for external link behavior but style matches.
                style={{
                  justifyContent: 'center',
                  pointerEvents: canOperate ? 'auto' : 'none',
                  opacity: canOperate ? 1 : 0.6,
                  textAlign: 'center',
                  display: 'block',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  color: 'inherit',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                Ver página pública
              </a>
            </div>
          </Card>

          <div className="muted" style={{ marginTop: 14, textAlign: 'center' }}>
            <Button variant="ghost" onClick={() => navigate('/app/setup/menu')} style={{ marginRight: 8 }}>
              Editar menu
            </Button>
            <Button variant="ghost" onClick={() => navigate('/app/setup/design')}>
              Ajustar design
            </Button>
          </div>

          {gates.addons && gates.addons.length > 0 && (
            <Card style={{ marginTop: 14 }}>
              <div className="h3">Add-ons disponíveis</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {gates.addons.map((addon: string) => (
                  <Badge key={addon} label={addon} variant="info" />
                ))}
              </div>
            </Card>
          )}

          {tier === 'free' && (
            <div className="banner warn" style={{ marginTop: 14, background: Colors.status.warning.bg, borderColor: Colors.status.warning.border }}>
              <div className="bannerTitle" style={{ color: Colors.status.warning.text }}>⚡ Desbloqueie mais funcionalidades</div>
              <div className="bannerText" style={{ color: Colors.status.warning.text, opacity: 0.9 }}>Upgrade para Pro e acesse pagamentos online, analytics avançado e mais.</div>
              <div className="bannerActions" style={{ marginTop: 8 }}>
                <Button variant="primary" onClick={() => console.log('Upgrade flow em breve!')} title="Em breve">
                  Ver planos
                </Button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '22px 0 0', opacity: 0.55, fontSize: 12 }}>
            ChefIApp POS v1.0 • Sistema de Registo Fiscal
          </div>
        </div>
      </div>
    </div>
  )
}
