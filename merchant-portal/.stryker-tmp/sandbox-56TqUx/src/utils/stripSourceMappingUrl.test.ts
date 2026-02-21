// @ts-nocheck
import { describe, expect, it } from "vitest";
import { stripSourceMappingUrl } from "./stripSourceMappingUrl";

describe("stripSourceMappingUrl", () => {
  it("removes JS sourceMappingURL comments", () => {
    const input = "console.log('x');\n//# sourceMappingURL=foo.js.map";

    expect(stripSourceMappingUrl(input)).toBe("console.log('x');\n");
  });

  it("removes CSS sourceMappingURL comments", () => {
    const input = "body{}\n/*# sourceMappingURL=foo.css.map */";

    expect(stripSourceMappingUrl(input)).toBe("body{}\n");
  });

  it("leaves code without sourcemaps untouched", () => {
    const input = "console.log('x');";

    expect(stripSourceMappingUrl(input)).toBe(input);
  });
});
