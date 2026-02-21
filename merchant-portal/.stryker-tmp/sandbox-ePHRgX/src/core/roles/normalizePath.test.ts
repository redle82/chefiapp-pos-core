/**
 * Testes para normalização de path
 */
// @ts-nocheck


import { describe, expect, it } from "vitest";
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
    expect(normalizePath("/tpv?trial=1#pos/")).toBe("/tpv");
  });
});
