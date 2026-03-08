import { describe, expect, it } from "vitest";
import {
  listModifierGroups,
  listModifiers,
  saveModifier,
  saveModifierGroup,
} from "./catalogApi";

describe("catalogApi modifiers", () => {
  it("creates and lists modifier groups", async () => {
    const created = await saveModifierGroup({
      name: "Tamanhos",
      min: 0,
      max: 1,
    });

    expect(created.name).toBe("Tamanhos");

    const groups = await listModifierGroups();
    expect(groups.some((item) => item.id === created.id)).toBe(true);
  });

  it("creates and lists modifiers", async () => {
    const group = await saveModifierGroup({
      name: "Molhos",
      min: 0,
      max: 2,
    });

    const created = await saveModifier({
      groupId: group.id,
      name: "Picante",
      priceDeltaCents: 50,
      isActive: true,
    });

    expect(created.groupId).toBe(group.id);

    const modifiers = await listModifiers();
    expect(modifiers.some((item) => item.id === created.id)).toBe(true);
  });
});
