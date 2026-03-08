import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../infra/backendAdapter", () => ({
  isDockerBackend: vi.fn(() => true),
}));

const insertMock = vi.fn();
const singleMock = vi.fn();
const selectMock = vi.fn();

insertMock.mockImplementation(() => ({
  select: selectMock,
}));

selectMock.mockImplementation(() => ({
  single: singleMock,
}));

vi.mock("../infra/dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: insertMock,
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      select: selectMock,
    })),
  })),
}));

vi.mock("../supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("./ExceptionRegistry", () => ({
  isAuthorized: vi.fn(() => true),
}));

vi.mock("./ReconciliationEngine", () => ({
  ReconciliationEngine: {
    enqueue: vi.fn(),
  },
}));

vi.mock("../logger", () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    critical: vi.fn(),
  },
}));

import { ConstitutionalBreachError, DbWriteGate } from "./DbWriteGate";

describe("DbWriteGate (Vitest)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
  });

  it("insert delegates to Docker client and returns data on success", async () => {
    singleMock.mockResolvedValueOnce({
      data: { id: "prod-1", name: "Mock Product" },
      error: null,
    });

    const result = await DbWriteGate.insert(
      "TestCaller",
      "gm_products",
      { name: "Mock Product" },
      { tenantId: "tenant-1" },
    );

    expect(insertMock).toHaveBeenCalledWith({ name: "Mock Product" });
    expect(selectMock).toHaveBeenCalled();
    expect(result).toEqual({
      data: { id: "prod-1", name: "Mock Product" },
      error: null,
    });
  });

  it("insert mocks success in pilot mode for gm_products when Core returns error", async () => {
    (globalThis as any).localStorage.getItem = vi
      .fn()
      .mockImplementation((key: string) =>
        key === "chefiapp_pilot_mode" ? "true" : null,
      );

    singleMock.mockResolvedValueOnce({
      data: null,
      error: new Error("Core unreachable"),
    });

    const result = await DbWriteGate.insert(
      "TestCaller",
      "gm_products",
      { name: "Pilot Product" },
      { tenantId: "tenant-1" },
    );

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      name: "Pilot Product",
      id: expect.any(String),
      created_at: expect.any(String),
    });

    expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith(
      "chefiapp_pilot_mock_products",
      expect.any(String),
    );
  });

  it("does NOT mock gm_restaurants insert when running in Docker mode (must hit Core)", async () => {
    (globalThis as any).localStorage.getItem = vi
      .fn()
      .mockImplementation((key: string) =>
        key === "chefiapp_pilot_mode" ? "true" : null,
      );

    singleMock.mockResolvedValueOnce({
      data: null,
      error: new Error("Core unreachable"),
    });

    const result = await DbWriteGate.insert(
      "TestCaller",
      "gm_restaurants",
      { name: "Rest 1" },
      { tenantId: undefined },
    );

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect((globalThis as any).localStorage.setItem).not.toHaveBeenCalledWith(
      "chefiapp_pilot_mock_restaurant",
      expect.any(String),
    );
  });

  it("update throws ConstitutionalBreachError when match has no id", async () => {
    await expect(
      DbWriteGate.update(
        "TestCaller",
        "gm_products",
        { name: "Updated" },
        {},
        { tenantId: "tenant-1" },
      ),
    ).rejects.toBeInstanceOf(ConstitutionalBreachError);
  });

  it("enforce blocks unauthorized operations via ExceptionRegistry", async () => {
    const { isAuthorized } = await import("./ExceptionRegistry");
    (isAuthorized as unknown as { mockReturnValueOnce: Function })
      .mockReturnValueOnce(
      false,
    );

    await expect(
      DbWriteGate.insert(
        "UnauthorizedCaller",
        "gm_products",
        { name: "X" },
        { tenantId: "tenant-1" },
      ),
    ).rejects.toBeInstanceOf(ConstitutionalBreachError);
  });
});

