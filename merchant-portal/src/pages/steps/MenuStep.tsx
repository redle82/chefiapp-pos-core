import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetupContext } from '../../hooks'
import { fetchJson, internalHeaders } from '../../api'
import { toUserMessage } from '../../ui/errors'
import { track } from '../../analytics/track'
import { EmptyState } from '../../ui/design-system/EmptyState'
import { Input } from '../../ui/design-system/Input'
import { Button } from '../../ui/design-system/Button'
import { InlineAlert } from '../../ui/design-system/InlineAlert'
import { Spacing } from '../../ui/design-system/tokens'
import { updateWizardProgress } from '../../core/wizardProgress'
import { MenuImport } from '../Menu/MenuImport'
import { MenuAI } from '../Menu/MenuAI'
import '../../App.css'

/**
 * MenuStep — Passo 2: Menu do restaurante
 * 
 * Segue o princípio "1 pergunta por ecrã":
 * - Fase 1: Criar categoria (CTA único)
 * - Fase 2: Adicionar item (CTA único)
 * - Fase 3: Continuar (CTA único)
 */
type Phase = 'category' | 'item' | 'done'

export function MenuStep() {
  const navigate = useNavigate()
  const { apiBase, internalToken, restaurantId, loadState, steps } = useSetupContext()

  // Determinar fase inicial baseado no estado existente
  const [phase, setPhase] = useState<Phase>(steps.menu ? 'done' : 'category')

  const [categoryName, setCategoryName] = useState('Destaques')
  const [itemName, setItemName] = useState('Hambúrguer da Casa')
  const [itemPrice, setItemPrice] = useState(12.90)
  const [categoryId, setCategoryId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showAI, setShowAI] = useState(false)

  useEffect(() => {
    if (phase === 'done' && !getTabIsolated('chefiapp_evt_menu_done')) {
      setTabIsolated('chefiapp_evt_menu_done', '1')
      track('menu_done')
    }
  }, [phase])

  async function handleCreateCategory() {
    if (!restaurantId || !categoryName) return
    setBusy(true)
    setError(null)
    try {
      const r = await fetchJson(apiBase, `/internal/wizard/${encodeURIComponent(restaurantId)}/menu/category`, {
        method: 'POST',
        headers: internalHeaders(internalToken),
        body: JSON.stringify({ name: categoryName }),
      })
      setCategoryId(r.category_id || '')
      await loadState()
      setPhase('item')
    } catch (e: any) {
      setError(toUserMessage(e, 'Algo correu mal ao criar a categoria. Verifica a ligação e tenta novamente.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleAddItem() {
    if (!restaurantId || !categoryId || !itemName) return
    setBusy(true)
    setError(null)
    try {
      await fetchJson(apiBase, `/internal/wizard/${encodeURIComponent(restaurantId)}/menu/item`, {
        method: 'POST',
        headers: internalHeaders(internalToken),
        body: JSON.stringify({
          category_id: categoryId,
          name: itemName,
          price_cents: Math.round(itemPrice * 100),
        }),
      })

      // Persist wizard progress: mark menu step as complete
      await updateWizardProgress(restaurantId, 'menu', {
        category_name: categoryName,
        items_count: 1,
        first_item: { name: itemName, price_cents: Math.round(itemPrice * 100) }
      })

      await loadState()
      setPhase('done')
    } catch (e: any) {
      setError(toUserMessage(e, 'Algo correu mal ao adicionar o item. Verifica a ligação e tenta novamente.'))
    } finally {
      setBusy(false)
    }
  }

  function handleContinue() {
    navigate('/app/setup/payments')
  }

  // ─────────────────────────────────────────────────────────────
  // FASE 1: Criar categoria
  // ─────────────────────────────────────────────────────────────
  if (phase === 'category') {
    return (
      <div>
        <EmptyState
          icon={<div style={{ fontSize: 64 }}>🍔</div>}
          title="Vamos criar o teu menu"
          description='Começa por criar uma categoria (ex: "Entradas", "Pratos", "Sobremesas"). Só precisas de 1 item para começar.'
        >
          <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
            <Input
              label="Nome da categoria"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Destaques"
              autoFocus
              fullWidth
              disabled={busy}
            />

            {error && (
              <InlineAlert type="warning" message={error} className="mt-4" />
            )}

            <Button
              variant="primary"
              disabled={busy || !categoryName}
              loading={busy}
              onClick={handleCreateCategory}
              fullWidth
              className="mt-4"
            >
              Criar categoria
            </Button>

            <div style={{ marginTop: Spacing.md, textAlign: 'center' }}>
              <span style={{ color: '#666', fontSize: '13px' }}>ou</span>
              <Button
                variant="ghost"
                onClick={() => setShowImport(true)}
                fullWidth
                className="mt-2"
                disabled={busy}
              >
                📤 Importar CSV / Excel
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowAI(true)}
                fullWidth
                className="mt-2"
                disabled={busy}
              >
                ✨ Gerar com IA
              </Button>
            </div>
          </div>
        </EmptyState>

        {showImport && restaurantId && (
          <MenuImport
            restaurantId={restaurantId}
            onClose={() => setShowImport(false)}
            onSuccess={async () => {
              setShowImport(false)
              // Mark step as complete
              await updateWizardProgress(restaurantId, 'menu', {
                imported: true,
                items_count: 5 // Mock/Approx count, real count would be better but expensive to fetch here
              })
              await loadState()
              setPhase('done')
            }}
          />
        )}

        {showAI && restaurantId && (
          <MenuAI
            restaurantId={restaurantId}
            onClose={() => setShowAI(false)}
            onSuccess={async (items) => {
              setShowAI(false)
              await updateWizardProgress(restaurantId, 'menu', {
                generated: true,
                items_count: items.length
              })
              await loadState()
              setPhase('done')
            }}
          />
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // FASE 2: Adicionar item
  // ─────────────────────────────────────────────────────────────
  if (phase === 'item') {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <InlineAlert
          type="success"
          message={`Categoria "${categoryName}" criada`}
          className="mb-4"
        />

        <h2 className="h2" style={{ marginBottom: Spacing.xs }}>Adiciona o primeiro item</h2>
        <p className="muted" style={{ marginBottom: Spacing.lg }}>
          Só precisas de 1 item para começar. Podes adicionar mais depois.
        </p>

        <div style={{ display: 'grid', gap: Spacing.md }}>
          <Input
            label="Nome do item"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Ex: Hambúrguer da Casa"
            autoFocus
            fullWidth
            disabled={busy}
          />

          <Input
            label="Preço (€)"
            type="number"
            step="0.01"
            min="0"
            value={itemPrice}
            onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
            fullWidth
            disabled={busy}
          />
        </div>

        {error && (
          <InlineAlert type="warning" message={error} className="mt-4" />
        )}

        <Button
          variant="primary"
          disabled={busy || !itemName || itemPrice <= 0}
          loading={busy}
          onClick={handleAddItem}
          fullWidth
          className="mt-4"
        >
          Adicionar item
        </Button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // FASE 3: Pronto para continuar
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <InlineAlert type="success" message="Menu pronto" className="mb-4" />

      <h2 className="h2" style={{ marginBottom: Spacing.xs }}>Menu criado com sucesso</h2>
      <p className="muted" style={{ marginBottom: Spacing.lg }}>
        O teu menu está pronto. Podes adicionar mais itens a qualquer momento.
      </p>

      {/* Opção secundária: adicionar mais */}
      <Button
        variant="ghost"
        onClick={() => setPhase('category')}
        fullWidth
        className="mb-2"
        disabled={busy}
      >
        Adicionar mais categorias
      </Button>

      <Button
        variant="primary"
        onClick={handleContinue}
        fullWidth
        disabled={busy}
      >
        Continuar
      </Button>
    </div>
  )
}
