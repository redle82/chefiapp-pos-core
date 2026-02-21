/**
 * AllergenIcons — Alergénios apenas com ícones (sem texto longo)
 * Contrato: MENU_VISUAL_CONTRACT.md — ícones reconhecíveis
 * Chaves: gluten, lacteos, huevos, crustaceos, frutos_secos, soja, etc.
 */

const ALLERGEN_MAP: Record<string, { emoji: string; label: string }> = {
  gluten: { emoji: "🌾", label: "Glúten" },
  lacteos: { emoji: "🥛", label: "Laticínios" },
  huevos: { emoji: "🥚", label: "Ovos" },
  crustaceos: { emoji: "🦐", label: "Crustáceos" },
  frutos_secos: { emoji: "🥜", label: "Frutos de casca rija" },
  soja: { emoji: "🫘", label: "Soja" },
  peixe: { emoji: "🐟", label: "Peixe" },
  apio: { emoji: "🥬", label: "Aipo" },
  mostaza: { emoji: "🟡", label: "Mostarda" },
  sesamo: { emoji: "⚪", label: "Sésamo" },
  sulfitos: { emoji: "🍷", label: "Sulfitos" },
  lupulo: { emoji: "🌿", label: "Tremoço" },
  moluscos: { emoji: "🦪", label: "Moluscos" },
};

function getInfo(key: string): { emoji: string; label: string } {
  const normalized = key.toLowerCase().replace(/\s+/g, "_");
  return (
    ALLERGEN_MAP[normalized] ?? {
      emoji: "⚠️",
      label: key,
    }
  );
}

export interface AllergenIconsProps {
  allergens: string[];
  className?: string;
}

export function AllergenIcons({ allergens, className = "" }: AllergenIconsProps) {
  if (allergens.length === 0) return null;
  return (
    <div
      className={`flex flex-wrap gap-1.5 items-center ${className}`}
      role="list"
      aria-label="Alergénios"
    >
      {allergens.map((key) => {
        const { emoji, label } = getInfo(key);
        return (
          <span
            key={key}
            role="listitem"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-lg leading-none"
            title={label}
            aria-label={label}
          >
            {emoji}
          </span>
        );
      })}
    </div>
  );
}
