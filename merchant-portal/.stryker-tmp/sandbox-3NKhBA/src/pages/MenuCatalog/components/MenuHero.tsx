/**
 * MenuHero — Hero cinematográfico: blur + gradiente, logo, nome, tagline, selos.
 * Contrato: MENU_VISUAL_RUNTIME_CONTRACT.md, MENU_HEADER_WAVE_CONTRACT.md.
 * Forma inferior do header = clip-path #hero-wave-clip (definido em MenuCatalogPageV2).
 */
// @ts-nocheck


import type { MenuRestaurant } from "../types";
import { Badge } from "./Badge";

const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80";

export interface MenuHeroProps {
  restaurant: MenuRestaurant;
  language?: string;
  onLanguageChange?: () => void;
}

export function MenuHero({
  restaurant,
  language = "pt",
  onLanguageChange,
}: MenuHeroProps) {
  const heroUrl = restaurant.heroMedia ?? DEFAULT_HERO;
  const isVideo = /\.(mp4|webm)(\?|$)/i.test(heroUrl);
  const seals = restaurant.seals ?? [];

  return (
    <header
      className="menu-hero fixed inset-x-0 top-0 w-full h-[70vh] min-h-[320px] z-100 flex flex-col items-center justify-end pb-6 overflow-hidden"
      style={{ clipPath: "url(#hero-wave-clip)" }}
    >
      {/* Hero background — imagem ou vídeo */}
      <div className="absolute inset-0 z-0">
        {isVideo ? (
          <video
            src={heroUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            aria-hidden
          />
        ) : (
          <img
            src={heroUrl}
            alt=""
            className="w-full h-full object-cover"
            aria-hidden
          />
        )}
        {/* Overlay: blur + gradiente escuro */}
        <div
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"
          aria-hidden
        />
      </div>

      {/* Top bar: idioma */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-end p-3">
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

      {/* Selos flutuantes — posicionados nos cantos */}
      {seals.length > 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-start justify-between p-4 pt-14">
          <div className="flex flex-col gap-2">
            {seals.slice(0, 2).map((s) => (
              <Badge key={s} kind={s} className="shadow-lg" />
            ))}
          </div>
          <div className="flex flex-col gap-2 items-end">
            {seals.slice(2, 4).map((s) => (
              <Badge key={s} kind={s} className="shadow-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Logo (pequeno) ou monograma + nome + tagline — contrato: sem foto de ambiente no centro */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {restaurant.logoUrl ? (
          <img
            src={restaurant.logoUrl}
            alt=""
            className="max-w-[80px] max-h-[80px] w-20 h-20 object-contain drop-shadow-2xl"
            aria-hidden
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center text-neutral-800 text-2xl font-bold drop-shadow-xl"
            aria-hidden
          >
            {restaurant.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <h1 className="mt-4 text-2xl md:text-4xl font-bold text-white drop-shadow-lg text-center">
          {restaurant.name}
        </h1>
        {restaurant.tagline && (
          <p className="mt-2 text-white/95 text-base md:text-lg font-medium max-w-md">
            {restaurant.tagline}
          </p>
        )}
      </div>
    </header>
  );
}
