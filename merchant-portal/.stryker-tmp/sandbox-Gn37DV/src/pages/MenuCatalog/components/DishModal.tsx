/**
 * DishModal — Full-screen do prato (mesma narrativa: media, texto, preço, botões)
 * Contrato: MENU_VISUAL_CONTRACT.md — Seduz → Confirma → Executa
 * V2: mediaFull (vídeo), badges, AllergenIcons.
 */

import type { CatalogItem } from "../types";
import { formatPrice } from "../types";
import { Badge } from "./Badge";
import { AllergenIcons } from "./AllergenIcons";

export interface DishModalProps {
  item: CatalogItem;
  onClose: () => void;
  onPedir?: (item: CatalogItem) => void;
  usePremium?: boolean;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm)(\?|$)/i.test(url);
}

export function DishModal({
  item,
  onClose,
  onPedir,
  usePremium = false,
}: DishModalProps) {
  const mediaUrl = item.mediaFull ?? item.imageUrl;
  const isVideo = isVideoUrl(mediaUrl);
  const badges = item.badges ?? [];

  return (
    <div
      className="fixed inset-0 z-[200] bg-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhe: ${item.title}`}
    >
      <header className="flex items-center justify-between p-4 border-b border-neutral-200 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] p-2 -ml-2 rounded-lg hover:bg-neutral-100 font-semibold text-neutral-800"
          aria-label="Fechar"
        >
          ← Voltar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
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
            />
          )}
          {usePremium && badges.length > 0 && (
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-2">
              {badges.map((b) => (
                <Badge key={b} kind={b} />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            {item.title}
          </h1>
          <p className="text-neutral-600 text-base leading-snug">
            {item.description}
          </p>
          {item.allergens.length > 0 &&
            (usePremium ? (
              <AllergenIcons allergens={item.allergens} />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
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
          <p className="text-xl font-bold text-neutral-900">
            {formatPrice(item.priceCents)}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] py-3 rounded-lg border-2 border-neutral-800 font-semibold text-base"
            >
              Ver carta
            </button>
            <button
              type="button"
              onClick={() => onPedir?.(item)}
              className="min-h-[44px] py-3 rounded-lg bg-green-600 text-white font-semibold text-base hover:bg-green-700"
            >
              Pedir à cozinha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
