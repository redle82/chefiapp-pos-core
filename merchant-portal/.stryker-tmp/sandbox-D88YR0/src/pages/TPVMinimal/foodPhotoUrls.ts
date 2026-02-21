/**
 * URLs de fotos de comida por categoria (Unsplash verificadas).
 * Usado no TPV quando product.photo_url está vazio ou falha ao carregar.
 */

const U = "https://images.unsplash.com/photo-";
const Q = "?w=800&q=80";

/** Mapa nome da categoria (normalizado) → URL de imagem de comida */
const FOOD_PHOTOS_BY_CATEGORY: Record<string, string> = {
  tapas: `${U}1573080496219-bb080dd4f877${Q}`,
  entradas: `${U}1573080496219-bb080dd4f877${Q}`,
  gastroburgers: `${U}1568901346375-23c9450c58cd${Q}`,
  burgers: `${U}1568901346375-23c9450c58cd${Q}`,
  pizzas: `${U}1565299624946-b28f40a0ae38${Q}`,
  artesanas: `${U}1565299624946-b28f40a0ae38${Q}`,
  platos: `${U}1544025162-d76694265947${Q}`,
  principales: `${U}1544025162-d76694265947${Q}`,
  ensaladas: `${U}1512621776951-a57141f2eefd${Q}`,
  zumos: `${U}1535958636474-b021ee887b13${Q}`,
  bowls: `${U}1590301157890-4810ed352733${Q}`,
  postres: `${U}1578985545062-69928b1d9587${Q}`,
  sangrías: `${U}1514362545857-3bc16c4c7d1b${Q}`,
  cocteles: `${U}1514362545857-3bc16c4c7d1b${Q}`,
  copas: `${U}1514362545857-3bc16c4c7d1b${Q}`,
  chupitos: `${U}1514362545857-3bc16c4c7d1b${Q}`,
  licores: `${U}1514362545857-3bc16c4c7d1b${Q}`,
  vinos: `${U}1510812431401-41d2bd2722f3${Q}`,
  espumantes: `${U}1510812431401-41d2bd2722f3${Q}`,
  cervezas: `${U}1535958636474-b021ee887b13${Q}`,
  refrescos: `${U}1535958636474-b021ee887b13${Q}`,
  tostadas: `${U}1509440159596-0249088772ff${Q}`,
  croissants: `${U}1509440159596-0249088772ff${Q}`,
  cafés: `${U}1495474472287-4d71bcdd2085${Q}`,
  infusiones: `${U}1495474472287-4d71bcdd2085${Q}`,
  vip: `${U}1514362545857-3bc16c4c7d1b${Q}`,
  party: `${U}1514362545857-3bc16c4c7d1b${Q}`,
};

/** Imagem genérica de prato (fallback final) */
const DEFAULT_FOOD_PHOTO = `${U}1565299505197-2ab0d9a65e2a${Q}`;

function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Devolve uma URL de foto de comida para a categoria.
 * Usado quando product.photo_url está vazio ou falha.
 */
export function getFoodPhotoUrl(
  categoryId?: string | null,
  categoryName?: string | null,
): string {
  if (!categoryName) return DEFAULT_FOOD_PHOTO;
  const normalized = normalizeCategoryName(categoryName);
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    const url = FOOD_PHOTOS_BY_CATEGORY[word];
    if (url) return url;
  }
  return DEFAULT_FOOD_PHOTO;
}
