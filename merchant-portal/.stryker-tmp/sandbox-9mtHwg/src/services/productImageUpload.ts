import { CONFIG } from "../config";

export async function uploadProductImage(params: {
  restaurantId: string;
  productId: string;
  file: File;
}): Promise<{ imageUrl: string }> {
  if (!CONFIG.INTERNAL_API_TOKEN) {
    throw new Error("Internal API token not configured");
  }

  const base64 = await fileToBase64(params.file);
  const response = await fetch(`${CONFIG.API_BASE}/internal/product-images`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": CONFIG.INTERNAL_API_TOKEN,
    },
    body: JSON.stringify({
      restaurant_id: params.restaurantId,
      product_id: params.productId,
      mime: params.file.type || "image/jpeg",
      data_base64: base64,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Image upload failed");
  }

  const data = (await response.json()) as { image_url?: string };
  if (!data.image_url) {
    throw new Error("Image upload failed");
  }
  return { imageUrl: data.image_url };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
