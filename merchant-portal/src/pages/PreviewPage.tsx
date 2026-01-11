import { Link } from 'react-router-dom'
import { useWebCore } from '../core'
import { getTabIsolated } from '../core/storage/TabIsolatedStorage'
import '../App.css'
import { CONFIG } from '../config'

/**
 * PreviewPage — Consulta o core para decidir o que mostrar.
 * NUNCA infere estado. Consulta core.previewState e core.capabilities.
 */
export function PreviewPage() {
  const core = useWebCore()
  const slug = getTabIsolated('chefiapp_slug')
  const apiBase = getTabIsolated('chefiapp_api_base') || CONFIG.API_BASE
  const name = getTabIsolated('chefiapp_name') || 'O teu restaurante'

  // Consulta o core: posso mostrar preview?
  if (!core.capabilities.canPreview) {
    return (
      <div style={{ background: '#0b0b0c', minHeight: '100vh', color: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '16px 20px 28px', textAlign: 'center' }}>
          <div className="badge">Quase lá</div>
          <h1 className="h1" style={{ fontSize: 22, marginTop: 10 }}>
            Cria primeiro o teu restaurante
          </h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Preenche os dados básicos para veres o preview.
          </p>
          <Link to="/app/creating" className="btn primary" style={{ marginTop: 20, justifyContent: 'center' }}>
            Começar agora
          </Link>
        </div>
      </div>
    )
  }

  const publicUrl = `${apiBase}/public/${slug}`

  // Decide texto baseado no estado psicológico (ghost vs live)
  const previewBadge = core.previewState === 'live' ? '✓ Publicado' : 'Pré-visualização'

  return (
    <div style={{ background: '#0b0b0c', minHeight: '100vh', color: '#f5f5f7' }}>
      <div style={{ padding: '16px 20px 28px', paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="badge" style={{
            background: core.previewState === 'live' ? 'rgba(80,200,120,.12)' : 'rgba(255,200,80,.12)',
            borderColor: core.previewState === 'live' ? 'rgba(80,200,120,.28)' : 'rgba(255,200,80,.28)'
          }}>
            {previewBadge}
          </div>

          <h1 className="h1" style={{ fontSize: 22, marginTop: 10 }}>
            {name}
          </h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Isto é o que os teus clientes vão ver. Agora é só afinar.
          </p>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="h3">Pré-visualização</div>
            <div className="iframeWrap" style={{ marginTop: 10 }}>
              <iframe
                src={publicUrl}
                title="Preview página pública"
                style={{ width: '100%', height: 420, border: 0, background: '#fff' }}
              />
            </div>
            <div className="muted" style={{ marginTop: 8, wordBreak: 'break-all' }}>
              URL: <code>{publicUrl}</code>
            </div>

            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <Link to="/app/setup/identity" className="btn primary" style={{ justifyContent: 'center' }}>
                Vamos personalizar
              </Link>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="btn" style={{ justifyContent: 'center' }}>
                Abrir preview
              </a>
            </div>
          </div>

          <div className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
            <Link to="/app/demo" style={{ color: 'inherit', opacity: 0.6 }}>
              Opções avançadas
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
