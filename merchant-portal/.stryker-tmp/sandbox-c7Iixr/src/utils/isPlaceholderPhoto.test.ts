import { describe, expect, it } from "vitest";
import { getTrustedPhotoUrl, isPlaceholderPhoto } from "./isPlaceholderPhoto";

describe("isPlaceholderPhoto", () => {
  it("flags source.unsplash.com as a placeholder", () => {
    expect(
      isPlaceholderPhoto(
        "https://source.unsplash.com/featured/800x800?croissant",
      ),
    ).toBe(true);
  });

  it("does not flag images.unsplash.com", () => {
    expect(
      isPlaceholderPhoto(
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
      ),
    ).toBe(false);
  });
});

describe("getTrustedPhotoUrl", () => {
  it("returns null for placeholder urls", () => {
    expect(
      getTrustedPhotoUrl("https://source.unsplash.com/featured/800x800?coffee"),
    ).toBeNull();
  });

  it("returns the url for non-placeholder urls", () => {
    const url =
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80";
    expect(getTrustedPhotoUrl(url)).toBe(url);
  });
});
