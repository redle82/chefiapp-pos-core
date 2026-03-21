import { describe, expect, it } from "vitest";
import { classifyUnhandledRejection } from "./unhandledRejectionGuard";

describe("classifyUnhandledRejection", () => {
  it("classifies payload errors from foreign HTTP origin as suppressible", () => {
    const reason = new TypeError(
      "Cannot read properties of undefined (reading 'payload')",
    );
    (reason as Error).stack =
      "TypeError: Cannot read properties of undefined (reading 'payload')\n    at run (https://cdn.example-third-party.net/giveFreely.js:1:56455)";

    const result = classifyUnhandledRejection(reason, {
      appOrigin: "http://localhost:5175",
    });

    expect(result.suppress).toBe(true);
    expect(result.code).toBe("external-runtime-payload");
  });

  it("keeps app/internal unhandled rejections visible", () => {
    const reason = new TypeError(
      "Cannot read properties of undefined (reading 'payload')",
    );
    (reason as Error).stack =
      "TypeError: Cannot read properties of undefined (reading 'payload')\n    at processEvent (http://localhost:5175/src/core/tasks/EventMonitor.ts:120:10)";

    const result = classifyUnhandledRejection(reason, {
      appOrigin: "http://localhost:5175",
    });

    expect(result.suppress).toBe(false);
    expect(result.code).toBe("unhandled-rejection");
  });

  it("suppresses payload errors coming from browser extensions", () => {
    const reason = new TypeError(
      "Cannot read properties of undefined (reading 'payload')",
    );
    (reason as Error).stack =
      "TypeError: Cannot read properties of undefined (reading 'payload')\n    at run (chrome-extension://abcdefghijklmnop/content-script.js:2:1444)";

    const result = classifyUnhandledRejection(reason, {
      appOrigin: "http://localhost:5175",
    });

    expect(result.suppress).toBe(true);
    expect(result.code).toBe("external-runtime-payload");
  });
});
