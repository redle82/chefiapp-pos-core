import path from "node:path";

import { resolveProtocolAppEntryArg } from "../../../desktop-app/src/protocolAppEntry";

describe("resolveProtocolAppEntryArg", () => {
  it("prefers appPath over argv1 when both are present", () => {
    const appPath = "/Users/test/chefiapp-pos-core/desktop-app";
    const argv1 = "/Users/test/chefiapp-pos-core";

    const result = resolveProtocolAppEntryArg({ appPath, argv1 });

    expect(result).toBe(path.resolve(appPath));
  });

  it("ignores invalid argv placeholders and uses appPath", () => {
    const appPath = "/Users/test/chefiapp-pos-core/desktop-app";

    const result = resolveProtocolAppEntryArg({
      appPath,
      argv1: "path-to-app",
    });

    expect(result).toBe(path.resolve(appPath));
  });

  it("falls back to argv1 when appPath is empty", () => {
    const argv1 = "/Users/test/chefiapp-pos-core/desktop-app";

    const result = resolveProtocolAppEntryArg({ appPath: "", argv1 });

    expect(result).toBe(path.resolve(argv1));
  });
});
