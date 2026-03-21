import { beforeEach, describe, expect, it, vi } from "vitest";
import * as catalogApi from "./catalogApi";
import { useCatalogStore } from "./catalogStore";

vi.mock("./catalogApi", async () => {
  const actual = await vi.importActual<typeof catalogApi>("./catalogApi");
  return {
    ...actual,
    listCatalogs: vi.fn(),
    listCatalogAssignments: vi.fn(),
    listCategories: vi.fn(),
    listProducts: vi.fn(),
    listModifierGroups: vi.fn(),
    listModifiers: vi.fn(),
    listCombos: vi.fn(),
    listTranslations: vi.fn(),
  };
});

describe("catalogStore.loadAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (catalogApi.listCatalogs as any).mockResolvedValue([]);
    (catalogApi.listCatalogAssignments as any).mockResolvedValue([]);
    (catalogApi.listCategories as any).mockResolvedValue([]);
    (catalogApi.listProducts as any).mockResolvedValue([]);
    (catalogApi.listModifierGroups as any).mockResolvedValue([]);
    (catalogApi.listModifiers as any).mockResolvedValue([]);
    (catalogApi.listCombos as any).mockResolvedValue([]);
    (catalogApi.listTranslations as any).mockResolvedValue([]);
    useCatalogStore.setState({ error: null });
  });

  it("loadAll rejects and sets error when one of the 8 API calls fails", async () => {
    (catalogApi.listProducts as any).mockRejectedValue(
      new Error("Network error"),
    );

    await useCatalogStore.getState().loadAll("rest-1");

    expect(useCatalogStore.getState().error).toBe("Network error");
    expect(useCatalogStore.getState().loading).toBe(false);
  });

  it("loadAll rejects and sets error when listCatalogs fails", async () => {
    (catalogApi.listCatalogs as any).mockRejectedValue(
      new Error("Catalog API failed"),
    );

    await useCatalogStore.getState().loadAll("rest-1");

    expect(useCatalogStore.getState().error).toBe("Catalog API failed");
    expect(useCatalogStore.getState().loading).toBe(false);
  });

  it("loadAll succeeds and clears error when all calls succeed", async () => {
    useCatalogStore.setState({ error: "previous error" });

    await useCatalogStore.getState().loadAll("rest-1");

    expect(useCatalogStore.getState().error).toBeNull();
    expect(useCatalogStore.getState().loading).toBe(false);
    expect(catalogApi.listCatalogs).toHaveBeenCalled();
    expect(catalogApi.listProducts).toHaveBeenCalled();
  });
});
