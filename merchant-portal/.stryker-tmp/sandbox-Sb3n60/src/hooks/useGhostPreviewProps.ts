import { useSetupContext } from './useSetupContext'
import type { GhostPreviewProps } from '../components/GhostPreview'
import { getTabIsolated } from '../core/storage/TabIsolatedStorage'

/**
 * Hook que traduz estado real do onboarding para props do GhostPreview
 * Centraliza lógica: "o que mostrar emocionalmente agora"
 */
export function useGhostPreviewProps(): GhostPreviewProps {
  const onboarding = useSetupContext()
  const { steps, profile } = onboarding

  // Determinar stage baseado em completion
  const stage: GhostPreviewProps['stage'] =
    !steps.identity ? 'identity'
    : !steps.menu ? 'menu'
    : !steps.design ? 'design'
    : 'ready'

  // Extrair dados do TabIsolatedStorage (fallback) e profile
  const restaurantName = profile?.name || getTabIsolated('chefiapp_name') || 'O teu restaurante'
  const tagline = getTabIsolated('chefiapp_tagline') || 'Página em preparação'

  // Extrair design (TabIsolatedStorage como fallback)
  const designJson = getTabIsolated('chefiapp_design')
  const design = designJson ? JSON.parse(designJson) : {}

  const primaryColor = design.primaryColor || '#C9A227'
  const secondaryColor = design.secondaryColor || '#1f2933'
  const backgroundMode = design.backgroundMode || 'dark'
  const accentStyle = design.accentStyle || 'soft'

  // Extrair menu (TabIsolatedStorage como fallback)
  const menuJson = getTabIsolated('chefiapp_menu')
  const menu = menuJson ? JSON.parse(menuJson) : null

  // Montar props finais
  return {
    restaurantName,
    tagline,
    theme: {
      primaryColor,
      secondaryColor,
      background: backgroundMode === 'light' ? 'light' : 'dark',
      accentStyle: accentStyle === 'bold' ? 'bold' : 'soft',
    },
    menuPreview: menu?.categories && menu.categories.length > 0
      ? {
          categories: menu.categories.slice(0, 2).map((cat: { name: string; items?: Array<{ name: string; price?: string }> }) => ({
            name: cat.name,
            items: (cat.items || []).slice(0, 3),
          })),
        }
      : undefined,
    stage,
    badge: 'preview',
    progress: {
      identity: steps.identity,
      menu: steps.menu,
      design: steps.design,
    },
  }
}
