/**
 * RestaurantHeader — Cabeçalho do restaurante (hero, logo, nome, selo)
 * Contrato: MENU_VISUAL_CONTRACT.md
 * O cliente tem de saber onde está antes do que vai comer.
 */

export interface RestaurantHeaderProps {
  restaurantName: string;
  heroImageUrl?: string;
  logoUrl?: string;
  badgeLabel?: string;
  language?: string;
  onLanguageChange?: () => void;
}

const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80";

export function RestaurantHeader({
  restaurantName,
  heroImageUrl = DEFAULT_HERO,
  logoUrl,
  badgeLabel,
  language = "pt",
  onLanguageChange,
}: RestaurantHeaderProps) {
  return (
    <header className="relative w-full min-h-[28vh] md:min-h-[32vh] flex flex-col items-center justify-end pb-6 overflow-hidden">
      {/* Hero background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImageUrl}
          alt=""
          className="w-full h-full object-cover"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-neutral-900/50"
          aria-hidden
        />
      </div>

      {/* Top bar: idioma / partilha */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-end gap-2 p-3">
        {onLanguageChange && (
          <button
            type="button"
            onClick={onLanguageChange}
            className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30"
            aria-label="Selecionar idioma"
          >
            {language === "pt" ? "PT" : language === "es" ? "ES" : "EN"}
          </button>
        )}
      </div>

      {/* Logo central */}
      <div className="relative z-10 flex flex-col items-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="w-24 h-24 md:w-[180px] md:h-[180px] object-contain drop-shadow-lg"
            aria-hidden
          />
        ) : (
          <div
            className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/90 flex items-center justify-center text-neutral-800 text-2xl md:text-4xl font-bold"
            aria-hidden
          >
            {restaurantName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <h1 className="mt-3 text-2xl md:text-4xl font-bold text-white drop-shadow-md text-center px-4">
          {restaurantName}
        </h1>
        {badgeLabel && (
          <span
            className="mt-2 px-4 py-1.5 rounded-full bg-red-600 text-white text-sm font-semibold uppercase tracking-wide"
            aria-hidden
          >
            {badgeLabel}
          </span>
        )}
      </div>
    </header>
  );
}
