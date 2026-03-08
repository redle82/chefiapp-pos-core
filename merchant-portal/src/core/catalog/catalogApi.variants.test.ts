import { describe, expect, it } from "vitest";
import { listCombos, saveCombo } from "./catalogApi";

describe("catalogApi combos", () => {
  it("creates and lists combos", async () => {
    const created = await saveCombo({
      name: "Combo almoço",
      priceCents: 1290,
      isActive: true,
      items: [],
    });

    expect(created.name).toBe("Combo almoço");

    const combos = await listCombos();
    expect(combos.some((item) => item.id === created.id)).toBe(true);
  });
});
