import { dockerCoreClient } from "../docker-core/connection";

export interface ProductAsset {
  id: string;
  category: string;
  label: string;
  image_url: string;
  is_generic: boolean;
  created_at?: string;
}

export async function readProductAssets(
  category?: string,
): Promise<ProductAsset[]> {
  let query = dockerCoreClient.from("gm_product_assets").select("*");
  if (category) {
    query = query.eq("category", category);
  }
  const { data, error } = await query.order("label", { ascending: true });
  if (error) return [];
  return (data ?? []) as ProductAsset[];
}
