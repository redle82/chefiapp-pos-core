import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetupContext } from '../../hooks'
import { fetchJson, internalHeaders } from '../../api'
import { toUserMessage } from '../../ui/errors'
import { updateWizardProgress } from '../../core/wizardProgress'
import { track } from '../../analytics/track'
import { EmptyState } from '../../ui/design-system/EmptyState'
import { Input } from '../../ui/design-system/Input'
import { Button } from '../../ui/design-system/Button'
import { Card } from '../../ui/design-system/Card'
import { InlineAlert } from '../../ui/design-system/InlineAlert'
import { Spacing } from '../../ui/design-system/tokens'
import '../../App.css'

/**
 * PaymentsStep — Passo 3: Configurar Stripe
 */
export function PaymentsStep() {
  const navigate = useNavigate()
  const { apiBase, internalToken, restaurantId, loadState, steps } = useSetupContext()

  type Phase = 'decision' | 'connect' | 'done'
  const [phase, setPhase] = useState<Phase>(steps.payments ? 'done' : 'decision')

  const [stripePk, setStripePk] = useState('')
  const [stripeSk, setStripeSk] = useState('')
  const [stripeWhsec, setStripeWhsec] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [skipped, setSkipped] = useState(false)

  async function handleConnect() {
    if (!restaurantId) return
    setBusy(true)
    setError(null)
    setSuccess(false)
    setSkipped(false)
    try {
      await fetchJson(apiBase, `/internal/wizard/${encodeURIComponent(restaurantId)}/payments`, {
        method: 'POST',
        headers: internalHeaders(internalToken),
        body: JSON.stringify({
          gateway: 'stripe',
          stripe_publishable_key: stripePk,
          stripe_secret_key: stripeSk,
          stripe_webhook_secret: stripeWhsec || undefined,
        }),
      })
      
      // Persist wizard progress: mark payments step as complete
      await updateWizardProgress(restaurantId, 'payments', {
        gateway: 'stripe',
        connected_at: new Date().toISOString()
      })
      
      await loadState()
      setSuccess(true)
      if (!getTabIsolated('chefiapp_evt_payments_connected')) {
        setTabIsolated('chefiapp_evt_payments_connected', '1')
        track('payments_connected', { gateway: 'stripe' })
      }
      setPhase('done')
    } catch (e: any) {
      setError(toUserMessage(e, 'Não foi possível ligar o Stripe agora. Tenta novamente.'))
    } finally {
      setBusy(false)
    }
  }

  function handleContinue() {
    navigate('/app/setup/design')
  }

  function handleSkip() {
    // Permite avançar sem Stripe (modo caixa/manual)
    setSkipped(true)
    if (!getTabIsolated('chefiapp_evt_payments_skipped')) {
      setTabIsolated('chefiapp_evt_payments_skipped', '1')
      track('payments_skipped')
    }
    setPhase('done')
  }

  function handleChooseConnect() {
    setError(null)
    setSuccess(false)
    setSkipped(false)
    setPhase('connect')
  }

  if (phase === 'decision') {
    return (
      <div>
        <EmptyState
          icon={<div style={{ fontSize: 64 }}>💳</div>}
          title="Aceita pagamentos online"
          description="Configura o Stripe para receberes pagamentos diretamente no teu menu. Podes fazer isto agora ou mais tarde."
          action={{
            label: "Configurar Stripe",
            onClick: handleChooseConnect
          }}
        >
          {error && (
            <InlineAlert type="warning" message={error} className="mt-4" />
          )}
          <div style={{ marginTop: '10px' }}>
            <Button variant="ghost" onClick={handleSkip}>
              Fazer isto depois
            </Button>
          </div>
        </EmptyState>
      </div>
    )
  }

  if (phase === 'connect') {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h2 className="h2">Liga o Stripe</h2>
        <p className="muted" style={{ marginBottom: Spacing.lg }}>
          Insere as tuas credenciais do Stripe. Encontras-as no painel do Stripe. Podes alterar isto depois.
        </p>

        <Card>
          <div className="h3" style={{ marginBottom: Spacing.md }}>Stripe</div>
          <div style={{ display: 'grid', gap: Spacing.md }}>
            <Input
              label="Publishable Key (pk_...)"
              value={stripePk}
              onChange={(e) => setStripePk(e.target.value)}
              placeholder="pk_test_..."
              type="password"
              fullWidth
            />
            <Input
              label="Secret Key (sk_...)"
              value={stripeSk}
              onChange={(e) => setStripeSk(e.target.value)}
              placeholder="sk_test_..."
              type="password"
              fullWidth
            />
            <Input
              label="Webhook Secret (whsec_...)"
              value={stripeWhsec}
              onChange={(e) => setStripeWhsec(e.target.value)}
              placeholder="whsec_..."
              type="password"
              fullWidth
            />
          </div>

          {error && (
            <InlineAlert type="warning" message={error} className="mt-4" />
          )}

          <div style={{ marginTop: Spacing.lg, display: 'grid', gap: Spacing.sm }}>
            <Button
              variant="primary"
              disabled={busy || !stripePk || !stripeSk}
              loading={busy}
              onClick={handleConnect}
              fullWidth
            >
              Confirmar ligação
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setPhase('decision')}
              fullWidth
            >
              Voltar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // phase === 'done'
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      {success ? (
        <InlineAlert type="success" message="Pagamentos configurados" className="mb-4" />
      ) : skipped ? (
        <InlineAlert type="success" message="Ok — podes configurar pagamentos mais tarde" className="mb-4" />
      ) : (
        <InlineAlert type="info" message="Pagamentos ainda não configurados" className="mb-4" />
      )}

      <h2 className="h2">Pagamentos configurados</h2>
      <p className="muted" style={{ marginBottom: Spacing.lg }}>
        Agora vamos personalizar a aparência da tua página e criar o teu link único.
      </p>

      <Button variant="primary" onClick={handleContinue} fullWidth>
        Continuar
      </Button>
    </div>
  )
}
