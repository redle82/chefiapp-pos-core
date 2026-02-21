// @ts-nocheck
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicMenuProvider, usePublicMenu } from "./PublicMenuContext";

const mockReadProductsByRestaurant = vi.fn();

vi.mock("../../infra/readers/ProductReader", () => ({
  readProductsByRestaurant: () => mockReadProductsByRestaurant(),
}));

describe("PublicMenuContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers custom_image_url over photo_url", async () => {
    mockReadProductsByRestaurant.mockResolvedValue([
      {
        id: "prod-1",
        name: "Item",
        description: null,
        price_cents: 1200,
        gm_menu_categories: { name: "Bebidas" },
        photo_url: "https://cdn.local/legacy.png",
        custom_image_url: "https://cdn.local/custom.webp",
        asset_image_url: null,
      },
    ]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PublicMenuProvider>{children}</PublicMenuProvider>
    );

    const { result } = renderHook(() => usePublicMenu(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products[0]?.photo_url).toBe(
      "https://cdn.local/custom.webp",
    );
  });
});
