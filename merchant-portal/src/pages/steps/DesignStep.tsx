import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetupContext } from '../../hooks'
import { fetchJson, internalHeaders } from '../../api'
import { toUserMessage } from '../../ui/errors'
import { updateWizardProgress } from '../../core/wizardProgress'
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../../core/storage/TabIsolatedStorage'
import '../../App.css'

/** Gera slug limpo a partir do nome */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'meu-restaurante'
}

/**
 * DesignStep — Passo 4: Design & Nível
 */
export function DesignStep() {
  const navigate = useNavigate()
  const { apiBase, internalToken, restaurantId, loadState, gates, profile } = useSetupContext()

  type Phase = 'theme' | 'link' | 'plan' | 'done'
  const [phase, setPhase] = useState<Phase>('theme')

  const storedName = getTabIsolated('chefiapp_name') || 'Sofia Gastrobar'
  const storedSlug = getTabIsolated('chefiapp_slug') || slugify(storedName)
  const wasManuallyEdited = getTabIsolated('chefiapp_slug_manual') === 'true'

  const [level, setLevel] = useState<'BASIC' | 'PRO' | 'EXPERIENCE'>(profile?.web_level || 'BASIC')
  const [theme, setTheme] = useState<'minimal' | 'light' | 'dark'>('minimal')
  const [slug, setSlug] = useState(storedSlug)
  const [slugManual, setSlugManual] = useState(wasManuallyEdited)

  // Sync slug com nome se não foi editado manualmente
  useEffect(() => {
    if (!slugManual) {
      const freshSlug = slugify(storedName)
      if (freshSlug !== slug) setSlug(freshSlug)
    }
  }, [storedName, slugManual])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!restaurantId) return
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await fetchJson(apiBase, `/internal/wizard/${encodeURIComponent(restaurantId)}/design`, {
        method: 'POST',
        headers: internalHeaders(internalToken),
        body: JSON.stringify({
          web_level: level,
          theme,
          slug,
        }),
      })
      
      // Persist wizard progress: mark design step as complete
      await updateWizardProgress(restaurantId, 'design', {
        web_level: level,
        theme,
        slug
      })
      
      setTabIsolated('chefiapp_slug', slug)
      if (slugManual) setTabIsolated('chefiapp_slug_manual', 'true')
      await loadState()
      setSaved(true)
      setPhase('done')
    } catch (e: any) {
      setError(toUserMessage(e, 'Não foi possível guardar o design agora. Tenta novamente.'))
    } finally {
      setBusy(false)
    }
  }

  const advancedLocked = gates.ok === false

  useEffect(() => {
    if (advancedLocked && level !== 'BASIC') setLevel('BASIC')
  }, [advancedLocked, level])

  if (phase === 'theme') {
    return (
      <div>
        <h2 className="h2">Escolhe o visual da tua página</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Seleciona um tema que combine com a identidade do teu restaurante. Podes mudar isto a qualquer momento.
        </p>

        <div className="card">
          <div className="h3">Tema</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {(['minimal', 'light', 'dark'] as const).map((t) => (
              <button key={t} className={`btn ${theme === t ? 'primary' : ''}`} onClick={() => setTheme(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="btn primary" onClick={() => setPhase('link')} style={{ width: '100%' }}>
            Escolher estilo
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'link') {
    return (
      <div>
        <h2 className="h2">Cria o teu link único</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Este será o link que vais partilhar nas redes sociais. Escolhe algo simples e memorável.
        </p>

        <div className="card">
          <div className="h3">Slug (URL)</div>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugManual(true)
            }}
            placeholder="nome-do-restaurante"
          />
          {slugManual && (
            <button
              className="btn"
              style={{ marginTop: 6, fontSize: 11, padding: '4px 8px' }}
              onClick={() => {
                setSlugManual(false)
                setSlug(slugify(storedName))
                removeTabIsolated('chefiapp_slug_manual')
              }}
            >
              ↺ Regenerar do nome
            </button>
          )}
          <div className="muted" style={{ marginTop: 6 }}>
            URL: /public/<b>{slug}</b>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
          <button className="btn primary" onClick={() => setPhase('plan')} style={{ width: '100%' }}>
            Confirmar link
          </button>
          <button className="btn" onClick={() => setPhase('theme')} style={{ width: '100%' }}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'plan') {
    return (
      <div>
        <h2 className="h2">Escolhe o nível da tua página</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Começa simples e faz upgrade quando quiseres mais funcionalidades. Podes mudar isto depois.
        </p>

        {advancedLocked && (
          <div className="banner warn" style={{ marginBottom: 16 }}>
            <div className="bannerTitle">🔒 Upgrade necessário</div>
            <div className="bannerText">{gates.message || 'Os níveis avançados requerem um plano superior.'}</div>
          </div>
        )}

        <div className="card">
          <div className="h3">Nível da página</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {(['BASIC', 'PRO', 'EXPERIENCE'] as const).map((l) => (
              <button
                key={l}
                className={`btn ${level === l ? 'primary' : ''}`}
                disabled={advancedLocked && l !== 'BASIC'}
                onClick={() => setLevel(l)}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            <strong>BASIC:</strong> Menu simples e direto • <strong>PRO:</strong> Hero image + design avançado • <strong>EXPERIENCE:</strong> Página premium completa
          </div>
        </div>

        {error && (
          <div className="banner warn" style={{ marginTop: 12 }}>
            <div className="bannerText">{error}</div>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
          <button className="btn primary" disabled={busy} onClick={handleSave} style={{ width: '100%' }}>
            {busy ? 'A guardar…' : 'Guardar e continuar'}
          </button>
          <button className="btn" disabled={busy} onClick={() => setPhase('link')} style={{ width: '100%' }}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // phase === 'done'
  return (
    <div>
      {saved && !error && (
        <div className="banner ok" style={{ marginBottom: 16 }}>
          <div className="bannerText">✓ Design atualizado</div>
        </div>
      )}

      {error && (
        <div className="banner warn" style={{ marginBottom: 16 }}>
          <div className="bannerText">{error}</div>
        </div>
      )}

      <h2 className="h2">✓ Design atualizado</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        Agora só falta publicar.
      </p>

      <button className="btn primary" onClick={() => navigate('/app/setup/publish')} style={{ width: '100%' }}>
        Continuar
      </button>
    </div>
  )
}
