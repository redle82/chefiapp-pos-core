import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetupContext } from '../../hooks'
import { fetchJson, internalHeaders } from '../../api'
import { toUserMessage } from '../../ui/errors'
import { markWizardComplete, updateWizardProgress } from '../../core/wizardProgress'
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage'
import '../../App.css'

/**
 * PublishStep — Passo 5: Publicar a página
 */
export function PublishStep() {
  const navigate = useNavigate()
  const { apiBase, internalToken, restaurantId, loadState, steps, gates, profile } = useSetupContext()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = profile?.slug || getTabIsolated('chefiapp_slug') || 'sofia-gastrobar'
  const publicUrl = `${apiBase}/public/${slug}`

  const canPublish = steps.identity && steps.menu && gates.ok !== false
  const isBlocked = gates.ok === false
  const isPublished = steps.published

  async function handlePublish() {
    if (!restaurantId) return
    setBusy(true)
    setError(null)
    try {
      await fetchJson(apiBase, `/internal/wizard/${encodeURIComponent(restaurantId)}/publish`, {
        method: 'POST',
        headers: internalHeaders(internalToken),
        body: JSON.stringify({ confirm: true }),
      })
      
      // Persist wizard progress: mark publish step as complete
      await updateWizardProgress(restaurantId, 'publish', {
        published_at: new Date().toISOString(),
        slug: slug
      })
      
      // Mark wizard as completely finished (fonte única de verdade)
      await markWizardComplete(restaurantId)
      
      await loadState()
      
      // Redirect to dashboard immediately (wizard complete, never show again)
      // Next login will skip wizard via BootstrapPage gate
      setTimeout(() => navigate('/app/dashboard'), 500)
    } catch (e: any) {
      setError(toUserMessage(e, 'Algo correu mal ao publicar. Verifica a ligação e tenta novamente.'))
    } finally {
      setBusy(false)
    }
  }

  function handleGoToTPV() {
    // After publishing, redirect to dashboard (wizard is complete, never show it again)
    navigate('/app/dashboard')
  }

  return (
    <div>
      <h2 className="h2">Estás pronto para publicar?</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        Quando publicares, a tua página ficará online e os clientes poderão fazer pedidos. Nada fica público sem a tua confirmação.
      </p>

      {isBlocked && (
        <div className="banner warn" style={{ marginBottom: 16 }}>
          <div className="bannerTitle">🔒 Upgrade necessário</div>
          <div className="bannerText">{gates.message || 'Publicação bloqueada pelo plano.'}</div>
        </div>
      )}

      {isPublished ? (
        <div className="banner ok">
          <div className="bannerTitle">🎉 Página publicada</div>
          <div className="bannerText">O teu TPV está pronto para operar.</div>
          <div className="bannerActions" style={{ marginTop: 12 }}>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="btn">
              Ver página pública
            </a>
            <button className="btn primary" onClick={handleGoToTPV}>
              Entrar no painel
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="h3">Checklist</div>
          <ul style={{ margin: '8px 0', paddingLeft: 20, opacity: 0.9 }}>
            <li style={{ color: steps.identity ? '#50c878' : 'inherit' }}>
              {steps.identity ? '✓' : '○'} Identidade completa
            </li>
            <li style={{ color: steps.menu ? '#50c878' : 'inherit' }}>
              {steps.menu ? '✓' : '○'} Menu com pelo menos 1 item
            </li>
            <li style={{ color: steps.payments ? '#50c878' : 'inherit' }}>
              {steps.payments ? '✓' : '○'} Pagamentos (opcional)
            </li>
            <li style={{ color: steps.design ? '#50c878' : 'inherit' }}>
              {steps.design ? '✓' : '○'} Design definido
            </li>
          </ul>

          <div style={{ marginTop: 16 }}>
            <button className="btn primary" disabled={busy || !canPublish} onClick={handlePublish}>
              {busy ? 'A publicar…' : canPublish ? 'Publicar página agora' : 'Completa os passos acima'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="banner warn" style={{ marginTop: 12 }}>
          <div className="bannerText">{error}</div>
        </div>
      )}

      {/* Preview */}
      {!isPublished && (
        <div style={{ marginTop: 20 }}>
          <div className="h3">Pré-visualização</div>
          <div className="iframeWrap" style={{ marginTop: 8 }}>
            <iframe
              src={publicUrl}
              title="Preview"
              style={{ width: '100%', height: 300, border: 0, background: '#fff', borderRadius: 8 }}
            />
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            URL: <code>{publicUrl}</code>
          </div>
        </div>
      )}
    </div>
  )
}
