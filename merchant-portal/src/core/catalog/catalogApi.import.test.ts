import { describe, expect, it } from "vitest";
import { listCatalogs, saveCatalog } from "./catalogApi";

describe("catalogApi catalogs", () => {
  it("creates and lists catalog contexts", async () => {
    const created = await saveCatalog({
      name: "Catálogo Importado",
      brandId: null,
      destinations: ["LOCAL"],
      isActive: true,
    });

    expect(created.name).toBe("Catálogo Importado");
    expect(created.isActive).toBe(true);

    const catalogs = await listCatalogs();
    expect(catalogs.some((catalog) => catalog.id === created.id)).toBe(true);
  });
});
