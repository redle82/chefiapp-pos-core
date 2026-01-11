import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetupContext } from '../../hooks'
import { fetchJson, internalHeaders } from '../../api'
import { toUserMessage } from '../../ui/errors'
import { updateWizardProgress } from '../../core/wizardProgress'
import { track } from '../../analytics/track'
import { getTabIsolated, setTabIsolated } from '../../core/storage/TabIsolatedStorage'
import '../../App.css'

/** Gera slug limpo a partir do nome */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'meu-restaurante'
}

/**
 * IdentityStep — Passo 1: Identidade do restaurante
 */
export function IdentityStep() {
  const navigate = useNavigate()
  const { apiBase, internalToken, restaurantId, loadState } = useSetupContext()

  const [name, setName] = useState(getTabIsolated('chefiapp_name') || 'Sofia Gastrobar')
  const [tagline, setTagline] = useState('Menu online')
  const [phone, setPhone] = useState('+351000000000')
  const [address, setAddress] = useState('Lisboa')
  const [hours, setHours] = useState('12h–23h')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!restaurantId) {
      setError('Ainda não conseguimos criar o teu espaço. Volta ao início para começar.')
      return
    }
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await fetchJson(apiBase, `/internal/wizard/${encodeURIComponent(restaurantId)}/identity`, {
        method: 'POST',
        headers: internalHeaders(internalToken),
        body: JSON.stringify({
          name,
          tagline,
          contacts: { phone, address, hours },
        }),
      })
      
      // Persist wizard progress: mark identity step as complete
      await updateWizardProgress(restaurantId, 'identity', {
        name,
        tagline,
        contacts: { phone, address, hours }
      })
      
      // Guardar nome e slug auto-gerado
      setTabIsolated('chefiapp_name', name)
      // Só gerar slug se não foi manualmente editado
      if (!getTabIsolated('chefiapp_slug_manual')) {
        setTabIsolated('chefiapp_slug', slugify(name))
      }
      await loadState()
      setSaved(true)
      track('identity_done', { name_length: name.length })
      navigate('/app/setup/menu')
    } catch (e: any) {
      setError(toUserMessage(e, 'Algo correu mal ao guardar. Verifica a tua ligação e tenta novamente.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="h2">Como queres que os clientes te encontrem?</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        O nome do teu restaurante será a primeira impressão. Podes mudar isto depois.
      </p>

      <div className="grid">
        <label>
          Nome do negócio
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="O teu restaurante" />
        </label>
        <label>
          Tagline
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ex: Menu online" />
        </label>
        <label>
          Telefone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351..." />
        </label>
        <label>
          Morada
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Cidade ou rua" />
        </label>
        <label>
          Horário
          <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="12h–23h" />
        </label>
      </div>

      {error && (
        <div className="banner warn" style={{ marginTop: 12 }}>
          <div className="bannerText">{error}</div>
        </div>
      )}

      {saved && !error && (
        <div className="banner ok" style={{ marginTop: 12 }}>
          <div className="bannerText">✓ Identidade criada com sucesso</div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button className="btn primary" disabled={busy || !name} onClick={handleSave}>
          {busy ? 'A criar identidade…' : name ? 'Criar identidade e continuar' : 'Preenche o nome para continuar'}
        </button>
      </div>
    </div>
  )
}
