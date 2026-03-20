/**
 * Product Translation Service — Multi-language menu support per product.
 */
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

export interface ProductTranslation {
  productId: string;
  locale: string;
  name: string;
  description?: string;
}

export async function setTranslation(
  productId: string,
  locale: string,
  data: { name: string; description?: string }
): Promise<boolean> {
  try {
    const db = await getDockerCoreFetchClient();
    await db.from("gm_product_translations").upsert(
      {
        product_id: productId,
        locale,
        name: data.name,
        description: data.description || "",
      },
      { onConflict: "product_id,locale" }
    );
    return true;
  } catch {
    return false;
  }
}

export async function getTranslation(
  productId: string,
  locale: string
): Promise<ProductTranslation | null> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db
      .from("gm_product_translations")
      .select("product_id, locale, name, description")
      .eq("product_id", productId)
      .eq("locale", locale)
      .single();
    if (!data) return null;
    return {
      productId: data.product_id,
      locale: data.locale,
      name: data.name,
      description: data.description,
    };
  } catch {
    return null;
  }
}

export async function getTranslations(
  productId: string
): Promise<ProductTranslation[]> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db
      .from("gm_product_translations")
      .select("product_id, locale, name, description")
      .eq("product_id", productId);
    return (data || []).map((row: Record<string, string>) => ({
      productId: row.product_id,
      locale: row.locale,
      name: row.name,
      description: row.description,
    }));
  } catch {
    return [];
  }
}

export async function bulkSetTranslations(
  translations: { productId: string; locale: string; name: string; description?: string }[]
): Promise<boolean> {
  try {
    const db = await getDockerCoreFetchClient();
    await db.from("gm_product_translations").upsert(
      translations.map((t) => ({
        product_id: t.productId,
        locale: t.locale,
        name: t.name,
        description: t.description || "",
      })),
      { onConflict: "product_id,locale" }
    );
    return true;
  } catch {
    return false;
  }
}

export async function getUntranslatedProducts(
  restaurantId: string,
  locale: string
): Promise<{ id: string; name: string }[]> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data: products } = await db
      .from("gm_products")
      .select("id, name")
      .eq("restaurant_id", restaurantId)
      .eq("active", true);

    if (!products?.length) return [];

    const { data: translations } = await db
      .from("gm_product_translations")
      .select("product_id")
      .eq("locale", locale)
      .in(
        "product_id",
        products.map((p: { id: string }) => p.id)
      );

    const translatedIds = new Set(
      (translations || []).map((t: { product_id: string }) => t.product_id)
    );

    return products
      .filter((p: { id: string }) => !translatedIds.has(p.id))
      .map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
  } catch {
    return [];
  }
}

export function getTranslatedName(
  originalName: string,
  translations: ProductTranslation[],
  locale: string
): string {
  const match = translations.find((t) => t.locale === locale);
  return match?.name || originalName;
}
