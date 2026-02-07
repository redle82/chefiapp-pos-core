/**
 * Badge — Selo por prato ou restaurante (Chef, TripAdvisor, Mais pedido, etc.)
 * Contrato: MENU_VISUAL_CONTRACT.md — selos visuais sem texto longo
 */

export type BadgeKind =
  | "chef"
  | "tripadvisor"
  | "mais_pedido"
  | "veggie"
  | "novidade"
  | "recomendado";

const BADGE_LABELS: Record<BadgeKind, string> = {
  chef: "Recomendado pelo Chef",
  tripadvisor: "TripAdvisor",
  mais_pedido: "Mais pedido",
  veggie: "Vegetariano",
  novidade: "Novidade",
  recomendado: "Recomendado",
};

const BADGE_STYLES: Record<BadgeKind, string> = {
  chef: "bg-amber-600 text-white",
  tripadvisor: "bg-emerald-700 text-white",
  mais_pedido: "bg-red-600 text-white",
  veggie: "bg-green-600 text-white",
  novidade: "bg-violet-600 text-white",
  recomendado: "bg-neutral-800 text-white",
};

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
