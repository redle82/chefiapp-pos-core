import { describe, expect, it } from "vitest";
import { getFoodPhotoUrl } from "./foodPhotoUrls";

describe("getFoodPhotoUrl", () => {
  it("returns the drink image for the zumos category", () => {
    expect(getFoodPhotoUrl(null, "Zumos")).toBe(
      "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80",
    );
  });
});
