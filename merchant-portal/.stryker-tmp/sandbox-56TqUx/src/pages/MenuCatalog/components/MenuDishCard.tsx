/**
 * MenuDishCard — Card de prato (media edge-to-edge, nome, descrição, alergénios ícones, preço, botões)
 * Contrato: MENU_VISUAL_CONTRACT.md — Seduz → Confirma → Executa
 * MENU_VISUAL_RUNTIME_CONTRACT.md — Cards: microvídeo (mp4/WebP animado, loop 2–3s), badges em camada sobre a imagem, alergénios em ícones.
 * V2: mediaPreview (micro-vídeo), badges, AllergenIcons. Botões mín. 44px.
 */
// @ts-nocheck


import type { CatalogItem } from "../types";
import { formatPrice } from "../types";
import { AllergenIcons } from "./AllergenIcons";
import { Badge } from "./Badge";

export interface MenuDishCardProps {
  item: CatalogItem;
  onVerPrato: (item: CatalogItem) => void;
  onPedir?: (item: CatalogItem) => void;
  /** true = usa badges + AllergenIcons (V2); false = texto alergénios (baseline) */
  usePremium?: boolean;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm)(\?|$)/i.test(url);
}

export function MenuDishCard({
  item,
  onVerPrato,
  onPedir,
  usePremium = false,
}: MenuDishCardProps) {
  const mediaUrl = item.mediaPreview ?? item.imageUrl;
  const isVideo = !!item.mediaPreview && isVideoUrl(item.mediaPreview);
  const badges = item.badges ?? [];

  return (
    <article className="bg-white overflow-hidden shadow-sm">
      {/* Media edge-to-edge — imagem ou micro-vídeo (contrato: mp4 curto ou WebP animado, loop 2–3s; autoplay muted loop playsinline) */}
      <div className="aspect-4/3 bg-neutral-200 w-full overflow-hidden relative">
        {isVideo ? (
          <video
            src={mediaUrl}
            muted
            loop
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            aria-hidden
          />
        ) : (
          <img
            src={mediaUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {/* Badges em camada sobre a imagem (contrato: nunca abaixo do media) */}
        {usePremium && badges.length > 0 && (
          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <Badge key={b} kind={b} className="shadow" />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900 leading-tight">
          {item.title}
        </h2>
        <p className="text-neutral-600 text-base leading-snug line-clamp-2">
          {item.description}
        </p>
        {/* Alergénios: ícones (V2) ou texto (baseline) */}
        {item.allergens.length > 0 &&
          (usePremium ? (
            <AllergenIcons allergens={item.allergens} className="pt-1" />
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Alergénios:
              </span>
              {item.allergens.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 text-sm"
                >
                  {a}
                </span>
              ))}
            </div>
          ))}
        <div className="pt-2">
          <span className="text-lg md:text-xl font-bold text-neutral-900">
            {formatPrice(item.priceCents)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3">
          <button
            type="button"
            onClick={() => onVerPrato(item)}
            className="min-h-[44px] py-3 px-4 rounded-lg border-2 border-neutral-800 text-neutral-800 font-semibold text-base"
          >
            Ver prato
          </button>
          <button
            type="button"
            onClick={() => onPedir?.(item)}
            className="min-h-[44px] py-3 px-4 rounded-lg bg-green-600 text-white font-semibold text-base hover:bg-green-700"
          >
            Pedir à cozinha
          </button>
        </div>
      </div>
    </article>
  );
}
