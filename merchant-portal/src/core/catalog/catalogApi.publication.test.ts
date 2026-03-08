import { describe, expect, it } from "vitest";
import {
  duplicateCatalog,
  listCatalogAssignments,
  listCatalogs,
  saveCatalog,
  upsertCatalogAssignment,
} from "./catalogApi";

describe("catalogApi assignments", () => {
  it("creates catalogs and assignments per channel", async () => {
    const catalog = await saveCatalog({
      name: "Canal TPV",
      brandId: "brand-sofia",
      destinations: ["LOCAL"],
      isActive: true,
    });

    const assignment = await upsertCatalogAssignment({
      brandId: "brand-sofia",
      channel: "LOCAL",
      platform: "SHOP",
      catalogId: catalog.id,
    });

    const assignments = await listCatalogAssignments();
    expect(assignments.some((item) => item.id === assignment.id)).toBe(true);
    expect(assignment.catalogId).toBe(catalog.id);
  });

  it("duplicates an existing catalog", async () => {
    const catalogs = await listCatalogs();
    const source = catalogs[0];
    expect(source).toBeTruthy();

    const duplicated = await duplicateCatalog(source.id, {
      name: `${source.name} v2`,
    });

    expect(duplicated).toBeTruthy();
    expect(duplicated?.id).not.toBe(source.id);
    expect(duplicated?.name).toContain("v2");
  });
});
