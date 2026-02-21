// @ts-nocheck
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMenuItems } from "./useMenuItems";

const mockReadProducts = vi.fn();
const mockReadMenuCategories = vi.fn();

vi.mock("../infra/readers/RestaurantReader", () => ({
  readMenuCategories: (restaurantId: string) =>
    mockReadMenuCategories(restaurantId),
  readProducts: (restaurantId: string) => mockReadProducts(restaurantId),
}));

vi.mock("../core/infra/backendAdapter", () => ({
  BackendType: { docker: "docker" },
  getBackendType: () => "docker",
}));

describe("useMenuItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses custom_image_url when available", async () => {
    mockReadMenuCategories.mockResolvedValue([]);
    mockReadProducts.mockResolvedValue([
      {
        id: "prod-1",
        restaurant_id: "rest-1",
        name: "Item",
        description: null,
        price_cents: 1000,
        category_id: null,
        photo_url: null,
        custom_image_url: "https://cdn.local/custom.webp",
        asset_image_url: null,
      },
    ]);

    const { result } = renderHook(() => useMenuItems("rest-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items[0]?.photoUrl).toBe(
      "https://cdn.local/custom.webp",
    );
  });
});
