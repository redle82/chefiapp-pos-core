// @ts-nocheck
import { describe, expect, it } from "vitest";
import {
  printValidationResults,
  validateInsforgeSetup,
} from "./validateInsforgeSetup";

describe("InsForge Setup Validation", () => {
  it("runs validation suite without errors", async () => {
    const results = await validateInsforgeSetup();

    // Should return results array
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    // Each result should have required fields
    results.forEach((result) => {
      expect(result).toHaveProperty("step");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("message");
      expect(["pass", "fail", "warning", "skip"]).toContain(result.status);
    });
  });

  it("prints validation results without throwing", async () => {
    const results = await validateInsforgeSetup();

    // Should not throw when printing
    expect(() => printValidationResults(results)).not.toThrow();
  });

  it("checks environment variables", async () => {
    const results = await validateInsforgeSetup();

    // Should check INSFORGE_URL
    const urlCheck = results.find((r) => r.step.includes("INSFORGE_URL"));
    expect(urlCheck).toBeDefined();
    expect(["pass", "warning"]).toContain(urlCheck!.status);

    // Should check INSFORGE_ANON_KEY
    const keyCheck = results.find((r) => r.step.includes("INSFORGE_ANON_KEY"));
    expect(keyCheck).toBeDefined();
    expect(["pass", "warning"]).toContain(keyCheck!.status);
  });

  it("validates backend selection", async () => {
    const results = await validateInsforgeSetup();

    const backendCheck = results.find((r) =>
      r.step.includes("Backend Selection"),
    );
    expect(backendCheck).toBeDefined();
    expect(backendCheck!.status).toBe("pass");
  });

  it("validates client initialization", async () => {
    const results = await validateInsforgeSetup();

    const clientCheck = results.find((r) =>
      r.step.includes("Client Initialization"),
    );
    expect(clientCheck).toBeDefined();
    expect(["pass", "fail"]).toContain(clientCheck!.status);
  });
});
