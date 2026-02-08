/**
 * Testes para normalização de path
 */

import { describe, it, expect } from "vitest";
import { normalizePath } from "./normalizePath";

describe("normalizePath", () => {
  it("remove query string", () => {
    expect(normalizePath("/config?x=1")).toBe("/config");
    expect(normalizePath("/inventory-stock?tab=alerts")).toBe(
      "/inventory-stock",
    );
  });

  it("remove hash", () => {
    expect(normalizePath("/dashboard#section")).toBe("/dashboard");
  });

  it("remove trailing slash (exceto raiz)", () => {
    expect(normalizePath("/dashboard/")).toBe("/dashboard");
    expect(normalizePath("/config/")).toBe("/config");
    expect(normalizePath("/")).toBe("/");
  });

  it("path vazia ou inválida devolve /", () => {
    expect(normalizePath("")).toBe("/");
  });

  it("combina query, hash e trailing slash", () => {
    expect(normalizePath("/tpv?demo=1#pos/")).toBe("/tpv");
  });
});
