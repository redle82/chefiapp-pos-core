/**
 * MenuState — Estado operacional do menu (MENU_OPERATIONAL_STATE)
 *
 * Uma única fonte de verdade para o estado do menu: EMPTY | INCOMPLETE | VALID_UNPUBLISHED | LIVE.
 * Consumido por Dashboard, TPV, KDS, QR/Web, Config, Sidebar.
 *
 * @see docs/architecture/MENU_OPERATIONAL_STATE.md
 */
// @ts-nocheck


import { useMemo } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";

export type MenuState =
  | "EMPTY"
  | "INCOMPLETE"
  | "VALID_UNPUBLISHED"
  | "LIVE";

/** Secções obrigatórias para publicação (canPublish). Ref: OnboardingContext. */
const REQUIRED_SECTIONS = [
  "identity",
  "location",
  "schedule",
  "menu",
  "people",
] as const;

export type SetupStatusLike = Record<string, boolean>;

export interface MenuStateInput {
  /** Secção menu completa (setup_status.menu ou equivalente). */
  menuDefined: boolean;
  /** Restaurante publicado (runtime.mode === 'active' / isPublished). */
  published: boolean;
  /** Setup status para derivar canPublish (identity, location, schedule, menu, people). */
  setupStatus: SetupStatusLike;
}

/**
 * Deriva MenuState a partir de entradas (sem alterar schema).
 * Critérios conforme MENU_OPERATIONAL_STATE.md secção 2.
 */
export function deriveMenuState(input: MenuStateInput): MenuState {
  const { menuDefined, published, setupStatus } = input;

  const canPublish = REQUIRED_SECTIONS.every(
    (section) => setupStatus[section] === true
  );

  if (!menuDefined) return "EMPTY";
  if (menuDefined && !canPublish) return "INCOMPLETE";
  if (menuDefined && canPublish && !published) return "VALID_UNPUBLISHED";
  if (published && menuDefined) return "LIVE";

  return "EMPTY";
}

/** Mensagens humanas por estado (MENU_OPERATIONAL_STATE secção 5). */
export const MENU_STATE_MESSAGES: Record<
  MenuState,
  { short: string; blockTpv: string }
> = {
  EMPTY: {
    short: "Adicione itens ao menu para poder publicar e vender.",
    blockTpv:
      "O menu ainda está vazio. Crie itens no Menu Builder e publique o menu para começar a vender.",
  },
  INCOMPLETE: {
    short:
      "Menu em edição. Complete identidade, localização, horários e pessoas para poder publicar.",
    blockTpv:
      "O menu ainda não está pronto para venda. Complete o setup no Dashboard e publique o menu.",
  },
  VALID_UNPUBLISHED: {
    short: "Menu pronto, mas ainda não publicado.",
    blockTpv:
      "O menu ainda não foi publicado. Publique o menu no Dashboard para começar a vender.",
  },
  LIVE: {
    short: "Menu publicado e disponível para venda.",
    blockTpv: "",
  },
};

/** Copy para QR/Web quando não LIVE. */
export const MENU_NOT_LIVE_WEB_MESSAGE =
  "O cardápio ainda não está disponível. Volte em breve.";

/**
 * Hook que deriva MenuState a partir do RestaurantRuntime.
 * Consumido por ORE, BlockingScreen, Dashboard, TPV, QR/Web.
 */
export function useMenuState(): MenuState {
  const { runtime } = useRestaurantRuntime();
  return useMemo(
    () =>
      deriveMenuState({
        menuDefined: runtime.setup_status?.menu === true,
        published: runtime.mode === "active" || runtime.isPublished,
        setupStatus: runtime.setup_status ?? {},
      }),
    [runtime.setup_status, runtime.mode, runtime.isPublished]
  );
}
