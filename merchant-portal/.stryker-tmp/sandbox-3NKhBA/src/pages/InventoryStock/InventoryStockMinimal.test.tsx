// @ts-nocheck
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as InventoryStockReader from "../../infra/readers/InventoryStockReader";
import { InventoryStockMinimal } from "./InventoryStockMinimal";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../core/identity/useRestaurantIdentity", () => ({
  useRestaurantIdentity: () => ({
    identity: { restaurantId: "rest-1" },
  }),
}));

const mockRpc = vi.fn();

vi.mock("../../infra/docker-core/connection", () => ({
  dockerCoreClient: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

vi.mock("../../infra/readers/InventoryStockReader", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../infra/readers/InventoryStockReader")
  >();
  return {
    ...actual,
    readLocations: vi.fn().mockResolvedValue([]),
    readEquipment: vi.fn().mockResolvedValue([]),
    readIngredients: vi.fn().mockResolvedValue([]),
    readStockLevels: vi.fn().mockResolvedValue([]),
    readProductBOM: vi.fn().mockResolvedValue([]),
    readEquipmentIngredients: vi.fn().mockResolvedValue([]),
    lookupIngredientByBarcode: vi.fn().mockResolvedValue({ found: false }),
    associateBarcode: vi.fn().mockResolvedValue(true),
    listIngredientPacks: vi
      .fn()
      .mockResolvedValue([{ pack: "BAR_RESTAURANT", count: 33 }]),
    importIngredientPack: vi
      .fn()
      .mockResolvedValue({ imported: 33, skipped: 0, total_in_pack: 33 }),
  };
});

describe("InventoryStockMinimal", () => {
  it("navigates back to modules config", async () => {
    const user = userEvent.setup();

    render(<InventoryStockMinimal />);

    const backButton = await screen.findByRole("button", {
      name: /voltar/i,
    });

    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/modules");
  });

  it("submits a stock movement via RPC", async () => {
    const user = userEvent.setup();

    vi.mocked(InventoryStockReader.readLocations).mockResolvedValue([
      {
        id: "loc-1",
        restaurant_id: "rest-1",
        name: "Armazem",
        kind: "STORAGE",
      },
    ]);
    vi.mocked(InventoryStockReader.readIngredients).mockResolvedValue([
      {
        id: "ing-1",
        restaurant_id: "rest-1",
        name: "Cebola",
        unit: "kg",
      },
    ]);
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });

    render(<InventoryStockMinimal />);

    await user.click(
      await screen.findByRole("button", { name: /movimentos/i }),
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /tipo de movimento/i }),
      "IN",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /ingrediente/i }),
      "ing-1",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /local/i }),
      "loc-1",
    );
    await user.type(screen.getByLabelText(/quantidade/i), "5");
    await user.type(screen.getByLabelText(/motivo/i), "Compra");

    await user.click(screen.getByRole("button", { name: /registrar/i }));

    expect(mockRpc).toHaveBeenCalledWith("apply_stock_movement", {
      p_restaurant_id: "rest-1",
      p_action: "IN",
      p_ingredient_id: "ing-1",
      p_location_id: "loc-1",
      p_qty: 5,
      p_reason: "Compra",
      p_target_location_id: null,
      p_unit_cost: null,
    });
  });

  it("renders the Scan tab", async () => {
    const user = userEvent.setup();

    vi.mocked(InventoryStockReader.readLocations).mockResolvedValue([
      {
        id: "loc-1",
        restaurant_id: "rest-1",
        name: "Armazem",
        kind: "STORAGE",
      },
    ]);
    vi.mocked(InventoryStockReader.readIngredients).mockResolvedValue([
      {
        id: "ing-1",
        restaurant_id: "rest-1",
        name: "Cebola",
        unit: "kg",
      },
    ]);

    render(<InventoryStockMinimal />);

    // Find the Scan tab button specifically (not the quick-scan bar)
    const scanTab = await screen.findByRole("button", { name: /📷\s*scan/i });
    await user.click(scanTab);

    expect(screen.getByPlaceholderText(/leia com o scanner/i)).toBeTruthy();
  });

  it("renders ingredient category and barcode badges", async () => {
    vi.mocked(InventoryStockReader.readIngredients).mockResolvedValue([
      {
        id: "ing-1",
        restaurant_id: "rest-1",
        name: "Tomate",
        unit: "kg",
        category: "HORTALIÇA" as InventoryStockReader.IngredientCategory,
        barcode: "5601234567890",
        cost_per_unit: 2.5,
      },
    ]);

    render(<InventoryStockMinimal />);

    const ingredientTab = await screen.findByRole("button", {
      name: /ingredientes/i,
    });
    await userEvent.setup().click(ingredientTab);

    await screen.findByText("Tomate");
    await screen.findByText(/hortaliças/i);
    await screen.findByText(/5601234567890/);
    await screen.findByText(/2\.50/);
  });

  it("shows import pack dialog when clicking import button", async () => {
    const user = userEvent.setup();

    render(<InventoryStockMinimal />);

    const ingredientTab = await screen.findByRole("button", {
      name: /ingredientes/i,
    });
    await user.click(ingredientTab);

    const importBtn = screen.getByRole("button", { name: /importar pack/i });
    await user.click(importBtn);

    await screen.findByText(/packs de ingredientes/i);
  });
});
