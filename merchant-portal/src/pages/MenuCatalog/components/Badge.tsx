/**
 * Badge — Selo por prato ou restaurante (Chef, TripAdvisor, Mais pedido, etc.)
 * Contrato: MENU_VISUAL_CONTRACT.md — selos visuais sem texto longo
 *
 * V2: Emojis + cores distintas para máximo visual impact
 * - Chef: 👨‍🍳 Ouro
 * - Mais Pedido: 🔥 Vermelho
 * - Novidade: ✨ Turquesa
 * - Veggie: 🌱 Verde
 * - Vegan: 🥬 Verde escuro
 * - Picante: 🌶️ Laranja
 * - TripAdvisor: ⭐ Emerald
 */

export type BadgeKind =
  | "chef"
  | "tripadvisor"
  | "mais_pedido"
  | "veggie"
  | "vegan"
  | "spicy"
  | "novidade"
  | "recomendado";

interface BadgeConfig {
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
}

const BADGE_CONFIG: Record<BadgeKind, BadgeConfig> = {
  chef: {
    label: "Recomendado pelo Chef",
    emoji: "👨‍🍳",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
  },
  tripadvisor: {
    label: "TripAdvisor",
    emoji: "⭐",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
  },
  mais_pedido: {
    label: "Mais pedido",
    emoji: "🔥",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
  },
  veggie: {
    label: "Vegetariano",
    emoji: "🌱",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
  vegan: {
    label: "Vegano",
    emoji: "🥬",
    bgColor: "bg-green-200",
    textColor: "text-green-800",
  },
  spicy: {
    label: "Picante",
    emoji: "🌶️",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
  },
  novidade: {
    label: "Novidade",
    emoji: "✨",
    bgColor: "bg-cyan-100",
    textColor: "text-cyan-700",
  },
  recomendado: {
    label: "Recomendado",
    emoji: "👍",
    bgColor: "bg-neutral-200",
    textColor: "text-neutral-700",
  },
};

const BADGE_LABELS: Record<BadgeKind, string> = Object.fromEntries(
  Object.entries(BADGE_CONFIG).map(([key, config]) => [key, config.label]),
) as Record<BadgeKind, string>;

const BADGE_STYLES: Record<BadgeKind, string> = Object.fromEntries(
  Object.entries(BADGE_CONFIG).map(([key, config]) => [
    key,
    `${config.bgColor} ${config.textColor}`,
  ]),
) as Record<BadgeKind, string>;

export interface BadgeProps {
  kind: BadgeKind | string;
  label?: string;
  className?: string;
}

function resolveKind(kind: BadgeKind | string): BadgeKind {
  if (kind in BADGE_LABELS) return kind as BadgeKind;
  return "recomendado";
}

export function Badge({ kind, label, className = "" }: BadgeProps) {
  const k = resolveKind(kind);
  const resolvedLabel = label ?? BADGE_LABELS[k] ?? kind;
  const style = BADGE_STYLES[k];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${style} ${className}`}
      title={resolvedLabel}
    >
      {resolvedLabel}
    </span>
  );
}
