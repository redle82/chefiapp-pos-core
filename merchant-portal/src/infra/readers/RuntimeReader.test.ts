import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared dockerCoreClient.from mock
const fromMock = vi.fn();

vi.mock("../docker-core/connection", () => ({
  dockerCoreClient: {
    from: (table: string) => fromMock(table),
  },
}));

vi.mock("../../core/logger", () => ({
  Logger: {
    warn: vi.fn(),
  },
}));

const assertValidRestaurantIdMock = vi.fn();
vi.mock("../../core/kernel/RuntimeContext", () => ({
  assertValidRestaurantId: assertValidRestaurantIdMock,
}));

const setTabIsolatedMock = vi.fn();
const removeTabIsolatedMock = vi.fn();
vi.mock("../../core/storage/TabIsolatedStorage", () => ({
  setTabIsolated: setTabIsolatedMock,
  removeTabIsolated: removeTabIsolatedMock,
}));

type PostgrestResult<T> = { data: T | null; error: any };

function createChain<T>(result: PostgrestResult<T>) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: () => Promise.resolve(result),
  };
  chain.then = (fn: (r: PostgrestResult<T>) => any) =>
    Promise.resolve(result).then(fn);
  return chain;
}

function createListChain<T>(result: PostgrestResult<T[]>) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
  };
  chain.then = (fn: (r: PostgrestResult<T[]>) => any) =>
    Promise.resolve(result).then(fn);
  return chain;
}

describe("RuntimeReader – Core DB integration helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
    setTabIsolatedMock.mockReset();
    removeTabIsolatedMock.mockReset();
    assertValidRestaurantIdMock.mockReset();
    // jsdom already fornece window/localStorage; garantir clean slate
    window.localStorage.clear();
  });

  it("restaurantExistsInCore devolve true quando linha existe", async () => {
    fromMock.mockReturnValue(
      createChain({ data: { id: "r1" }, error: null }),
    );
    const { restaurantExistsInCore } = await import("./RuntimeReader");

    const exists = await restaurantExistsInCore("r1");

    expect(fromMock).toHaveBeenCalledWith("gm_restaurants");
    expect(exists).toBe(true);
  });

  it("restaurantExistsInCore devolve false quando há erro ou sem dados", async () => {
    fromMock.mockReturnValue(
      createChain({ data: null, error: { message: "fail" } }),
    );
    const { restaurantExistsInCore } = await import("./RuntimeReader");

    const exists = await restaurantExistsInCore("r1");

    expect(exists).toBe(false);
  });

  it("restaurantExistsInCore devolve true em Supabase quando erro é 'does not exist' (schema)", async () => {
    const { CONFIG } = await import("../../config");
    const spy = vi.spyOn(CONFIG, "isSupabaseBackend", "get").mockReturnValue(true);

    fromMock.mockReturnValue(
      createChain({
        data: null,
        error: { message: 'column "disabled_at" does not exist' },
      }),
    );
    const { restaurantExistsInCore } = await import("./RuntimeReader");

    const exists = await restaurantExistsInCore("r1");

    expect(exists).toBe(true);
    spy.mockRestore();
  });

  it("fetchFirstRestaurantId devolve id da primeira linha ordenada por created_at", async () => {
    fromMock.mockReturnValue(
      createListChain({
        data: [{ id: "r1" }, { id: "r2" }],
        error: null,
      }),
    );
    const { fetchFirstRestaurantId } = await import("./RuntimeReader");

    const id = await fetchFirstRestaurantId();

    expect(fromMock).toHaveBeenCalledWith("gm_restaurants");
    expect(id).toBe("r1");
  });

  it("fetchFirstRestaurantId devolve null em erro", async () => {
    fromMock.mockReturnValue(
      createListChain({ data: null, error: { message: "boom" } }),
    );
    const { fetchFirstRestaurantId } = await import("./RuntimeReader");

    const id = await fetchFirstRestaurantId();

    expect(id).toBeNull();
  });

  it("fetchInstalledModules devolve ids de módulos ativos", async () => {
    fromMock.mockReturnValue(
      createListChain({
        data: [
          { module_id: "tpv" },
          { module_id: "kds" },
        ],
        error: null,
      }),
    );
    const { fetchInstalledModules } = await import("./RuntimeReader");

    const modules = await fetchInstalledModules("r1");

    expect(fromMock).toHaveBeenCalledWith("installed_modules");
    expect(modules).toEqual(["tpv", "kds"]);
  });

  it("fetchInstalledModules devolve [] quando a query falha", async () => {
    fromMock.mockReturnValue(
      createListChain({ data: null, error: { message: "fail" } }),
    );
    const { fetchInstalledModules } = await import("./RuntimeReader");

    const modules = await fetchInstalledModules("r1");

    expect(modules).toEqual([]);
  });

  it("fetchSetupStatus devolve sections quando existentes", async () => {
    fromMock.mockReturnValue(
      createChain({
        data: {
          sections: { identity: true, location: false },
        },
        error: null,
      }),
    );
    const { fetchSetupStatus } = await import("./RuntimeReader");

    const sections = await fetchSetupStatus("r1");

    expect(fromMock).toHaveBeenCalledWith("restaurant_setup_status");
    expect(sections).toEqual({ identity: true, location: false });
  });

  it("fetchSetupStatus devolve {} quando não há dados ou erro", async () => {
    fromMock.mockReturnValue(
      createChain({ data: null, error: { message: "x" } }),
    );
    const { fetchSetupStatus } = await import("./RuntimeReader");

    const sections = await fetchSetupStatus("r1");

    expect(sections).toEqual({});
  });

  it("getOrCreateRestaurantId reutiliza id válido do localStorage", async () => {
    window.localStorage.setItem("chefiapp_restaurant_id", "r-existing");
    // restaurantExistsInCore devolve true
    fromMock.mockReturnValue(
      createChain({ data: { id: "r-existing" }, error: null }),
    );

    const { getOrCreateRestaurantId } = await import("./RuntimeReader");

    const id = await getOrCreateRestaurantId();

    expect(id).toBe("r-existing");
    expect(assertValidRestaurantIdMock).toHaveBeenCalledWith("r-existing");
  });

  it("getOrCreateRestaurantId limpa id inválido e tenta members depois restaurants", async () => {
    window.localStorage.setItem("chefiapp_restaurant_id", "mock-invalid");
    // Supabase: 1º gm_restaurant_members, 2º gm_restaurants. Ambas sem dados → null (em dev seria SEED).
    fromMock
      .mockReturnValueOnce(
        createChain({ data: null, error: { message: "not found" } }),
      )
      .mockReturnValueOnce(
        createChain({ data: null, error: { message: "not found" } }),
      );

    const { getOrCreateRestaurantId } = await import("./RuntimeReader");

    const id = await getOrCreateRestaurantId();

    // Ambas as fontes falham → null (Vitest não é dev; no browser em dev devolveria SEED_RESTAURANT_ID)
    expect(id).toBeNull();
    expect(window.localStorage.getItem("chefiapp_restaurant_id")).toBeNull();
  });
});

