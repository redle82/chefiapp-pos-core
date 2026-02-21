import { describe, expect, it } from "vitest";
import { resolveProductImageUrl } from "./resolveProductImageUrl";

describe("resolveProductImageUrl", () => {
  it("prefers custom image when available", () => {
    const result = resolveProductImageUrl({
      custom_image_url: "https://cdn.local/custom.png",
      asset_image_url: "https://cdn.local/asset.png",
      photo_url: "https://cdn.local/photo.png",
    });

    expect(result).toBe("https://cdn.local/custom.png");
  });

  it("falls back to asset image when no custom image", () => {
    const result = resolveProductImageUrl({
      custom_image_url: null,
      asset_image_url: "https://cdn.local/asset.png",
      photo_url: "https://cdn.local/photo.png",
    });

    expect(result).toBe("https://cdn.local/asset.png");
  });

  it("falls back to product photo when no custom or asset image", () => {
    const result = resolveProductImageUrl({
      custom_image_url: null,
      asset_image_url: null,
      photo_url: "https://cdn.local/photo.png",
    });

    expect(result).toBe("https://cdn.local/photo.png");
  });

  it("returns null when no images are available", () => {
    const result = resolveProductImageUrl({
      custom_image_url: null,
      asset_image_url: null,
      photo_url: null,
    });

    expect(result).toBeNull();
  });
});
