import { ConsoleTransport } from "../../../../merchant-portal/src/core/logger/transports/ConsoleTransport";
import type { LogPayload } from "../../../../merchant-portal/src/core/logger/transports/ILogTransport";

function makePayload(level: LogPayload["level"] = "info", message = "test"): LogPayload {
  return { level, timestamp: new Date().toISOString(), message, data: { foo: "bar" }, meta: {} };
}

describe("ConsoleTransport", () => {
  it("should handle all levels", () => {
    const t = new ConsoleTransport(true);
    expect(t.shouldHandle("debug")).toBe(true);
    expect(t.shouldHandle("critical")).toBe(true);
  });

  it("should log via console", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const t = new ConsoleTransport(false);
    t.log(makePayload("error"));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
